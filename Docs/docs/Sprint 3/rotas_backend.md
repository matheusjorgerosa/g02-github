---
sidebar_position: 3
---

# Requisitos do Backend: Rotas e Filtragem de Dados

Como o frontend atualmente consome um arquivo CSV estático e realiza o processamento pesado de cruzamento demográfico diretamente no cliente, faz-se necessária a migração dessa inteligência de filtragem para o backend. Essa mudança visa garantir a escalabilidade da aplicação, lidar com bases de dados ainda maiores e reduzir a carga de processamento exigida pelo dispositivo do usuário.

Este documento detalha os requisitos e a modelagem das rotas da API (backend) que fornecerão os dados dinâmicos para a interface do Dashboard VENUS.

---

## 1. Visão Geral da Nova Arquitetura

O backend será responsável por receber os filtros selecionados pelo usuário no frontend (Painel de Filtros de Público), processar o cruzamento de dados na base de dados (ou Data Warehouse) em tempo real, e devolver os conjuntos de dados já formatados e agregados prontos para consumo pelos gráficos e pelo mapa 3D (deck.gl).

### 1.1. Modelo de Filtros (Payload Padrão)

Todas as rotas de busca de dados que dependem da interação do usuário devem aceitar um payload padrão contendo os parâmetros demográficos selecionados.

**Exemplo de Payload de Requisição (JSON):**
```json
{
  "filters": {
    "ageGroups": ["18-19", "20-29", "30-39"],
    "genders": ["F", "M"],
    "socialClasses": ["A", "B1", "B2", "C1", "C2", "DE"],
    "onlyRelevantBins": true
  }
}
```

---

## 2. Mapeamento das Rotas

Abaixo estão as rotas essenciais para o funcionamento de todos os componentes do frontend.

### 2.1. Rota de Dados Espaciais (Mapa 3D)

Fornece a base de dados pontual ou já agrupada por coordenadas para renderizar a `HexagonLayer`. O backend deverá aplicar a lógica do "Multiplicador Probabilístico" (cruzamento das porcentagens demográficas filtradas) e retornar apenas a volumetria final de cada coordenada.

*   **Endpoint:** `POST /api/v1/flow/spatial`
*   **Descrição:** Retorna a lista de coordenadas geográficas e a volumetria ponderada de fluxo de pessoas com base nos filtros aplicados.
*   **Corpo da Requisição:** Modelo de Filtros Padrão.
*   **Formato de Resposta (Sucesso 200 OK):**
```json
{
  "data": [
    {
      "location_id": "LOC-123",
      "latitude": -23.550520,
      "longitude": -46.633308,
      "weighted_uniques": 4500 
    },
    ...
  ]
}
```

### 2.2. Rota de Métricas Gerais e Gráfico de 24h

Fornece os indicadores principais de cabeçalho do painel de métricas secundário. Retorna o público total calculado, o horário de pico e a evolução da volumetria hora a hora ao longo do dia.

*   **Endpoint:** `POST /api/v1/flow/metrics`
*   **Descrição:** Retorna métricas consolidadas (Público Total, Pico) e a série temporal para preenchimento do gráfico de "Fluxo 24h".
*   **Corpo da Requisição:** Modelo de Filtros Padrão.
*   **Formato de Resposta (Sucesso 200 OK):**
```json
{
  "totalAudience": 149534910,
  "peakTime": "18:00",
  "flow24h": [
    { "hour": "00:00", "volume": 1200300 },
    { "hour": "01:00", "volume": 800100 },
    ...
    { "hour": "18:00", "volume": 15000000 }
  ]
}
```

### 2.3. Rota de Ranking por Bairro/Endereço

Responsável por fornecer os dados para o gráfico de barras horizontais "Distribuição por Bairro (Endereço)". O backend precisa agrupar a volumetria calculada pelas regiões/vias e retornar de forma ordenada (do maior para o menor).

*   **Endpoint:** `POST /api/v1/flow/ranking/neighborhoods`
*   **Descrição:** Retorna os top N endereços/bairros com maior concentração do público filtrado.
*   **Corpo da Requisição:** 
```json
{
  "filters": { /* Modelo Padrão */ },
  "limit": 10 // Quantidade de barras a retornar
}
```
*   **Formato de Resposta (Sucesso 200 OK):**
```json
{
  "data": [
    { "name": "AVENIDA SANTO AMARO", "volume": 8500000 },
    { "name": "AVENIDA REBOUÇAS", "volume": 6200000 },
    { "name": "R DA CONSOLAÇÃO", "volume": 4100000 }
  ]
}
```

### 2.4. Rota de Distribuição Demográfica Interna

Alimenta os gráficos finais do dashboard ("Distribuição por Gênero" e "Distribuição por Classe Social"). Com base nos filtros primários aplicados, esta rota calcula qual é a real proporção de cada sub-demografia *dentro do total resultante*. 

*   **Endpoint:** `POST /api/v1/flow/distribution/demographics`
*   **Descrição:** Retorna a distribuição percentual e volumétrica segregada por Gênero e Classe Social para os gráficos de pizza/rosca ou barras.
*   **Corpo da Requisição:** Modelo de Filtros Padrão.
*   **Formato de Resposta (Sucesso 200 OK):**
```json
{
  "gender": [
    { "category": "Masculino", "percentage": 48.5, "volume": 72524431 },
    { "category": "Feminino", "percentage": 51.5, "volume": 77010479 }
  ],
  "socialClass": [
    { "category": "A", "percentage": 15.0, "volume": 22430236 },
    { "category": "B1", "percentage": 25.0, "volume": 37383727 },
    ...
  ]
}
```

---

## 3. Considerações e Regras de Negócio no Backend

1. **Cálculo de Interseção Probabilística:** A agregação de percentuais por perfil do usuário (ex: se o frontend envia "Feminino" e "Masculino") deve resultar na soma dos respectivos percentuais de cada ponto geográfico. O cruzamento entre diferentes eixos demográficos (Idade × Gênero × Classe Social) ocorre por **multiplicação** das taxas somadas, aplicando este fator final no número absoluto de "uniques" (pessoas) daquele local.
2. **Performace:** As queries envolvendo milhões de registros geolocalizados devem ser altamente otimizadas. É fortemente sugerido o uso de particionamento de tabelas (ex: por faixa de horário ou região geográfica) ou de bancos de dados orientados a colunas/Data Warehouses (como BigQuery, ClickHouse ou similares) para suportar tempos de resposta adequados (sub-segundos ou próximos a isso).
3. **Paginação/Limite Opcional:** Caso a rota espacial (`/flow/spatial`) comece a retornar payloads imensos que travem o navegador, o backend deve ser capaz de realizar um *clustering* prévio geográfico, agrupando pontos muito próximos antes de enviá-los ao deck.gl, ou aplicar limites baseados na visão da câmera (Bounding Box / Viewport).