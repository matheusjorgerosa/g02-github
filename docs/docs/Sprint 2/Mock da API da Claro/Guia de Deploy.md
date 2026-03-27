---
title: Guia de Deploy no Google Cloud Platform
sidebar_position: 3
---

Este guia descreve o passo a passo para publicar o mock no Google Cloud Run via Artifact Registry.

## Pré-requisitos

- Docker instalado e em execução **sem `sudo`** (necessário para os comandos de build e push)
- Acesso ao projeto GCP com permissões de Artifact Registry e Cloud Run
- `gcloud` CLI instalado (veja o passo 1 caso ainda não tenha)

---

## Passo 1 - Instalar e configurar o `gcloud`

Caso ainda não tenha o SDK instalado:

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

Em seguida, selecione o projeto correto:

```bash
gcloud config set project SEU_PROJECT_ID
```
---

## 2. Passo 2 — Ativar o Artifact Registry

```bash
gcloud services enable artifactregistry.googleapis.com
```
---

## Passo 3 — Criar o repositório Docker

```bash
gcloud artifacts repositories create mock-api-claro \
  --repository-format=docker \
  --location=us-central1 \
  --description="Mock-API-Claro"
```

O repositório ficará visível no console do GCP em **Artifact Registry → Repositories**.

---
## Passo 4 — Autenticar o Docker no GCP

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```
---
## Passo 5 — Build da imagem

No diretório onde está o `Dockerfile`:

```bash
docker build -t imagem-api .
```

> Não utilize `sudo` no comando de build.

---

## Passo 6 — Taggear a imagem

```bash
docker tag imagem-api \
  us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1
```
---
## Passo 7 — Push para o Artifact Registry

```bash
docker push \
  us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1
```

---
## Passo 8 — Deploy no Cloud Run

```bash
gcloud run deploy mock-api-claro \
  --image us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Ao final do deploy, o `gcloud` retornará a URL pública do serviço.

---
## Resumo dos comandos

| Passo | Comando resumido                          |
|-------|-------------------------------------------|
| 1     | `gcloud init`                             |
| 2     | `gcloud services enable artifactregistry` |
| 3     | `gcloud artifacts repositories create`   |
| 4     | `gcloud auth configure-docker`            |
| 5     | `docker build`                            |
| 6     | `docker tag`                              |
| 7     | `docker push`                             |
| 8     | `gcloud run deploy`                       |