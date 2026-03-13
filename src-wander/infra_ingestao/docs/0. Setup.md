# Setup — Infraestrutura de Ingestão (GCP + Terraform)

> Projeto GCP: `venus-m09`  
> Região padrão: `southamerica-east1`

---

## Pré-requisitos

- Conta Google com acesso ao projeto `venus-m09`
- Billing account vinculada ao projeto
- Linux (ou WSL)

---

## 1. Instalar o Google Cloud CLI

```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh
source ~/.bashrc
```

Verifique a instalação:

```bash
gcloud --version
```

---

## 2. Instalar o Terraform

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

Verifique a instalação:

```bash
terraform -version
```

---

## 3. Autenticar no GCP

### 3.1 Login na conta

```bash
gcloud auth login
```

Isso abrirá o navegador para autenticação OAuth.

### 3.2 Configurar o projeto padrão

```bash
gcloud config set project venus-m09
```

### 3.3 Configurar Application Default Credentials (ADC)

O Terraform utilizará ADC para autenticar com o GCP. Execute:

```bash
gcloud auth application-default login
```

Isso gera um arquivo de credenciais em `~/.config/gcloud/application_default_credentials.json`, que o Terraform usa automaticamente — **não é necessário referenciá-lo manualmente no código**.

> **Nota:** o ADC é a forma recomendada para desenvolvimento local. Em CI/CD, use Workload Identity Federation ou uma Service Account com a variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS`.

---

## 4. Habilitar as APIs necessárias

```bash
gcloud services enable \
  compute.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  bigquery.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  run.googleapis.com \
  dataflow.googleapis.com
```

Para listar todas as APIs habilitadas:

```bash
gcloud services list --enabled
```

---

## 5. Configurar região e zona padrão (opcional)

```bash
gcloud config set compute/region southamerica-east1
gcloud config set compute/zone southamerica-east1-a
```

---

## 6. Criar os arquivos base do Terraform

Antes de inicializar, crie os arquivos de configuração:

### `providers.tf`

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

### `variables.tf`

```hcl
variable "project_id" {
  description = "ID do projeto GCP"
  type        = string
}

variable "region" {
  description = "Região padrão do GCP"
  type        = string
  default     = "southamerica-east1"
}
```

### `terraform.tfvars`

```hcl
project_id = "venus-m09"
region     = "southamerica-east1"
```

### `main.tf`

```hcl
# Recursos de infraestrutura serão adicionados aqui
```

### `outputs.tf`

```hcl
# Outputs do Terraform serão adicionados aqui
```

### `.gitignore`

```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
.terraform.lock.hcl
credentials.json
*.auto.tfvars
```

---

## 7. Inicializar o Terraform

Na raiz deste diretório (`infra_ingestao/`):

```bash
terraform init
```

Isso fará o download dos providers definidos nos arquivos `.tf`.

---

## 8. Validar e aplicar

```bash
# Verificar sintaxe
terraform validate

# Ver o plano de execução
terraform plan

# Aplicar a infraestrutura
terraform apply
```

Para destruir todos os recursos:

```bash
terraform destroy
```

---

## Estrutura esperada do projeto

```
infra_ingestao/
├── SETUP.md            # Este arquivo
├── providers.tf        # Configuração do provider Google
├── variables.tf        # Variáveis do projeto
├── terraform.tfvars    # Valores das variáveis
├── main.tf             # Recursos de infraestrutura
├── outputs.tf          # Outputs do Terraform
└── .gitignore          # Arquivos ignorados pelo Git
```

---

## Troubleshooting

| Problema | Solução |
|---|---|
| `ERROR: (gcloud.auth.application-default.login) ... quota project` | Execute `gcloud auth application-default set-quota-project venus-m09` |
| `API not enabled` | Habilite a API com `gcloud services enable <api>.googleapis.com` |
| `Permission denied` | Verifique se sua conta tem a role `Editor` ou `Owner` no projeto |
| `terraform init` falha | Verifique conexão com a internet e a versão do Terraform (`>= 1.0`) |
