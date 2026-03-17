# --- Bucket: Data Lake ---

resource "google_storage_bucket" "datalake" {
  name          = "${var.region}-venus-datalake"
  location      = var.region
  project       = var.project_id
  force_destroy = true

  uniform_bucket_level_access = true

  versioning {
    enabled = false
  }
}

# Prefixos (pastas) dentro do bucket

resource "google_storage_bucket_object" "raw" {
  name    = "raw/"
  bucket  = google_storage_bucket.datalake.name
  content = " "
}

resource "google_storage_bucket_object" "trusted" {
  name    = "trusted/"
  bucket  = google_storage_bucket.datalake.name
  content = " "
}

resource "google_storage_bucket_object" "analytics" {
  name    = "analytics/"
  bucket  = google_storage_bucket.datalake.name
  content = " "
}

# =============================================================================
# Pub/Sub — Fila de ingestão
# =============================================================================

resource "google_pubsub_topic" "ingestao" {
  name    = "ingestao-topic"
  project = var.project_id
}

resource "google_pubsub_subscription" "ingestao_sub" {
  name                 = "ingestao-sub"
  topic                = google_pubsub_topic.ingestao.id
  project              = var.project_id
  ack_deadline_seconds = 60

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# =============================================================================
# Service Account — Cloud Run producer
# =============================================================================

resource "google_service_account" "cloud_run_producer" {
  account_id   = "cloud-run-producer"
  display_name = "Cloud Run - Producer (envia para Pub/Sub)"
  project      = var.project_id
}

resource "google_project_iam_member" "producer_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_producer.email}"
}

# =============================================================================
# Artifact Registry — Repositório de imagens Docker
# =============================================================================

resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "venus-images"
  description   = "Repositório Docker para imagens do projeto"
  format        = "DOCKER"
  project       = var.project_id
}

# =============================================================================
# Cloud Run — Producer (Go)
# =============================================================================

resource "google_cloud_run_v2_service" "producer" {
  name     = "producer"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_producer.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/producer:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "PUBSUB_TOPIC"
        value = google_pubsub_topic.ingestao.name
      }

      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
    }
  }

  depends_on = [
    google_project_iam_member.producer_pubsub_publisher,
  ]
}

# =============================================================================
# API Gateway
# =============================================================================

resource "google_api_gateway_api" "ingestao_api" {
  provider = google-beta
  api_id   = "ingestao-api"
  project  = var.project_id
}

resource "google_api_gateway_api_config" "ingestao_config" {
  provider     = google-beta
  api          = google_api_gateway_api.ingestao_api.api_id
  display_name = "ingestao-config"
  project      = var.project_id

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi.yaml", {
        cloud_run_url = google_cloud_run_v2_service.producer.uri
      }))
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "ingestao_gateway" {
  provider   = google-beta
  gateway_id = "ingestao-gateway"
  api_config = google_api_gateway_api_config.ingestao_config.id
  project    = var.project_id
  region     = "us-east1"
}

# Permitir invocação não autenticada do Cloud Run APENAS pelo API Gateway
resource "google_cloud_run_v2_service_iam_member" "allow_gateway_invoke" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.producer.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# =============================================================================
# Service Account — Cloud Run consumer (batch)
# =============================================================================

resource "google_service_account" "cloud_run_consumer" {
  account_id   = "cloud-run-consumer"
  display_name = "Cloud Run - Consumer (lê Pub/Sub, escreve no GCS)"
  project      = var.project_id
}

resource "google_project_iam_member" "consumer_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.cloud_run_consumer.email}"
}

resource "google_project_iam_member" "consumer_storage_writer" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = "serviceAccount:${google_service_account.cloud_run_consumer.email}"
}

# =============================================================================
# Cloud Run Job — Consumer (Go) — batch pull + gzip → GCS raw/
# =============================================================================

resource "google_cloud_run_v2_job" "consumer" {
  name     = "consumer"
  location = var.region
  project  = var.project_id

  template {
    template {
      service_account = google_service_account.cloud_run_consumer.email
      timeout         = "300s"

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/consumer:latest"

        env {
          name  = "GCP_PROJECT"
          value = var.project_id
        }

        env {
          name  = "PUBSUB_SUBSCRIPTION"
          value = google_pubsub_subscription.ingestao_sub.name
        }

        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.datalake.name
        }

        env {
          name  = "BATCH_SIZE"
          value = "10000"
        }
      }
    }
  }

  depends_on = [
    google_project_iam_member.consumer_pubsub_subscriber,
    google_project_iam_member.consumer_storage_writer,
  ]
}

# =============================================================================
# Cloud Scheduler — Dispara o consumer a cada 5 minutos
# =============================================================================

resource "google_cloud_scheduler_job" "trigger_consumer" {
  name      = "trigger-consumer-batch"
  schedule  = "*/1 * * * *"
  time_zone = "America/Sao_Paulo"
  project   = var.project_id
  region    = var.region

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/consumer:run"

    oauth_token {
      service_account_email = google_service_account.cloud_run_consumer.email
    }
  }

  depends_on = [
    google_cloud_run_v2_job.consumer,
  ]
}

# Permitir que a SA do consumer invoque o próprio job
resource "google_project_iam_member" "consumer_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_consumer.email}"
}

