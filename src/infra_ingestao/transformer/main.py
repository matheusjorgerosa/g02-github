import gzip
import io
import json
import os
import logging
from datetime import datetime

from flask import Flask, request, jsonify
from google.cloud import storage
from google.cloud import bigquery as bq
from google.api_core.exceptions import NotFound
import pyarrow as pa
import pyarrow.parquet
from pyiceberg.catalog.sql import SqlCatalog, SqlCatalogBaseTable
from pyiceberg.schema import Schema
from pyiceberg.types import (
    NestedField,
    StringType,
    TimestampType,
    DoubleType,
    IntegerType,
)
from pyiceberg.partitioning import PartitionSpec, PartitionField
from pyiceberg.transforms import DayTransform
from pyiceberg.table.sorting import SortOrder

from google.cloud.sql.connector import Connector
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DatabaseError, OperationalError, ProgrammingError

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Config ---
GCS_BUCKET = os.environ.get("GCS_BUCKET", "")
GCP_PROJECT = os.environ.get("GCP_PROJECT", "")
ICEBERG_WAREHOUSE = os.environ.get("ICEBERG_WAREHOUSE", "")
DB_USER = os.environ.get("DB_USER", "iceberg")
DB_PASS = os.environ.get("DB_PASS", "")
DB_NAME = os.environ.get("DB_NAME", "iceberg")
INSTANCE_CONNECTION_NAME = os.environ.get("INSTANCE_CONNECTION_NAME", "")

TABLE_IDENTIFIER = "default.ingestao"
BQ_TABLE = f"{GCP_PROJECT}.trusted.ingestao"
IDEMPOTENCY_TABLE = "ingestion_idempotency"

ICEBERG_SCHEMA = Schema(
    NestedField(1, "latitude", DoubleType(), required=False),
    NestedField(2, "longitude", DoubleType(), required=False),
    NestedField(3, "idade", IntegerType(), required=False),
    NestedField(4, "classe_social", StringType(), required=False),
    NestedField(5, "genero", StringType(), required=False),
    NestedField(6, "ingested_at", TimestampType(), required=True),
    NestedField(7, "source_file", StringType(), required=True),
)

PARTITION_SPEC = PartitionSpec(
    PartitionField(
        source_id=6,  # ingested_at
        field_id=1000,
        transform=DayTransform(),
        name="ingested_day",
    )
)

# --- Cloud SQL Connector (singleton) ---
connector = Connector()


def get_pg_conn():
    """Cria conexão com Cloud SQL via Cloud SQL Python Connector."""
    return connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
    )


# --- Custom SqlCatalog que aceita engine externo ---
class CloudSqlCatalog(SqlCatalog):
    """SqlCatalog que usa um engine externo (Cloud SQL Connector)
    em vez de criar um a partir da URI."""

    def __init__(self, name: str, engine, **properties):
        # Atribuir o engine ANTES de chamar o __init__ do pai.
        self.engine = engine
        # Chamar o __init__ do avô (MetastoreCatalog) para evitar
        # que SqlCatalog.__init__ crie outro engine.
        from pyiceberg.catalog import MetastoreCatalog
        MetastoreCatalog.__init__(self, name, **properties)
        self._warehouse_location = properties.get("warehouse", "")
        # Criar as tabelas do catálogo com nosso engine
        self._ensure_tables_exist()

    def _ensure_tables_exist(self) -> None:
        """Override que captura DatabaseError (pg8000) além de
        OperationalError/ProgrammingError."""
        from pyiceberg.catalog.sql import IcebergTables, IcebergNamespaceProperties
        from sqlalchemy.orm import Session
        from sqlalchemy import select

        with Session(self.engine) as session:
            for table in [IcebergTables, IcebergNamespaceProperties]:
                stmt = select(1).select_from(table)
                try:
                    session.scalar(stmt)
                except (OperationalError, ProgrammingError, DatabaseError):
                    logger.info("Tabelas do catálogo não existem, criando...")
                    self.create_tables()
                    return


# --- Catálogo Iceberg (singleton por processo) ---
_catalog = None
_engine = None


