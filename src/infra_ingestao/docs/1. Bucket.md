# Bucket — Data Lake (GCS)

Este documento descreve como subir o bucket do Data Lake no GCP usando Terraform.

---

## O que será criado

| Recurso | Nome / Caminho |
|---|---|
| Bucket GCS | `southamerica-east1-venus-datalake` |
| Prefixo (pasta) | `raw/` |
| Prefixo (pasta) | `trusted/` |
| Prefixo (pasta) | `analytics/` |

---

## Código Terraform

O arquivo `main.tf` na raiz do projeto contém:

```hcl
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
```

### O que cada bloco faz

- **`google_storage_bucket`** — cria o bucket com nome `{region}-venus-datalake`. O `uniform_bucket_level_access` garante controle de acesso uniforme (sem ACLs por objeto). `force_destroy = true` permite destruir o bucket mesmo com objetos dentro (útil em dev).

- **`google_storage_bucket_object`** — cria objetos com nome terminando em `/`, que o GCS interpreta como "pastas". O `content = " "` é necessário porque o Terraform exige conteúdo, mas o GCS ignora o corpo em objetos de prefixo.

---

## Como subir

### 1. Certifique-se de que o ADC está configurado

```bash
gcloud auth application-default login
gcloud config set project venus-m09
```

### 2. Habilite a API do Storage (se ainda não habilitou)

```bash
gcloud services enable storage.googleapis.com
```

### 3. Inicialize o Terraform (se ainda não fez)

```bash
cd infra_ingestao/
terraform init
```

### 4. Veja o plano de execução

```bash
terraform plan
```

Saída esperada (resumo):

```
Plan: 4 to add, 0 to change, 0 to destroy.
```

Os 4 recursos são: 1 bucket + 3 objetos (prefixos).

### 5. Aplique

```bash
terraform apply
```

Digite `yes` quando solicitado. Ao final, o output mostrará:

```
datalake_bucket_name = "southamerica-east1-venus-datalake"
datalake_bucket_url  = "gs://southamerica-east1-venus-datalake"
```

---

## Verificar no CLI

```bash
# Listar buckets do projeto
gsutil ls

# Listar conteúdo do bucket
gsutil ls gs://southamerica-east1-venus-datalake/
```

Saída esperada:

```
gs://southamerica-east1-venus-datalake/analytics/
gs://southamerica-east1-venus-datalake/raw/
gs://southamerica-east1-venus-datalake/trusted/
```

---

## Destruir (se necessário)

```bash
terraform destroy
```

Isso removerá o bucket e todos os objetos dentro dele (por causa do `force_destroy = true`).
