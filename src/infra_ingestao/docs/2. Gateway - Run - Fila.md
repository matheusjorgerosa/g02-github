# API Gateway + Cloud Run + Pub/Sub (Fila)

Este documento descreve como subir a stack de ingestão: **API Gateway → Cloud Run (Go) → Pub/Sub**.

---

## Arquitetura

```
Cliente → API Gateway → Cloud Run (producer) → Pub/Sub Topic
                                                    ↓
                                              Pub/Sub Subscription
```

---

## O que será criado

| Recurso | Nome |
|---|---|
| Pub/Sub Topic | `ingestao-topic` |
| Pub/Sub Subscription | `ingestao-sub` |
| Service Account | `cloud-run-producer` (com `roles/pubsub.publisher`) |
| Artifact Registry | `venus-images` (repositório Docker) |
| Cloud Run Service | `producer` |
| API Gateway API | `ingestao-api` |
| API Gateway Config | `ingestao-config-*` |
| API Gateway Gateway | `ingestao-gateway` |

---

## Pré-requisitos

- Terraform inicializado (`terraform init` já executado)
- ADC configurado (`gcloud auth application-default login`)
- Docker instalado
- APIs habilitadas (se ainda não fez):

```bash
gcloud services enable \
  run.googleapis.com \
  apigateway.googleapis.com \
  servicecontrol.googleapis.com \
  servicemanagement.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## Passo a passo

### 1. Subir Pub/Sub + Service Account + Artifact Registry primeiro

A imagem do Cloud Run ainda não existe, então precisamos subir a infra em etapas. Primeiro, crie o Artifact Registry e o restante (sem o Cloud Run e o Gateway):

```bash
terraform apply -target=google_pubsub_topic.ingestao \
  -target=google_pubsub_subscription.ingestao_sub \
  -target=google_service_account.cloud_run_producer \
  -target=google_project_iam_member.producer_pubsub_publisher \
  -target=google_artifact_registry_repository.docker_repo
```

---

### 2. Resolver dependências do Go e buildar a imagem Docker

Entre na pasta do producer e gere o `go.sum`:

```bash
cd producer/
go mod tidy
cd ..
```

---

### 3. Buildar e fazer push da imagem Docker

Configure o Docker para autenticar no Artifact Registry:

```bash
gcloud auth configure-docker southamerica-east1-docker.pkg.dev
```

Builde e faça push:

```bash
cd producer/

docker build -t southamerica-east1-docker.pkg.dev/venus-m09/venus-images/producer:latest .

docker push southamerica-east1-docker.pkg.dev/venus-m09/venus-images/producer:latest

cd ..
```

---

### 4. Subir o Cloud Run

Agora que a imagem existe no Artifact Registry:

```bash
terraform apply -target=google_cloud_run_v2_service.producer \
  -target=google_cloud_run_v2_service_iam_member.allow_gateway_invoke
```

---

### 5. Subir o API Gateway

```bash
terraform apply -target=google_api_gateway_api.ingestao_api \
  -target=google_api_gateway_api_config.ingestao_config \
  -target=google_api_gateway_gateway.ingestao_gateway
```

Ou, se preferir aplicar tudo de uma vez (agora que a imagem já existe):

```bash
terraform apply
```

---

### 6. Verificar os outputs

```bash
terraform output
```

Saída esperada:

```
api_gateway_url      = "ingestao-gateway-XXXXX.uc.gateway.dev"
cloud_run_url        = "https://producer-XXXXX-rj.a.run.app"
pubsub_topic         = "ingestao-topic"
pubsub_subscription  = "ingestao-sub"
```

---

## Testar

### Via Cloud Run direto

```bash
curl -X POST $(terraform output -raw cloud_run_url)/ingest \
  -H "Content-Type: application/json" \
  -d '{"sensor": "temp-01", "valor": 23.5}'
```

### Via API Gateway

```bash
curl -X POST https://$(terraform output -raw api_gateway_url)/ingest \
  -H "Content-Type: application/json" \
  -d '{"sensor": "temp-01", "valor": 23.5}'
```

Resposta esperada:

```json
{"status": "accepted", "message_id": "1234567890"}
```

### Verificar mensagem na fila

```bash
gcloud pubsub subscriptions pull ingestao-sub --auto-ack --limit=5
```

---

## Estrutura de arquivos

```
infra_ingestao/
├── main.tf             # Bucket + Pub/Sub + Cloud Run + API Gateway
├── outputs.tf          # Outputs do Terraform
├── providers.tf        # Provider Google
├── variables.tf        # Variáveis
├── terraform.tfvars    # Valores das variáveis
├── openapi.yaml        # Spec OpenAPI para o API Gateway
├── producer/           # Aplicação Go
│   ├── main.go         # Servidor HTTP que publica no Pub/Sub
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
└── docs/
    ├── bucket.md
    └── gateway-run-fila.md  # Este arquivo
```

---

## Sobre o código Go (`producer/main.go`)

A aplicação expõe dois endpoints:

| Método | Rota | Descrição |
|---|---|---|
| POST | `/ingest` | Recebe JSON no body e publica no tópico Pub/Sub |
| GET | `/health` | Health check (retorna `{"status": "ok"}`) |

O Cloud Run injeta as variáveis `PUBSUB_TOPIC` e `GCP_PROJECT` automaticamente via Terraform.

---

## Atualizar a imagem do producer

Quando alterar o código Go:

```bash
cd producer/
docker build -t southamerica-east1-docker.pkg.dev/venus-m09/venus-images/producer:latest .
docker push southamerica-east1-docker.pkg.dev/venus-m09/venus-images/producer:latest

# Forçar novo deploy no Cloud Run
gcloud run services update producer \
  --region=southamerica-east1 \
  --image=southamerica-east1-docker.pkg.dev/venus-m09/venus-images/producer:latest
```

---

## Notas

- **Nenhuma GUI necessária.** Tudo é feito via CLI/Terraform.
- O API Gateway pode levar **5-10 minutos** para propagar uma nova config.
- O `force_destroy` não está no Pub/Sub — para destruir, basta `terraform destroy`.
- A permissão `allUsers` no Cloud Run permite acesso público. Em produção, restrinja via API key ou autenticação no Gateway.
