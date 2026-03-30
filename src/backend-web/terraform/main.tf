terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# --- APIs necessárias ---
resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "apigateway.googleapis.com",
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "backend-web-repo"
  description   = "Imagens Docker do Backend Web"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# --- Service Account do Cloud Run ---
resource "google_service_account" "backend_sa" {
  account_id   = "backend-web-sa"
  display_name = "Service Account do backend-web"
  depends_on   = [google_project_service.apis]
}

resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# --- Cloud SQL ---
resource "google_sql_database_instance" "venus_db" {
  name             = "venus-backend-db-v2"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled = false
    }
  }

  deletion_protection = false
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "venus" {
  name     = "venus"
  instance = google_sql_database_instance.venus_db.name
}

resource "google_sql_user" "postgres" {
  name     = "postgres"
  instance = google_sql_database_instance.venus_db.name
  password = var.db_password
}

# --- Cloud Run ---
resource "google_cloud_run_v2_service" "backend_api" {
  name     = "api-backend-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_sa.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.venus_db.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/backend-web-repo/api-backend:v1"

      ports {
        container_port = 8080
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      }
      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.venus_db.connection_name}"
      }
      env {
        name  = "DB_USER"
        value = "postgres"
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_password
      }
      env {
        name  = "DB_NAME"
        value = "venus"
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "GOOGLE_MAPS_API_KEY"
        value = var.google_maps_key
      }
      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }
      env {
        name  = "ADMIN_PASSWORD"
        value = var.admin_password
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_project_iam_member.backend_cloudsql_client,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "noauth" {
  location = google_cloud_run_v2_service.backend_api.location
  name     = google_cloud_run_v2_service.backend_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- API Gateway ---
resource "google_api_gateway_api" "backend_api" {
  provider = google-beta
  api_id   = "venus-backend-api"
  project  = var.project_id
}

resource "google_api_gateway_api_config" "backend_config" {
  provider     = google-beta
  api          = google_api_gateway_api.backend_api.api_id
  display_name = "venus-backend-config"
  project      = var.project_id

  openapi_documents {
    document {
      path = "openapi.yaml"
      contents = base64encode(templatefile("${path.module}/openapi.yaml", {
        cloud_run_url = google_cloud_run_v2_service.backend_api.uri
        jwt_issuer    = "https://securetoken.google.com/${var.project_id}"
        jwks_uri      = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
        api_audience  = var.project_id
      }))
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [google_cloud_run_v2_service.backend_api]
}

resource "google_api_gateway_gateway" "backend_gateway" {
  provider   = google-beta
  gateway_id = "venus-backend-gateway"
  api_config = google_api_gateway_api_config.backend_config.id
  project    = var.project_id
  region     = var.region
}

# --- Outputs ---
output "cloud_run_url" {
  value = google_cloud_run_v2_service.backend_api.uri
}

output "api_gateway_url" {
  value = "https://${google_api_gateway_gateway.backend_gateway.default_hostname}"
}