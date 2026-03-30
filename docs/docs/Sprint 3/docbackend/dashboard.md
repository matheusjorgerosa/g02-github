---
sidebar_position: 3
title: Backend Dashboard 
---

## 1. Endpoints - Dashboard (Flow)

Todas as rotas abaixo ficam sob o grupo `/api/v1/flow` e exigem autenticação JWT (`user` ou `admin`).

---

## 2. Demonstração no Swagger

O vídeo abaixo mostra as chamadas POST para os endpoints do BigQuery no Swagger UI:

<iframe
  width="100%"
  height="420"
  src="https://www.youtube.com/embed/PTM7vz4dLuM"
  title="Swagger - POSTs BigQuery"
  frameBorder="0"
  allowFullScreen
/>

---

## 3. Payload padrão (FilterPayload)

Todos os endpoints recebem o mesmo formato de body:

```json
{
  "filters": {
    "ageGroups": ["18-24", "25-34", "65+"],
    "genders": ["Masculino", "Feminino"],
    "socialClasses": ["A", "B"]
  },
  "limit": 10
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `filters` | objeto | X | Critérios de filtragem dos dados |
| `filters.ageGroups` | string[] | X | Faixas etárias. Suporta `"18-24"`, `"65+"` |
| `filters.genders` | string[] | X | Gêneros (ex: `"Masculino"`, `"Feminino"`) |
| `filters.socialClasses` | string[] | X | Classes sociais (ex: `"A"`, `"B"`, `"C1"`) |
| `limit` | int |  | Usado apenas no endpoint de ranking. Default: `10` |

:::info Expansão de faixas etárias
O adapter do BigQuery expande automaticamente as faixas etárias em idades individuais antes de executar a query. Por exemplo, `"18-24"` vira `["18","19","20","21","22","23","24"]` e `"65+"` vira `["65","66",...,"99"]`.
:::

---

### `POST /api/v1/flow/spatial`

Retorna pontos de latitude/longitude com volume de audiência para renderização de mapa de calor.

**Resposta `200`:**
```json
{
  "data": [
    { "latitude": -23.5505, "longitude": -46.6333, "weighted_uniques": 1520 }
  ]
}
```

**Query executada no BigQuery:**
```sql
SELECT latitude, longitude, COUNT(*) as volume
FROM `venus-m09.trusted.ingestao`
WHERE CAST(idade AS STRING) IN UNNEST(@ages)
  AND genero IN UNNEST(@genders)
  AND classe_social IN UNNEST(@classes)
GROUP BY latitude, longitude
```

---

### `POST /api/v1/flow/metrics`

Retorna o total de audiência e o fluxo de pessoas por hora nas últimas 24h.

**Resposta `200`:**
```json
{
  "totalAudience": 45230,
  "flow24h": [
    { "hour": 8, "volume": 1200 },
    { "hour": 9, "volume": 3400 }
  ]
}
```

**Query executada no BigQuery:**
```sql
SELECT EXTRACT(HOUR FROM ingested_at) as hour, COUNT(*) as volume
FROM `venus-m09.trusted.ingestao`
WHERE CAST(idade AS STRING) IN UNNEST(@ages)
  AND genero IN UNNEST(@genders)
  AND classe_social IN UNNEST(@classes)