def ensure_idempotency_table():
    """Cria tabela de idempotência no mesmo Cloud SQL do catálogo Iceberg."""
    engine = _get_engine()
    with engine.begin() as conn:
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {IDEMPOTENCY_TABLE} (
                idempotency_key TEXT PRIMARY KEY,
                bucket_name TEXT NOT NULL,
                object_name TEXT NOT NULL,
                object_generation TEXT NOT NULL,
                event_id TEXT,
                status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
                attempt_count INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMPTZ,
                failed_at TIMESTAMPTZ,
                last_error TEXT
            )
        """))
        conn.execute(text(f"""
            CREATE INDEX IF NOT EXISTS idx_{IDEMPOTENCY_TABLE}_status
            ON {IDEMPOTENCY_TABLE} (status)
        """))


def build_idempotency_key(bucket_name: str, object_name: str, object_generation: str) -> str:
    """Monta chave canônica de idempotência para object.finalized."""
    return f"{bucket_name}|{object_name}|{object_generation}"


def claim_event_processing(
    idempotency_key: str,
    bucket_name: str,
    object_name: str,
    object_generation: str,
    event_id: str | None = None,
) -> tuple[bool, str]:
    """Tenta adquirir processamento exclusivo para a chave.

    Retorno:
      - (True, "claimed_new") quando o evento pode ser processado
      - (False, "duplicate_completed") quando já foi concluído
      - (False, "duplicate_in_progress") quando já está em processamento
      - (False, "already_failed") quando houve falha registrada anteriormente
    """
    engine = _get_engine()

    with engine.begin() as conn:
        insert_result = conn.execute(
            text(f"""
                INSERT INTO {IDEMPOTENCY_TABLE} (
                    idempotency_key,
                    bucket_name,
                    object_name,
                    object_generation,
                    event_id,
                    status,
                    attempt_count,
                    created_at,
                    updated_at
                )
                VALUES (
                    :idempotency_key,
                    :bucket_name,
                    :object_name,
                    :object_generation,
                    :event_id,
                    'processing',
                    1,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (idempotency_key) DO NOTHING
            """),
            {
                "idempotency_key": idempotency_key,
                "bucket_name": bucket_name,
                "object_name": object_name,
                "object_generation": object_generation,
                "event_id": event_id,
            },
        )

        if insert_result.rowcount == 1:
            return True, "claimed_new"

        current = conn.execute(
            text(f"""
                SELECT status
                FROM {IDEMPOTENCY_TABLE}
                WHERE idempotency_key = :idempotency_key
                FOR UPDATE
            """),
            {"idempotency_key": idempotency_key},
        ).mappings().first()

        if not current:
            return False, "already_failed"

        current_status = current["status"]

        conn.execute(
            text(f"""
                UPDATE {IDEMPOTENCY_TABLE}
                SET attempt_count = attempt_count + 1,
                    updated_at = NOW()
                WHERE idempotency_key = :idempotency_key
            """),
            {"idempotency_key": idempotency_key},
        )

        if current_status == "completed":
            return False, "duplicate_completed"
        if current_status == "processing":
            return False, "duplicate_in_progress"

        return False, "already_failed"


def mark_event_completed(idempotency_key: str):
    """Marca chave de idempotência como concluída."""
    engine = _get_engine()
    with engine.begin() as conn:
        conn.execute(
            text(f"""
                UPDATE {IDEMPOTENCY_TABLE}
                SET status = 'completed',
                    completed_at = NOW(),
                    updated_at = NOW(),
                    last_error = NULL
                WHERE idempotency_key = :idempotency_key
            """),
            {"idempotency_key": idempotency_key},
        )


def mark_event_failed(idempotency_key: str, error_message: str):
    """Marca chave de idempotência como falha para auditoria/manual fix."""
    engine = _get_engine()
    with engine.begin() as conn:
        conn.execute(
            text(f"""
                UPDATE {IDEMPOTENCY_TABLE}
                SET status = 'failed',
                    failed_at = NOW(),
                    updated_at = NOW(),
                    last_error = :error_message
                WHERE idempotency_key = :idempotency_key
            """),
            {
                "idempotency_key": idempotency_key,
                "error_message": error_message,
            },
        )


def _get_engine():
    """Retorna engine SQLAlchemy singleton com Cloud SQL Connector."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            "postgresql+pg8000://",
            creator=get_pg_conn,
        )
        with _engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info(f"Cloud SQL conectado: {result.scalar()}")
        ensure_idempotency_table()
    return _engine


def get_catalog():
    """Retorna SqlCatalog conectado ao PostgreSQL no Cloud SQL."""
    global _catalog
    if _catalog is not None:
        return _catalog

    engine = _get_engine()

    _catalog = CloudSqlCatalog(
        name="default",
        engine=engine,
        **{
            "warehouse": ICEBERG_WAREHOUSE,
            "uri": "postgresql+pg8000://",
        },
    )

    logger.info("Catálogo Iceberg inicializado com Cloud SQL")
    return _catalog


