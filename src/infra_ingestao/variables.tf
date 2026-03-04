variable "project_id" {
  description = "venus-m09"
  type        = string
}

variable "region" {
  description = "Região padrão do GCP"
  type        = string
  default     = "southamerica-east1"
}

variable "iceberg_db_password" {
  description = "Senha do usuário iceberg no Cloud SQL (catálogo Iceberg)"
  type        = string
  sensitive   = true
}