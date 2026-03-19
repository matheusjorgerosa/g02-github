terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  zone    = var.zone
}

# ── Variáveis ────────────────────────────────────────────────────────────────

variable "project_id" {
  description = "ID do projeto GCP"
  type        = string
  default     = "venus-m09"
}

variable "zone" {
  description = "Zona GCP"
  type        = string
  default     = "southamerica-east1-a"
}

variable "machine_type" {
  description = "Tipo de máquina"
  type        = string
  default     = "c2-standard-8"
}

# ── Firewall ─────────────────────────────────────────────────────────────────

resource "google_compute_firewall" "allow_k6" {
  name    = "allow-k6"
  network = "default"

  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["3000", "6565"]
  }

  source_ranges = ["0.0.0.0/0"] 

  target_tags = ["k6-load-test"]
}

# ── Instância ─────────────────────────────────────────────────────────────────

resource "google_compute_instance" "k6_load_test" {
  name         = "k6-load-test"
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["k6-load-test"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 50
    }
  }

  network_interface {
    network = "default"

    # IP público para acesso SSH
    access_config {}
  }

  # Instala o k6 automaticamente ao criar a VM
  metadata_startup_script = <<-EOT
    #!/bin/bash
    set -e

    # Importar chave GPG do k6
    gpg --no-default-keyring \
      --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
      --keyserver hkp://keyserver.ubuntu.com:80 \
      --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

    # Adicionar repositório
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
      | tee /etc/apt/sources.list.d/k6.list

    # Instalar k6
    apt-get update && apt-get install -y k6

    echo "k6 instalado com sucesso" >> /var/log/startup-script.log
  EOT

  # Garante que a firewall existe antes da VM
  depends_on = [google_compute_firewall.allow_k6]
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "instance_name" {
  value = google_compute_instance.k6_load_test.name
}

output "instance_ip" {
  description = "IP público da instância"
  value       = google_compute_instance.k6_load_test.network_interface[0].access_config[0].nat_ip
}

output "ssh_command" {
  description = "Comando para acessar a instância via SSH"
  value       = "gcloud compute ssh ${google_compute_instance.k6_load_test.name} --zone=${var.zone}"
}