def get_or_create_table():
    """Garante que namespace e tabela existem, retorna a tabela."""
    catalog = get_catalog()

    try:
        catalog.create_namespace("default")
        logger.info("Namespace 'default' criado")
    except Exception as e:
        logger.debug(f"Namespace já existe ou erro: {e}")

    try:
        table = catalog.load_table(TABLE_IDENTIFIER)
        logger.info(f"Tabela '{TABLE_IDENTIFIER}' carregada")
        return table
    except FileNotFoundError:
        # Catálogo aponta para metadata que não existe no GCS.
        # Dropar a entrada corrompida e recriar.
        logger.warning(f"Tabela '{TABLE_IDENTIFIER}' corrompida no catálogo (metadata ausente). Recriando...")
        try:
            catalog.drop_table(TABLE_IDENTIFIER)
        except Exception as drop_err:
            logger.warning(f"Erro ao dropar tabela corrompida: {drop_err}")
    except Exception as e:
        # NoSuchTableError ou qualquer outro → tabela não existe
        logger.info(f"Tabela não encontrada: {e}")

    # Criar a tabela
    table = catalog.create_table(
        identifier=TABLE_IDENTIFIER,
        schema=ICEBERG_SCHEMA,
        partition_spec=PARTITION_SPEC,
        sort_order=SortOrder(),
    )
    logger.info(f"Tabela '{TABLE_IDENTIFIER}' criada")
    return table


# --- Funções de processamento ---


