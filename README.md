# Visualizador de Dados de Fluxo de Pessoas - Eletromidia

## 🔗 Link para Documentação

> 📚 **Documentação Online:** https://graduacao.pages.git.inteli.edu.br/2026-1a/t12/g02/

---

## 📖 Sobre o Projeto

Este projeto, desenvolvido em parceria com a **Eletromidia**, consiste em uma aplicação web intuitiva para visualizar e analisar dados de fluxo de pessoas na cidade de São Paulo. A ferramenta permite que diferentes áreas da empresa gerem insights através de mapas de calor, gráficos interativos e filtros personalizados por região, horário e segmentação demográfica, tornando dados complexos acessíveis para profissionais de diversas áreas.

---

## 🚀 Como Rodar a Documentação

A documentação foi desenvolvida com **Docusaurus**.

### Pré-requisitos

- **Node.js** (versão 16.14 ou superior)
- **npm** ou **yarn**

### Passos para Instalação

#### 1. Instalar Node.js e npm

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

**macOS:**
```bash
brew install node
```

**Windows:**
Baixe o instalador em [nodejs.org](https://nodejs.org/)

Verifique a instalação:
```bash
node --version
npm --version
```

#### 2. Clonar o Repositório

```bash
git clone https://git.inteli.edu.br/graduacao/2026-1a/t12/g02.git
cd g02
```

#### 3. Rodar a Documentação

```bash
cd docs
npm install
npm start
```

A documentação estará disponível em `http://localhost:3000`

## Como rodar a plataforma

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+
- Arquivo `service-account.json` do GCP em `src/backend-web/`

#### 1. Configurar variáveis de ambiente

```bash
cp src/backend-web/.env.example src/backend-web/.env
```
Preencha no .env:
```bash
JWT_SECRET — segredo para tokens JWT
GOOGLE_MAPS_API_KEY — chave da API do Google Maps
- GCP_PROJECT — projeto GCP (padrão: venus-m09)
```

#### 2. Subir o backend

```bash
cd src/backend-web
docker compose up --build
```

Aguarde o log a aplicação subir.

A API fica em http://localhost:8080.

#### 3. Subir o frontend

```bash
cd sp-density-map
npm install
npm run dev
```

Acesse http://localhost:5173.

#### 4. Verificar os serviços

```bash
Health: http://localhost:8080/health

Frontend: http://localhost:5173

Backend: http://localhost:8080

Swagger: http://localhost:8080/docs/index.html
```

## Como rodar os testes de integração

### 1. Pré-requisitos

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/service-account.json
export TEST_USER_EMAIL=
export TEST_USER_PASSWORD=
export JWT_SECRET=
export GOOGLE_MAPS_API_KEY=
```

### 2. Como rodar

Rode esses comandos para rodar todos os testes de integração

```bash

cd src/backend-web/tests
make test-e2e

```

Rode esses comandos para rodar os testes de integração por endpoint

```bash

cd src/backend-web/tests

make test-e2e-spatial
make test-e2e-metrics
make test-e2e-ranking
make test-e2e-demographics

```