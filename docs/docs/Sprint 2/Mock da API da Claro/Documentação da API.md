---
title: Documentação da API
sidebar_position: 2
---

Este mock foi desenvolvido para permitir a realização de testes de integração, dado que não temos acesso à API oficial da Claro. Desse modo, ele simula as respostas reais da API com dados de fluxo diário. Nesse sentido, a API expõe um único endpoint REST que retorna dados de impressões, dispositivos únicos, distribuição por hora, faixa etária, gênero e classe social.

## Estrutura do Projeto

```
src/mock-api-claro/
├── data/
│   └── fluxo_diario_20260106.csv   # Base de dados usada pelo mock
├── Dockerfile                       # Configuração do container
├── main.py                          # Aplicação FastAPI
└── requirements.txt                 # Dependências Python
```


## Guia de Execução Local

### Pré-requisitos

- Docker instalado

### Passos

```bash
# 1. Fazer o build da imagem
docker build -t mock-api-claro .

# 2. Rodar o container
docker run -p 8080:8080 mock-api-claro
```

> A API ficará disponível em: `http://localhost:8080`

## Deploy

- A API está hospedada no Google Cloud Run e já está disponível publicamente.

**URL:** https://mock-api-claro-470119945271.us-central1.run.app

> Para instruções de como realizar um novo deploy, consulte o **[guia de deploy](./Guia%20de%20Deploy.md)**.

Segue a documentação atualizada considerando suporte a paginação via query params:

---

## Referência da API

### `GET /mock-api-claro`

**URL completa:**

```
GET https://mock-api-claro-470119945271.us-central1.run.app/mock-api-claro
```

#### Parâmetros (Query Params)

| Parâmetro   | Tipo | Obrigatório | Descrição                           |
| ----------- | ---- | ----------- | ----------------------------------- |
| `page_num`  | int  | Não         | Número da página (começa em 1).     |
| `page_size` | int  | Não         | Quantidade de registros por página. |

##### Regras:

* Se **nenhum parâmetro** for enviado, retornam-se todos os registros.
* Se ambos forem enviados, aplica-se paginação nos conjuntos:

  * `impressions_by_hour`
  * `uniques_by_age_and_gender`
  * `uniques_by_social_class`

##### Exemplo com paginação

```
GET /mock-api-claro?page_num=1&page_size=10
```

* `num_records` representa o **total de registros antes da paginação**.
* A paginação é aplicada **após agregações**.
* `impressions` e `unique_devices` não são paginados, pois retornam apenas um registro agregado.

### Estrutura da Resposta

```json
{
  "data": {
    "impressions": { ... },
    "impressions_by_hour": { ... },
    "unique_devices": { ... },
    "uniques_by_age_and_gender": { ... },
    "uniques_by_social_class": { ... }
  },
  "map_data": {
    "data_escrita": "2026-02-26 17:41:31",
    "map_id": "3e6d448f-8808-4fdd-b815-a078b378ed5a",
    "map_name": "SP-CI794!"
  },
  "metadata": {
    "locations": []
  }
}
```

### Campos de Resposta

#### `data.impressions`

- Total de impressões registradas no período.

```json
{
  "data": [{ "total_trips": 149606856 }],
  "metadata": { "num_records": 1, "page_num": null, "page_size": null, "used_locations": 0 }
}
```

#### `data.impressions_by_hour`

- Distribuição de impressões por hora do dia (0–23).

```json
{
  "data": [
    { "impression_hour": 0, "total_trips": 1181621.02 },
    { "impression_hour": 6, "total_trips": 8297582.01 },
    { "impression_hour": 18, "total_trips": 11578072.89 },
    ...
  ],
  "metadata": { "num_records": 24, ... }
}
```

#### `data.unique_devices`

- Total de dispositivos únicos identificados.

```json
{
  "data": [{ "uniques": 149606856 }],
  "metadata": { "num_records": 1, ... }
}
```

#### `data.uniques_by_age_and_gender`

- Distribuição de dispositivos únicos por faixa etária e gênero. Os valores são estimados a partir das proporções presentes no campo `target` do CSV.

- Faixas etárias disponíveis: `18-19`, `20-29`, `30-39`, `40-49`, `50-59`, `60-69`, `70-79`, `80+`

- Gêneros: `F` (Feminino), `M` (Masculino)

```json
{
  "data": [
    { "age": "18-19", "gender": "F", "uniques": 4130847 },
    { "age": "40-49", "gender": "M", "uniques": 21085228 },
    ...
  ],
  "metadata": { "num_records": 16, ... }
}
```

#### `data.uniques_by_social_class`

- Distribuição de dispositivos únicos por classe social.

- Classes disponíveis: `A`, `B1`, `B2`, `C1`, `C2`, `DE`

```json
{
  "data": [
    { "social_class": "A",  "uniques": 6019840  },
    { "social_class": "B1", "uniques": 11336255 },
    { "social_class": "B2", "uniques": 37595156 },
    { "social_class": "C1", "uniques": 44266174 },
    { "social_class": "C2", "uniques": 39151707 },
    { "social_class": "DE", "uniques": 11093073 }
  ],
  "metadata": { "num_records": 6, ... }
}
```

