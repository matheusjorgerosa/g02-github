gcloud auth application-default login   

# 1. Subir a infra + instalar k6 automaticamente
terraform init
terraform apply

# 2. SSH na máquina (IP no output)
gcloud init
gcloud compute ssh k6-load-test --zone=southamerica-east1-a

# 3. Rodar o teste (dentro da VM)
k6 run --out json=resultado.json script.js

# 4. DESTRUIR tudo após os testes
terraform destroy