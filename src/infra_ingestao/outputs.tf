output "datalake_bucket_name" {
  description = "Nome do bucket do Data Lake"
  value       = google_storage_bucket.datalake.name
}

output "datalake_bucket_url" {
  description = "URL do bucket do Data Lake"
  value       = google_storage_bucket.datalake.url
}

output "pubsub_topic" {
  description = "Nome do tópico Pub/Sub"
  value       = google_pubsub_topic.ingestao.name
}

output "pubsub_subscription" {
  description = "Nome da subscription Pub/Sub"
  value       = google_pubsub_subscription.ingestao_sub.name
}

output "cloud_run_url" {
  description = "URL do Cloud Run producer"
  value       = google_cloud_run_v2_service.producer.uri
}

output "api_gateway_url" {
  description = "URL do API Gateway"
  value       = google_api_gateway_gateway.ingestao_gateway.default_hostname
}

output "artifact_registry_repo" {
  description = "URI do repositório Docker no Artifact Registry"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}

output "consumer_job_name" {
  description = "Nome do Cloud Run Job consumer"
  value       = google_cloud_run_v2_job.consumer.name
}

output "scheduler_job_name" {
  description = "Nome do Cloud Scheduler que dispara o consumer"
  value       = google_cloud_scheduler_job.trigger_consumer.name
}

output "transformer_url" {
  description = "URL do Cloud Run transformer (raw → trusted)"
  value       = google_cloud_run_v2_service.transformer.uri
}

output "eventarc_trigger_name" {
  description = "Nome do trigger Eventarc (raw file created)"
  value       = google_eventarc_trigger.raw_file_created.name
}

output "cloud_sql_instance" {
  description = "Connection name da instância Cloud SQL (catálogo Iceberg)"
  value       = google_sql_database_instance.iceberg_catalog.connection_name
}

output "biglake_connection" {
  description = "ID da conexão BigLake"
  value       = google_bigquery_connection.biglake.connection_id
}

output "bigquery_table" {
  description = "Tabela BigQuery externa (trusted Iceberg)"
  value       = "${google_bigquery_dataset.trusted.dataset_id}.${google_bigquery_table.ingestao.table_id}"
}
