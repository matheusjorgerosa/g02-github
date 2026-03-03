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
  ack_deadline_seconds = 20

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
      timeout         = "120s"

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
          value = "100"
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
  schedule  = "*/5 * * * *"
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