def download_and_decompress(bucket_name: str, object_name: str) -> list[dict]:
    """Baixa .json.gz do GCS e retorna lista de dicts."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)

    compressed_data = blob.download_as_bytes(raw_download=True)
    json_data = gzip.decompress(compressed_data)
    records = json.loads(json_data)

    if isinstance(records, dict):
        records = [records]

    return records


def deduplicate(records: list[dict]) -> list[dict]:
    """Remove duplicatas por conteúdo completo."""
    seen = set()
    unique = []
    for record in records:
        key = json.dumps(record, sort_keys=True)
        if key not in seen:
            seen.add(key)
            unique.append(record)
    return unique


def transform_and_write(records: list[dict], source_file: str):
    """Converte registros para PyArrow e faz append na tabela Iceberg.
    Em seguida, carrega os mesmos dados no BigQuery (dual-write)."""
    now = datetime.utcnow()

    arrow_schema = pa.schema([
        pa.field("latitude", pa.float64(), nullable=True),
        pa.field("longitude", pa.float64(), nullable=True),
        pa.field("idade", pa.int32(), nullable=True),
        pa.field("classe_social", pa.string(), nullable=True),
        pa.field("genero", pa.string(), nullable=True),
        pa.field("ingested_at", pa.timestamp("us"), nullable=False),
        pa.field("source_file", pa.string(), nullable=False),
    ])

    def _to_float(val):
        try:
            return float(val) if val is not None else None
        except (TypeError, ValueError):
            return None

    def _to_int(val):
        try:
            return int(val) if val is not None else None
        except (TypeError, ValueError):
            return None

    arrow_table = pa.table(
        {
            "latitude": pa.array(
                [_to_float(r.get("latitude")) for r in records], type=pa.float64()
            ),
            "longitude": pa.array(
                [_to_float(r.get("longitude")) for r in records], type=pa.float64()
            ),
            "idade": pa.array(
                [_to_int(r.get("idade")) for r in records], type=pa.int32()
            ),
            "classe_social": pa.array(
                [str(r["classe_social"]) if r.get("classe_social") is not None else None for r in records],
                type=pa.string(),
            ),
            "genero": pa.array(
                [str(r["genero"]) if r.get("genero") is not None else None for r in records],
                type=pa.string(),
            ),
            "ingested_at": pa.array([now] * len(records), type=pa.timestamp("us")),
            "source_file": pa.array(
                [source_file] * len(records), type=pa.string()
            ),
        },
        schema=arrow_schema,
    )

    # 1. Append no Iceberg (source of truth)
    table = get_or_create_table()
    table.append(arrow_table)
    logger.info(f"Escritos {len(records)} registros na tabela Iceberg ({source_file})")

    # 2. Load no BigQuery (dual-write)
    # Se falhar, propaga para a camada de idempotência marcar 'failed'.
    load_to_bigquery(arrow_table, now, source_file, len(records))


def load_to_bigquery(arrow_table: pa.Table, ingested_at: datetime, source_file: str, num_records: int):
    """Carrega dados no BigQuery como tabela nativa (append)."""
    client = bq.Client(project=GCP_PROJECT)

    # Adicionar coluna ingested_day (DATE) para partitioning
    ingested_day = ingested_at.date()
    bq_table = arrow_table.append_column(
        "ingested_day",
        pa.array([ingested_day] * num_records, type=pa.date32()),
    )

    job_config = bq.LoadJobConfig(
        write_disposition=bq.WriteDisposition.WRITE_APPEND,
        source_format=bq.SourceFormat.PARQUET,
    )

    # Converter Arrow → Parquet em memória
    buf = io.BytesIO()
    pa.parquet.write_table(bq_table, buf)
    buf.seek(0)

    job = client.load_table_from_file(buf, BQ_TABLE, job_config=job_config)
    job.result()  # aguarda conclusão
    logger.info(f"BigQuery: {job.output_rows} rows carregadas em {BQ_TABLE}")



# --- Rotas Flask ---


@app.route("/", methods=["POST"])
def handle_event():
    """Recebe CloudEvent do Eventarc (object.finalized)."""
    envelope = request.get_json()

    if not envelope:
        return jsonify({"error": "No event data"}), 400

    if "bucket" in envelope and "name" in envelope:
        bucket_name = envelope["bucket"]
        object_name = envelope["name"]
        object_generation = str(envelope.get("generation", ""))
        event_id = envelope.get("id")
    elif "data" in envelope:
        data = envelope["data"]
        bucket_name = data.get("bucket", "")
        object_name = data.get("name", "")
        object_generation = str(data.get("generation", ""))
        event_id = envelope.get("id") or request.headers.get("ce-id")
    else:
        return jsonify({"error": "Cannot parse event"}), 400

    if not object_generation:
        logger.warning("Evento sem generation; usando fallback 'unknown'")
        object_generation = "unknown"

    if not object_name.startswith("raw/") or not object_name.endswith(".json.gz"):
        logger.info(f"Ignorando objeto: {object_name}")
        return jsonify({"status": "ignored"}), 200

    idempotency_key = build_idempotency_key(
        bucket_name=bucket_name,
        object_name=object_name,
        object_generation=object_generation,
    )

    can_process, claim_status = claim_event_processing(
        idempotency_key=idempotency_key,
        bucket_name=bucket_name,
        object_name=object_name,
        object_generation=object_generation,
        event_id=event_id,
    )

    if not can_process:
        logger.info(
            "Evento duplicado/indisponível para processamento | key=%s status=%s",
            idempotency_key,
            claim_status,
        )
        return jsonify({
            "status": "skipped",
            "reason": claim_status,
            "source": object_name,
            "generation": object_generation,
            "idempotency_key": idempotency_key,
        }), 200

    logger.info(
        "Processando: gs://%s/%s | generation=%s | key=%s",
        bucket_name,
        object_name,
        object_generation,
        idempotency_key,
    )

    try:
        records = download_and_decompress(bucket_name, object_name)
        logger.info(f"Lidos {len(records)} registros de {object_name}")

        unique_records = deduplicate(records)
        removed = len(records) - len(unique_records)
        if removed > 0:
            logger.info(f"Removidas {removed} duplicatas")

        if len(unique_records) == 0:
            logger.info("Nenhum registro após dedup.")
            mark_event_completed(idempotency_key)
            return jsonify({"status": "empty_after_dedup"}), 200

        transform_and_write(unique_records, object_name)
        mark_event_completed(idempotency_key)

        return jsonify({
            "status": "processed",
            "source": object_name,
            "generation": object_generation,
            "idempotency_key": idempotency_key,
            "records_in": len(records),
            "records_out": len(unique_records),
            "duplicates_removed": removed,
        }), 200

    except NotFound:
        logger.warning(f"Arquivo não encontrado (404), ignorando: {object_name}")
        mark_event_failed(idempotency_key, "source_object_not_found")
        return jsonify({"status": "not_found", "object": object_name}), 200

    except Exception as e:
        mark_event_failed(idempotency_key, str(e))
        logger.error(f"Erro ao processar {object_name}: {e}", exc_info=True)
        return jsonify({
            "status": "failed_manual_action_required",
            "source": object_name,
            "generation": object_generation,
            "idempotency_key": idempotency_key,
            "error": str(e),
        }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)