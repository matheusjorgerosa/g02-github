---
sidebar_position: 1
---

# Teste de Carga da Camada de Ingestão com k6

## Objetivo do teste
Este teste teve como objetivo validar se a camada de ingestão suporta **alto volume contínuo de sensores** sem degradação de completude. O foco principal foi medir a capacidade de recebimento e processamento sustentado, observando **perda de registros** ao longo do pipeline. Latência foi tratada apenas como indicador secundário de saúde da API durante a execução.

## Explicação breve da arquitetura
A arquitetura testada segue o fluxo: **API Gateway → Cloud Run (producer) → Pub/Sub (fila de ingestão) → Cloud Run Job (consumer em lote) → GCS `raw/` → Eventarc → Cloud Run (transformer) → GCS `trusted/` e BigQuery**. Em resumo, o gateway recebe os eventos HTTP dos sensores, o producer publica na fila, o consumer drena em lote para o Data Lake e o transformer consolida os dados para consumo analítico.

## Escopo e premissas
### Escopo
- Teste de carga de escrita no endpoint `POST /ingest` exposto no API Gateway `https://ingestao-gateway-5zyx9zcn.ue.gateway.dev/ingest`.
- Geração de eventos sintéticos com payload JSON contendo `latitude`, `longitude`, `idade`, `classe_social`, `genero` e `timestamp`.
- Execução com cenário `ramping-arrival-rate`, com objetivo de estressar o recebimento em rampa até taxa muito alta de chegada.
- Verificação funcional da resposta via checks de `status 202` e check auxiliar de tempo `<500ms`.

### Premissas do teste executado
- Executor utilizado: `ramping-arrival-rate`.
- `startRate`: `50` requisições/segundo (`timeUnit: 1s`).
- Capacidade de geração configurada: `preAllocatedVUs: 10000` e `maxVUs: 100000`.
- Estágios aplicados:
	- `30s` → `1000 req/s`
	- `30s` → `5000 req/s`
	- `1m` → `10000 req/s`
	- `1m` → `30000 req/s`
	- `1m` → `50000 req/s`
	- `1m` → `70000 req/s`
	- `1m` → `100000 req/s`
- `gracefulStop`: `30s`.
- Threshold configurado: `http_req_failed: rate < 0.01` (menos de 1% de falhas HTTP).
- Interpretação de sucesso alinhada ao objetivo: priorizar **completude** (menor perda de registros) sobre métricas de latência.

## 1. Setup de ambiente
O ambiente de teste foi provisionado com **Terraform**.

Foi criada uma VM dedicada (`k6-load-test`) com Ubuntu 22.04, disco de 50 GB e tipo `c2-standard-8`. O `startup_script` instalou o **k6** automaticamente no boot.

Também foi criada uma regra de firewall (`allow-k6`) para liberar TCP `3000` e `6565` para instâncias com tag `k6-load-test`, além de IP público para acesso SSH.

## 2. Execução do teste
A execução foi realizada na VM de carga com o comando abaixo:

```bash
k6 run --out resultado.json script.js
```

O vídeo abaixo mostra o teste ocorrendo:

<div style={{ display: "flex", justifyContent: "center", marginTop: "2rem", marginBottom: "2rem" }}>
	<iframe width="700" height="340" 
	 src="https://www.youtube.com/embed/tLd8Ua738ZA" title="YouTube video player" frameborder="0" 
	 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
	 referrerpolicy="strict-origin-when-cross-origin" allowfullscreen 
	></iframe>

</div>

## 3. Resultados dos testes
### Resultado consolidado da execução principal
- Duração total: `6m08.9s`
- Iterações completas: `4,723,857`
- Iterações interrompidas: `0`
- Requisições HTTP: `4,723,857` (`12,804.05 req/s`)
- `checks_total`: `9,447,714`
- `checks_succeeded`: `51.85%` (`4,899,483`)
- `checks_failed`: `48.14%` (`4,548,231`)

### Indicadores críticos
- `http_req_failed`: `82.74%` (`3,908,736` de `4,723,857`)
- Check `status 202`: `17%` (`815,121` de `3,908,736`)
- `dropped_iterations`: `391,010`
- Threshold final violado: `http_req_failed: rate < 0.01`

### Latência observada
- `http_req_duration`:
	- média: `1.27s`
	- mediana: `258.4ms`
	- p90: `2.27s`
	- p95: `10.48s`
	- máximo: `23.55s`

### Interpretação técnica
Os resultados mostram saturação clara sob carga alta. A taxa de falha (`82.74%`) invalida a sustentação do cenário de pico, e a degradação de p95 para ~`10s` indica acúmulo de fila e instabilidade operacional em regime de sobrecarga.

O indicador de respostas rápidas `<500ms` isoladamente não representa sucesso do teste, pois parte relevante das respostas rápidas pode corresponder a erros. O principal sinal de não conformidade é a baixa taxa de sucesso para `status 202`, combinada com violação de threshold e volume elevado de iterações descartadas.

### Conclusão por faixa de carga
Nos testes em `1k`, `5k` e `10k req/s`, o comportamento foi mais satisfatório. A partir de cargas acima de `20k req/s`, o sistema passou a degradar de forma consistente, com aumento acentuado de falhas e perda de confiabilidade.

## 4. Plano de ajustes necessários
Com base no comportamento observado, pretendemos executar os seguintes ajustes de arquitetura e escalabilidade antes de uma nova rodada de testes.

### 4.1 Ajuste da camada de entrada
- Remover `API Gateway` do caminho de ingestão.
- Adotar fluxo: **Cliente → HTTP Load Balancer → Cloud Run (producer) → Pub/Sub**.
- Objetivo: reduzir overhead na entrada e aumentar capacidade de absorção sob pico.

### 4.2 Ajustes de escala do Cloud Run producer
- Configurar escala explícita no `producer`:
	- `min_instance_count = 10`
	- `max_instance_count = 1000`
	- `max_instance_request_concurrency = 500`
	- recursos por instância: `cpu = 2`, `memory = 512Mi`
- Objetivo: reduzir impacto de cold start, aumentar throughput por instância e ampliar capacidade total de escala.

### 4.3 Substituição do modelo de consumo
- Substituir o `Cloud Run Job` batch por consumo contínuo com **Pub/Sub Push Subscription → Cloud Run (consumer)**.
- Objetivo: eliminar janela fixa de processamento (`*/1`) e permitir escala automática com o backlog real da fila.

### 4.4 Escala do transformer
- Aumentar `max_instance_count` do `transformer` para faixa entre `50` e `100`.
- Objetivo: evitar gargalo na etapa `Eventarc → transformer` durante picos de criação de arquivos em `raw/`.

### 4.5 Revalidação
Após aplicar os ajustes, pretendemos repetir os testes de carga com a mesma metodologia para comparar:
- taxa de falha HTTP;
- taxa de sucesso `status 202`;
- estabilidade de latência em p90/p95;
- comportamento de perda de registros em cargas acima de `20k req/s`.