# =============================================================================
# Service Account — Cloud Run transformer (raw → trusted)
# =============================================================================

resource "google_service_account" "cloud_run_transformer" {
  account_id   = "cloud-run-transformer"
  display_name = "Cloud Run - Transformer (raw → trusted, Iceberg/Parquet)"
  project      = var.project_id
}

# Ler objetos da raw/
resource "google_project_iam_member" "transformer_storage_reader" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# Escrever objetos na trusted/ (Iceberg metadata + Parquet data)
resource "google_project_iam_member" "transformer_storage_writer" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# Receber eventos do Eventarc
resource "google_project_iam_member" "transformer_eventarc_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# Permitir Eventarc invocar o Cloud Run
resource "google_project_iam_member" "transformer_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# =============================================================================
# IAM — GCS Service Agent precisa publicar no Pub/Sub (requisito Eventarc)
# =============================================================================

data "google_storage_project_service_account" "gcs_account" {
  project = var.project_id
}

resource "google_project_iam_member" "gcs_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}

# =============================================================================
# Cloud SQL — Catálogo Iceberg (PostgreSQL)
# =============================================================================

resource "google_sql_database_instance" "iceberg_catalog" {
  name             = "iceberg-catalog"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10

    ip_configuration {
      ipv4_enabled = true

      # O Cloud SQL Python Connector usa IAM + SSL para conectar de forma segura,
      # mesmo com IP público. Não precisa de VPC Connector.
      # Nenhum authorized_networks = nenhum acesso direto externo (só via Connector).
    }

    backup_configuration {
      enabled = false
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "iceberg_db" {
  name     = "iceberg"
  instance = google_sql_database_instance.iceberg_catalog.name
  project  = var.project_id
}

resource "google_sql_user" "iceberg_user" {
  name     = "iceberg"
  instance = google_sql_database_instance.iceberg_catalog.name
  password = var.iceberg_db_password
  project  = var.project_id
}

# Permitir o transformer se conectar ao Cloud SQL
resource "google_project_iam_member" "transformer_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# Permitir o transformer escrever no BigQuery
resource "google_project_iam_member" "transformer_bigquery_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

resource "google_project_iam_member" "transformer_bigquery_job" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.cloud_run_transformer.email}"
}

# =============================================================================
# Cloud Run Service — Transformer (Python) — raw/ → trusted/ (Iceberg)
# =============================================================================

resource "google_cloud_run_v2_service" "transformer" {
  name     = "transformer"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_transformer.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/transformer:latest"

      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.datalake.name
      }
      env {
        name  = "ICEBERG_WAREHOUSE"
        value = "gs://${google_storage_bucket.datalake.name}/trusted"
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.iceberg_user.name
      }
      env {
        name  = "DB_PASS"
        value = var.iceberg_db_password
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.iceberg_db.name
      }
      env {
        name  = "INSTANCE_CONNECTION_NAME"
        value = google_sql_database_instance.iceberg_catalog.connection_name
      }

      resources {
        limits = {
          memory = "1Gi"
          cpu    = "1"
        }
      }
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }

    timeout = "300s"
  }

  depends_on = [
    google_artifact_registry_repository.docker_repo,
    google_project_iam_member.transformer_storage_reader,
    google_project_iam_member.transformer_storage_writer,
    google_project_iam_member.transformer_cloudsql_client,
  ]
}

# =============================================================================
# IAM — Eventarc Service Agent precisa de acesso ao bucket
# =============================================================================

data "google_project" "project" {
  project_id = var.project_id
}

resource "google_storage_bucket_iam_member" "eventarc_bucket_access" {
  bucket = google_storage_bucket.datalake.name
  role   = "roles/storage.admin"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-eventarc.iam.gserviceaccount.com"
}

# =============================================================================
# Eventarc — Trigger: object.finalized no bucket → Cloud Run transformer
# =============================================================================

resource "google_eventarc_trigger" "raw_file_created" {
  name     = "raw-file-created"
  location = var.region
  project  = var.project_id

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.datalake.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.transformer.name
      region  = var.region
      path    = "/"
    }
  }

  service_account = google_service_account.cloud_run_transformer.email

  depends_on = [
    google_project_iam_member.gcs_pubsub_publisher,
    google_project_iam_member.transformer_eventarc_receiver,
    google_project_iam_member.transformer_run_invoker,
    google_storage_bucket_iam_member.eventarc_bucket_access,
  ]
}

# =============================================================================
# BigQuery — Consulta à camada trusted (tabela nativa, load via transformer)
# =============================================================================

resource "google_bigquery_dataset" "trusted" {
  dataset_id = "trusted"
  location   = var.region
  project    = var.project_id

  description = "Dataset para consultas à camada trusted do Data Lake"
}

resource "google_bigquery_table" "ingestao" {
  dataset_id          = google_bigquery_dataset.trusted.dataset_id
  table_id            = "ingestao"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "ingested_at"
  }

  schema = jsonencode([
    {
      name = "latitude"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "longitude"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "idade"
      type = "INTEGER"
      mode = "NULLABLE"
    },
    {
      name = "classe_social"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "genero"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "ingested_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    },
    {
      name = "source_file"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "ingested_day"
      type = "DATE"
      mode = "NULLABLE"
    }
  ])

  depends_on = [
    google_bigquery_dataset.trusted,
  ]
}
