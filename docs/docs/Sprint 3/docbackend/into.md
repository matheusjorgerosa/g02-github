---
sidebar_position: 1
title: Introdução
---

# Documentação do Backend
O backend para este projeto da Eletromídia foca em duas funcionalidades principais:

- Autenticação e gerenciamento de usuários com controle de roles (user / admin)
- Dashboard de dados com métricas, distribuição demográfica, dados espaciais e ranking de ruas. todos alimentados pelo Google BigQuery

### Stacks tecnológicas
| Stacks               | Tecnologia                    |
|----------------------|-------------------------------|
| Linguagem            | Go                            |
| Framework HTTP       | Gin                           |
| ORM                  | GORM                          |
| Banco relacional     | PostgreSQL                 |
| Data warehouse       | Google BigQuery               |
| Geocodificação       | Google Maps API               |
| Autenticação         | JWT (golang-jwt/jwt v5)       |
| Hash de senha        | bcrypt                        |
| Documentação da API  | Swagger (swaggo)              |
| Logger               | Uber Zap                      |
| Infraestrutura       | Docker + Docker Compose       |

## Estrutura de pastas
O projeto segue uma arquitetura modular dividida em dois domínios principais: user (autenticação e gerenciamento) e flow (dados de audiência).

```
.
├── cmd/
│   └── api/
│       └── main.go               # Ponto de entrada da aplicação. Inicializa serviços, rotas e middlewares.
│
├── credentials/                  # Credenciais do Google Cloud (não versionar)
│
├── docs/                         # Gerado automaticamente pelo swaggo
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
│
├── internal/
│   ├── flow/                     # Domínio de dados de audiência (BigQuery)
│   │   ├── config/
│   │   │   └── bigquery.go       # Inicializa o cliente do BigQuery
│   │   ├── handlers/
│   │   │   ├── handler_setup.go  # Interface FlowRepository + struct FlowHandler
│   │   │   ├── spatial_handler.go
│   │   │   ├── metrics_handler.go
│   │   │   ├── ranking_handler.go
│   │   │   └── demographics_handler.go
│   │   ├── models/               # Structs de request e response do domínio flow
│   │   │   ├── request.go        # DataRequest e FilterPayload
│   │   │   ├── spatial.go
│   │   │   ├── metrics.go
│   │   │   ├── ranking.go
│   │   │   └── demographics.go
│   │   ├── repository/           # Camada de acesso a dados (BigQuery + Google Maps)
│   │   │   ├── bq_client.go      # Interfaces DBEngine, RowIterator e GeoCoder
│   │   │   ├── bq_adapter.go     # Implementação do BigQueryAdapter (executa queries parametrizadas)
│   │   │   ├── maps_adapter.go   # Implementação do GoogleMapsAdapter (geocodificação reversa)
│   │   │   ├── spatial_repo.go
│   │   │   ├── metrics_repo.go
│   │   │   ├── ranking_repo.go
│   │   │   └── demographics_repo.go
│   │   └── teste/                # Testes dos handlers e repositórios do domínio flow
│   │
│   ├── platform/                 # Infraestrutura compartilhada
│   │   ├── database/
│   │   │   └── database.go       # Inicializa a conexão com o PostgreSQL via GORM
│   │   ├── logger/
│   │   │   └── logger.go         # Configura o logger Uber Zap
│   │   └── middleware/
│   │       ├── auth.go           # Middleware de validação do token JWT
│   │       └── admin.go          # Middleware de verificação de role admin
│   │
│   └── user/                     # Domínio de usuários
│       ├── model.go              # Struct User (tabela do PostgreSQL via GORM)
│       ├── schemas.go            # Structs de request/response (CreateUserRequest, LoginRequest, etc.)
│       ├── service.go            # Lógica de negócio (bcrypt, JWT, CRUD de usuários)
│       ├── handler.go            # Handlers HTTP do domínio user
│       └── handler_test.go
│
├── service-account.json          # Credencial do Google Cloud (não versionar)
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── go.sum
```
- **Handler**: recebe a requisição HTTP, valida o payload e retorna a resposta
- **Service**: contém a lógica de negócio (ex: gerar JWT, hash de senha)
- **Repository**: acessa os dados - PostgreSQL via GORM ou BigQuery via cliente Go

## Resumo das Rotas

| Método | Rota                                   | Auth | Role       | Descrição                                   |
|-------|----------------------------------------|------|-----------|----------------------------------------------|
| POST  | /signup                                |      | —         | Cadastro público de usuário                  |
| POST  | /login                                 |      | —         | Login e geração de token JWT                 |
| GET   | /health                                |      | —         | Healthcheck da API                           |
| GET   | /docs/*                                |      | —         | Swagger UI                                   |
| GET   | /admin/users                           | X    | admin     | Listar todos os usuários                     |
| POST  | /admin/users                           | X    | admin     | Criar usuário (com role customizado)         |
| PUT   | /admin/users/:id                       | X    | admin     | Atualizar dados de um usuário                |
| DELETE| /admin/users/:id                       | X    | admin     | Deletar usuário (soft delete)                |
| POST  | /api/v1/flow/spatial                   | X    | user/admin| Dados espaciais para mapa de calor           |
| POST  | /api/v1/flow/metrics                   | X    | user/admin| Métricas gerais (audiência + fluxo 24h)      |
| POST  | /api/v1/flow/ranking/neighborhoods     | X    | user/admin| Ranking de ruas mais movimentadas            |
| POST  | /api/v1/flow/distribution/demographics | X    | user/admin| Distribuição por gênero e classe social      |