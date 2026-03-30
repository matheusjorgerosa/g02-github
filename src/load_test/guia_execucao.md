# Guia de Execução — Load Test com k6 na GCP

## Pré-requisito

Autentique sua conta GCP localmente:

```bash
gcloud auth application-default login
```

## 1. Subir a Infraestrutura

Inicialize e aplique o Terraform para provisionar a VM e instalar o k6 automaticamente:

```bash
terraform init
terraform apply
```

> O IP da máquina criada será exibido no output do `terraform apply`.

## 2. Acessar a VM via SSH

Configure o gcloud e conecte-se à instância:

```bash
gcloud init
gcloud compute ssh k6-load-test --zone=southamerica-east1-a
```

## 3. Rodar o Teste de Carga

Dentro da VM, execute o script k6 e salve os resultados em JSON:

```bash
k6 run --out json=resultado.json script.js
```

## 4. Destruir a Infraestrutura

Após concluir os testes, destrua todos os recursos:

```bash
terraform destroy
```