#### `map_data`

- Metadados do mapa associado ao relatório.

| Campo         | Tipo     | Descrição                                      |
|---------------|----------|------------------------------------------------|
| `data_escrita`| `string` | Timestamp de geração da resposta               |
| `map_id`      | `string` | UUID único gerado a cada requisição            |
| `map_name`    | `string` | Identificador do mapa (ex: `SP-CI794!`)        |


### Exemplo de Resposta Completa

<details>
<summary>Ver JSON completo</summary>

```json
{
  "data": {
    "impressions": {
      "data": [{ "total_trips": 149606856 }],
      "metadata": { "num_records": 1, "page_num": null, "page_size": null, "used_locations": 0 }
    },
    "impressions_by_hour": {
      "data": [
        { "impression_hour": 0,  "total_trips": 1181621.02  },
        { "impression_hour": 1,  "total_trips": 905410.23   },
        { "impression_hour": 2,  "total_trips": 660834.10   },
        { "impression_hour": 3,  "total_trips": 789040.74   },
        { "impression_hour": 4,  "total_trips": 1625424.19  },
        { "impression_hour": 5,  "total_trips": 4337551.97  },
        { "impression_hour": 6,  "total_trips": 8297582.01  },
        { "impression_hour": 7,  "total_trips": 10889562.00 },
        { "impression_hour": 8,  "total_trips": 10743081.93 },
        { "impression_hour": 9,  "total_trips": 8434456.66  },
        { "impression_hour": 10, "total_trips": 7747728.03  },
        { "impression_hour": 11, "total_trips": 7186308.36  },
        { "impression_hour": 12, "total_trips": 7638306.09  },
        { "impression_hour": 13, "total_trips": 7569365.77  },
        { "impression_hour": 14, "total_trips": 7137664.19  },
        { "impression_hour": 15, "total_trips": 7518913.59  },
        { "impression_hour": 16, "total_trips": 8587697.86  },
        { "impression_hour": 17, "total_trips": 10475863.50 },
        { "impression_hour": 18, "total_trips": 11578072.89 },
        { "impression_hour": 19, "total_trips": 9385665.22  },
        { "impression_hour": 20, "total_trips": 6479478.76  },
        { "impression_hour": 21, "total_trips": 4584234.90  },
        { "impression_hour": 22, "total_trips": 3838693.39  },
        { "impression_hour": 23, "total_trips": 2014299.51  }
      ],
      "metadata": { "num_records": 24, "page_num": null, "page_size": null, "used_locations": 0 }
    },
    "unique_devices": {
      "data": [{ "uniques": 149606856 }],
      "metadata": { "num_records": 1, "page_num": null, "page_size": null, "used_locations": 0 }
    },
    "uniques_by_age_and_gender": {
      "data": [
        { "age": "18-19", "gender": "F", "uniques": 4130847  },
        { "age": "18-19", "gender": "M", "uniques": 5447878  },
        { "age": "20-29", "gender": "F", "uniques": 10300740 },
        { "age": "20-29", "gender": "M", "uniques": 13198291 },
        { "age": "30-39", "gender": "F", "uniques": 14943683 },
        { "age": "30-39", "gender": "M", "uniques": 19392876 },
        { "age": "40-49", "gender": "F", "uniques": 16231459 },
        { "age": "40-49", "gender": "M", "uniques": 21085228 },
        { "age": "50-59", "gender": "F", "uniques": 11697356 },
        { "age": "50-59", "gender": "M", "uniques": 15138193 },
        { "age": "60-69", "gender": "F", "uniques": 5636719  },
        { "age": "60-69", "gender": "M", "uniques": 7303571  },
        { "age": "70-79", "gender": "F", "uniques": 1725772  },
        { "age": "70-79", "gender": "M", "uniques": 2248166  },
        { "age": "80+",   "gender": "F", "uniques": 370949   },
        { "age": "80+",   "gender": "M", "uniques": 489795   }
      ],
      "metadata": { "num_records": 16, "page_num": null, "page_size": null, "used_locations": 0 }
    },
    "uniques_by_social_class": {
      "data": [
        { "social_class": "A",  "uniques": 6019840  },
        { "social_class": "B1", "uniques": 11336255 },
        { "social_class": "B2", "uniques": 37595156 },
        { "social_class": "C1", "uniques": 44266174 },
        { "social_class": "C2", "uniques": 39151707 },
        { "social_class": "DE", "uniques": 11093073 }
      ],
      "metadata": { "num_records": 6, "page_num": null, "page_size": null, "used_locations": 0 }
    }
  },
  "map_data": {
    "data_escrita": "2026-02-26 17:41:31",
    "map_id": "3e6d448f-8808-4fdd-b815-a078b378ed5a",
    "map_name": "SP-CI794!"
  },
  "metadata": {
    "locations": []
  }
}
```

</details>
