---
title: Guia de deploy no Google Cloud Platform
sidebar_position: 2
---

## 1. Instalar e configurar o gcloud

Se ainda não tiver:

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

Depois selecione o projeto correto:

```bash
gcloud config set project SEU_PROJECT_ID
```

## 2. Ativar o Artifact Registry

```bash
gcloud services enable artifactregistry.googleapis.com
```

## 3. Criar um repositório Docker

```bash
gcloud artifacts repositories create mock-api-claro \
  --repository-format=docker \
  --location=us-central1 \
  --description="Mock-API-Claro"
```

## 4. Autenticar o Docker no GCP

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## 5. Build da imagem

No diretório do seu `Dockerfile`:
* nao pode ser com sudo
```bash
docker build -t imagem-api .
```

## 6. Taggear a imagem

```bash
docker tag imagem-api \
us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1
```

## 7. Push para o GCP

```bash
docker push us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1
```

A imagem vai aparecer no console do GCP em:

**Artifact Registry → Repositories**

## 8. subir no Cloud Run:

```bash
gcloud run deploy mock-api-claro \
  --image us-central1-docker.pkg.dev/SEU_PROJECT_ID/mock-api-claro/api-imagem:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
