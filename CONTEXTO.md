# Contexto do projeto — Merge de backends

## Visão geral do projeto

O projeto **VENUS** é uma dashboard web para ingestão e plotagem de dados de fluxo de audiência (Eletromidia). A stack é composta por:

- **Frontend**: React + Vite (`sp-density-map/`), usando deck.gl para mapa de calor hexagonal, Recharts para gráficos, e PapaParse para CSV.
- **Backend de autenticação** (`src-wander/backend-web/`): API em Go com Gin, PostgreSQL via GORM, autenticação JWT, middlewares de auth e admin. Criado pelo Wander.
- **Backend de dados** (`src-isa/backend/`): API em Go com Gin, BigQuery e Google Maps. Fornece rotas de consulta espacial, métricas, ranking e demografia. Criado pela Isa.

---

## Problema atual

Os dois backends são projetos Go **separados**, cada um com seu próprio `go.mod`, `main.go` e estrutura de pastas. Isso gera os seguintes problemas:

1. **As rotas de dados são públicas.** Qualquer pessoa pode acessar `/api/v1/flow/spatial`, `/api/v1/flow/metrics`, etc. sem autenticação.
2. **Dois servidores na porta 8080.** Ambos os `main.go` fazem `r.Run(":8080")`, então não podem rodar simultaneamente sem conflito.
3. **O frontend não se comunica com nenhum backend.** Hoje ele carrega dados de um CSV local (`Papa.parse('/data.csv')`). Não há tela de login nem chamadas HTTP ao backend.
4. **Código duplicado.** Ambos usam Gin, ambos configuram Swagger, ambos têm estrutura de handlers/models/repository. Manter dois projetos para um mesmo produto não faz sentido.

---

## Objetivo da integração

Unificar os dois backends em **um único projeto Go** que:

- Mantenha todas as rotas de autenticação e CRUD de usuários do Wander.
- Incorpore todas as rotas de dados da Isa.
- Proteja as rotas de dados com o `AuthMiddleware()` já existente (exigindo JWT válido).
- Mantenha as rotas de admin protegidas com `AdminOnly()`.
- Sirva tudo em um único servidor na porta 8080.

No frontend:

- Adicionar uma tela de login.
- Adicionar lógica de armazenamento do token JWT.
- Criar um wrapper de fetch que injete `Authorization: Bearer <token>` em todas as requisições.
- Redirecionar para login quando não autenticado.

---

## Estrutura atual dos arquivos

### src-wander/backend-web/ (base do merge)

```
backend-web/
├── cmd/api/main.go              ← Entrypoint. Configura Gin, rotas de login e admin.
├── go.mod                       ← Módulo "backend-web". Deps: gin, jwt, gorm, postgres, zap.
├── docker-compose.yml           ← Sobe Postgres + app.
├── .env.example
├── internal/
│   ├── platform/
│   │   ├── database/database.go ← Init PostgreSQL via GORM.
│   │   ├── logger/logger.go     ← Zap logger.
│   │   └── middleware/
│   │       ├── auth.go          ← AuthMiddleware(): valida JWT, seta user_id e role no ctx.
│   │       └── admin.go         ← AdminOnly(): verifica role == "admin".
│   └── user/
│       ├── model.go             ← Struct User (GORM model).
│       ├── schemas.go           ← Request/Response DTOs.
│       ├── service.go           ← Lógica: Login, CreateUser, DeleteUser, ListUsers, AdminUpdateUser.
│       └── handler.go           ← Handlers HTTP para cada operação.
└── docs/                        ← Swagger gerado.
```

### src-isa/backend/ (código a ser incorporado)

```
backend/
├── internal/
│   ├── main.go                  ← Entrypoint. Configura Gin, BigQuery, rotas de flow.
│   ├── config/database.go       ← ConnectBigQuery().
│   ├── handlers/
│   │   ├── handler_setup.go     ← Interface FlowRepository + struct FlowHandler.
│   │   ├── spatial_handler.go   ← HandleSpatialData.
│   │   ├── metrics_handler.go   ← HandleMetrics.
│   │   ├── ranking_handler.go   ← HandleNeighborhoodRanking.
│   │   └── demographics_handler.go ← HandleDemographics.
│   ├── models/
│   │   ├── spatial.go, metrics.go, ranking.go, demographics.go ← Structs de resposta.
│   │   └── request.go           ← FilterPayload e DataRequest.
│   └── repository/
│       ├── bq_client.go         ← Interface BigQueryEngine.
│       ├── bq_adapter.go        ← Implementação BigQueryAdapter.
│       ├── maps_adapter.go      ← GoogleMapsAdapter (geocoding).
│       ├── spatial_repo.go      ← Queries BigQuery para dados espaciais.
│       ├── metrics_repo.go      ← Queries para métricas gerais.
│       ├── ranking_repo.go      ← Queries para ranking de bairros.
│       └── demographics_repo.go ← Queries para demografia.
└── go.mod                       ← Módulo "backend". Deps: gin, bigquery, googlemaps, godotenv.
```

### sp-density-map/ (frontend React)

```
sp-density-map/
├── src/
│   ├── App.jsx                  ← Componente principal. Carrega CSV local, sem auth.
│   ├── constants.js             ← Configs, traduções, filtros.
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── MapView.jsx
│   │   ├── StatsGrid.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── SettingsPanel.jsx
│   │   └── CampaignsPage.jsx
│   └── Dashboard.css
├── index.html
├── vite.config.js
└── package.json
```

---

## Decisões técnicas

- **Base do merge**: `backend-web` (Wander), porque já tem toda a infra de auth, middlewares, database, logger e Docker.
- **Namespace para código da Isa**: `internal/flow/` (dentro de backend-web), contendo `handlers/`, `models/`, `repository/` e `config/`.
- **Proteção das rotas de flow**: Usar `AuthMiddleware()` (qualquer usuário logado, admin ou user, pode consultar dados).
- **Padrão de código**: Manter o estilo simples existente. Sem over-engineering, sem DI frameworks, sem interfaces desnecessárias. Somos estudantes.
- **O frontend continuará carregando CSV local** para dados do mapa (por enquanto), mas ganhará a tela de login e a infraestrutura de chamadas autenticadas ao backend — preparando para a migração futura dos dados do CSV para a API.

---

## Tecnologias e versões

| Componente | Tecnologia | Versão |
|---|---|---|
| Linguagem backend | Go | 1.25.0 |
| Framework HTTP | Gin | v1.12.0 |
| ORM | GORM | v1.31.1 |
| Banco de auth | PostgreSQL | (via Docker) |
| Banco de dados | BigQuery | cloud.google.com/go/bigquery v1.74.0 |
| Geocoding | Google Maps | googlemaps.github.io/maps v1.7.0 |
| JWT | golang-jwt/jwt/v5 | v5.3.1 |
| Frontend | React + Vite | React 18+ |
| Mapa | deck.gl + MapLibre GL | — |

---

## Variáveis de ambiente necessárias após o merge

```env
# Auth (já existentes no backend-web)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=venus
DB_PORT=5432
JWT_SECRET=sua-chave-secreta

# BigQuery e Maps (vindas da src-isa)
GCP_PROJECT=venus-m09
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_MAPS_API_KEY=sua-api-key
```