GROUP BY hour ORDER BY hour ASC
```

---

### `POST /api/v1/flow/ranking/neighborhoods`

Retorna o ranking das ruas mais movimentadas. Usa geocodificação reversa (Google Maps API) para converter coordenadas em nomes de ruas reais.

**Body adicional:**
```json
{
  "filters": { ... },
  "limit": 5
}
```

**Resposta `200`:**
```json
{
  "ranking": [
    { "name": "Avenida Paulista", "volume": 8900 },
    { "name": "Rua Augusta", "volume": 5400 }
  ]
}
```

:::info Geocodificação reversa
O repositório consulta primeiro as coordenadas de maior volume no BigQuery e depois chama o `GoogleMapsAdapter.ReverseGeocode()` para cada ponto, priorizando o componente de endereço do tipo `"route"` (nome da rua).
:::

---

### `POST /api/v1/flow/distribution/demographics`

Retorna a distribuição percentual e o volume absoluto por Gênero e Classe Social.

**Resposta `200`:**
```json
{
  "gender": [
    { "category": "Masculino", "percentage": 54.3, "volume": 24500 },
    { "category": "Feminino", "percentage": 45.7, "volume": 20730 }
  ],
  "socialClass": [
    { "category": "A", "percentage": 12.1, "volume": 5480 },
    { "category": "B", "percentage": 38.9, "volume": 17600 }
  ]
}
```

**Query executada (por coluna — gênero e classe social):**
```sql
SELECT <coluna> as category,
       COUNT(*) as volume,
       ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM `venus-m09.trusted.ingestao`
WHERE CAST(idade AS STRING) IN UNNEST(@ages)
  AND genero IN UNNEST(@genders)
  AND classe_social IN UNNEST(@classes)
GROUP BY category
```

---

## 4.  Respostas de erro (todos os endpoints)

| Status | Causa |
|--------|-------|
| `400` | Body inválido ou campo `filters` ausente |
| `401` | Token JWT ausente ou inválido |
| `500` | Erro na consulta ao BigQuery |


---

## 5. BigQuery

O BigQuery é o data warehouse onde ficam os dados de audiência. A API consome a tabela `venus-m09.trusted.ingestao`.

### 5.1 Inicialização

A conexão é feita em `internal/flow/config/bigquery.go` durante o boot da aplicação:

```go
bqClient := flowconfig.ConnectBigQuery(ctx, gcpProject)
```

O `projectID` é lido da variável de ambiente `GCP_PROJECT`. Se não estiver definida, o padrão usado é `"venus-m09"`.

A autenticação com o GCP é feita via **Service Account**. O arquivo `service-account.json` é montado no container em `/root/service-account.json` e referenciado pela variável `GOOGLE_APPLICATION_CREDENTIALS`.

### 5.2 Arquitetura de acesso (camadas)

```
Handler
  └── FlowRepository       (bq_client.go — interface)
        └── BigQueryAdapter  (bq_adapter.go — implementação)
              └── bigquery.Client (SDK oficial do GCP)
```

A interface `DBEngine` isola o código de negócio do SDK do BigQuery, facilitando testes com mocks.

```go
type DBEngine interface {
    Query(ctx context.Context, sql string, filters models.FilterPayload) (RowIterator, error)
}
```

### 5.3 Queries parametrizadas

Todas as queries usam **parâmetros nomeados** (`@ages`, `@genders`, `@classes`) para evitar SQL injection:

```go
q.Parameters = []bigquery.QueryParameter{
    {Name: "ages",    Value: expandAgeRanges(f.AgeGroups)},
    {Name: "genders", Value: f.Genders},
    {Name: "classes", Value: f.SocialClasses},
}
```

### 5.4 Tabela: `venus-m09.trusted.ingestao`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `idade` | STRING | Idade do indivíduo |
| `genero` | STRING | Gênero (`"Masculino"`, `"Feminino"`) |
| `classe_social` | STRING | Classe social (`"A"`, `"B"`, `"C1"`, etc.) |
| `latitude` | FLOAT | Latitude do ponto de captura |
| `longitude` | FLOAT | Longitude do ponto de captura |
| `ingested_at` | TIMESTAMP | Data/hora de ingestão do registro |

---

## 6. Google Maps API

Usada exclusivamente para **geocodificação reversa** no endpoint de ranking de ruas.

### 6.1 Inicialização

```go
geoCoder, err := flowrepo.NewGoogleMapsAdapter()
```

A chave da API é lida da variável de ambiente `GOOGLE_MAPS_API_KEY`.


### 6.2 Configuração no Docker

```yaml
environment:
  - GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS}
  - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
  - GCP_PROJECT=${GCP_PROJECT}
volumes:
  - ./service-account.json:/root/service-account.json:ro
  - ./credentials:/app/credentials:ro
```