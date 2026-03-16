---
sidebar_position: 4
title: Como rodar o projeto
---

# Como rodar o projeto

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose instalados
- Arquivo `.env` configurado (veja [Variáveis de Ambiente](/docs/como-rodar/variaveis-de-ambiente))
- Arquivo `service-account.json` da Service Account do GCP na raiz do projeto

## Subindo com Docker Compose

```bash
# Clone o repositório

cd src/backend-web

# Configure as variáveis de ambiente

# Edite o .env com suas credenciais

# Suba os serviços (PostgreSQL + API)
docker-compose up --build
```

A API estará disponível em `http://localhost:8080`.

O Swagger UI pode ser acessado em `http://localhost:8080/docs/index.html`.

## O que acontece no boot

1. Carrega as variáveis do `.env` via `godotenv`
2. Inicializa o logger Uber Zap
3. Conecta ao PostgreSQL e executa o `AutoMigrate` da tabela `users`
4. Conecta ao BigQuery usando a Service Account
5. Inicializa o `GoogleMapsAdapter` com a chave da API
6. Registra todos os middlewares, rotas e inicia o servidor na porta `8080`

## Serviços do Docker Compose

| Serviço | Imagem | Porta | Descrição |
|---------|--------|-------|-----------|
| `db` | `postgres:15-alpine` | `5432` | Banco de dados PostgreSQL |
| `app` | Build local | `8080` | A API Go |

O serviço `app` aguarda o `db` estar saudável (`pg_isready`) antes de iniciar, graças ao `depends_on` com `condition: service_healthy`.

## Rodando localmente sem Docker

```bash
# Instale as dependências
go mod download

# Certifique-se de ter um PostgreSQL rodando e o .env configurado
# Execute
go run ./cmd/api/main.go
```

## Regenerando o Swagger

Se você alterar anotações `// @...` nos handlers, regenere a documentação:

```bash
# Instale o swag CLI (se ainda não tiver)
go install github.com/swaggo/swag/cmd/swag@latest

# Gere os arquivos
swag init -g cmd/api/main.go
```
---