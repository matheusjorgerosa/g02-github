---
Title: Testes de Integração
sidebar-position: 2
---

# Testes de Integração End-to-End (E2E)

## 1. Visão Geral

Esta suíte de testes tem como objetivo validar, de forma abrangente, o funcionamento End-to-End (E2E) do módulo de fluxo de pessoas. Diferentemente dos testes unitários, que avaliam componentes isolados, os testes E2E verificam a correta integração entre os principais elementos do sistema — incluindo a API desenvolvida com Gin, o banco de dados BigQuery e o serviço externo Google Maps API. Dessa forma, busca-se garantir que os fluxos de dados e as regras de negócio estejam sendo executados corretamente em um ambiente que se aproxima das condições reais de produção.

## 2. Arquitetura da Suíte de Testes

### 2.1 Helper Principal (`bq_setup.go`)

O componente central da suíte é o objeto `E2ESuite`, responsável por gerenciar todo o ciclo de vida dos testes. Esse objeto desempenha um papel fundamental ao estabelecer uma conexão real com o dataset `venus-m09.trusted.ingestao`, assegurando que os testes sejam executados sobre dados autênticos. Além disso, incorpora mecanismos de resiliência por meio da função `SkipIfNoData`, que verifica previamente a existência de dados no BigQuery para os filtros aplicados, evitando assim falsos negativos decorrentes da natureza dinâmica do dataset. Por fim, o helper também implementa a função `expandAgesForCheck`, responsável por reproduzir a lógica do backend na interpretação de faixas etárias, contemplando tanto intervalos fechados, como `18-24`, quanto intervalos abertos, como `80+`.

### 2.2 Camada de Segurança e Mock (`router_for_tests.go`)

Considerando que os endpoints da API são protegidos por autenticação via JWT, foi implementada uma camada auxiliar com o objetivo de viabilizar a execução dos testes de forma controlada e realista. Nesse contexto, é criado um roteador em memória dedicado ao ambiente de testes, no qual é incluído um endpoint de autenticação mockado que permite a obtenção de tokens válidos. Dessa forma, cada teste realiza o processo de autenticação por meio do método `r.Token(t)`, simulando fielmente o fluxo real de login e garantindo que as validações ocorram sob condições próximas às de produção.


## 3. Distribuição Demográfica (`demographics_e2e_test.go`)

Este conjunto de testes avalia a consistência estatística dos dados relacionados ao perfil demográfico dos indivíduos.

| Caso de Teste | Descrição | Validação |
| :--- | :--- | :--- |
| `PercentageSum_NearHundred` | Soma das porcentagens de gênero e classe social. | Verifica se o total é aproximadamente 100%, validando o uso de `SUM(...) OVER()` no SQL. |
| `CategoryValues_Valid` | Verificação de categorias retornadas. | Garante que os valores não são nulos ou vazios (ex: "Masculino", "Classe A"). |
| `SingleGenderFilter` | Aplicação de filtro para um único gênero. | Valida se a distribuição resulta em 100% para a categoria filtrada. |
| `ResponseKeys` | Validação da estrutura da resposta JSON. | Assegura a presença dos campos `gender` e `social_class`. |
| `TwoQueries_Consistent` | Execução repetida da mesma consulta. | Verifica a consistência dos dados e evidencia possíveis variações devido à ingestão contínua. |
| `EmptyFilters_ReturnsEmpty` | Uso de filtros vazios (`UNNEST([])`). | Garante que o sistema responde com listas vazias sem falhas ou exceções. |

## 4. Métricas de Fluxo (`metrics_e2e_test.go`)

Este conjunto foca na análise do volume total de pessoas e sua distribuição ao longo das 24 horas do dia.

| Caso de Teste | Descrição | Validação |
| :--- | :--- | :--- |
| `TotalAudienceConsistency` | Comparação entre total e soma do fluxo horário. | Garante que `TotalAudience` corresponde à soma de `Flow24h`. |
| `Flow24h_OrderedByHourASC` | Verificação da ordenação temporal. | Assegura ordenação crescente por hora, evitando inconsistências na visualização. |
| `Flow24h_NoGaps_MaxOf24` | Contagem de registros horários. | Garante no máximo 24 entradas, validando o `GROUP BY hour`. |
| `SingleGenderFilter` | Comparação entre gêneros e total geral. | Verifica a coerência da regra `Feminino + Masculino ≤ Total`. |


## 5. Ranking de Localidades (`ranking_e2e_test.go`)

Este grupo valida a identificação das regiões com maior fluxo e a integração com serviços de geolocalização.

| Caso de Teste | Descrição | Validação |
| :--- | :--- | :--- |
| `LimitRespected_Ordered` | Consulta com limite definido. | Verifica aplicação correta de `LIMIT` e ordenação por volume decrescente. |
| `LimitZero_DefaultsTo10` | Uso de limite inválido (zero ou negativo). | Garante aplicação de valor padrão (10) pelo handler. |
| `GeocoderFallback` | Simulação de falha no geocoder. | Assegura retorno no formato `"lat,lng"` em caso de indisponibilidade do serviço. |
| `RealGeocoder` | Integração real com Google Maps API. | Valida a conversão de coordenadas em nomes de localidades. |
| `AgeRangePlus_Expands` | Filtro de faixa etária aberta (`80+`). | Verifica a correta expansão da faixa etária na consulta. |

## 6. Dados Espaciais / Heatmap (`spatial_e2e_test.go`)

Este conjunto de testes valida os dados utilizados na construção de mapas de calor.

| Caso de Teste | Descrição | Validação |
| :--- | :--- | :--- |
| `ValidFilters_ReturnsPoints` | Execução de consulta padrão. | Garante que os pontos possuem `latitude`, `longitude` e `volume` válidos. |
| `VolumeFieldMapping` | Verificação do campo de volume. | Assegura que o valor não seja constante ou incorretamente mapeado. |
| `AgeRange_18to24` | Filtro de faixa etária fechada. | Valida a correta aplicação do intervalo `18-24`. |
| `MalformedAgeRange` | Uso de filtro inválido (ex: `"abc-def"`). | Verifica tratamento resiliente: retorno 200 OK com dados vazios. |
| `NoToken_Returns401` | Acesso sem autenticação. | Garante que o middleware JWT bloqueia requisições não autorizadas. |


## 7. Considerações Finais

A suíte de testes E2E desempenha um papel fundamental na validação da integridade do sistema como um todo, especialmente em cenários que envolvem integrações externas, processamento de dados em larga escala e a aplicação de regras de negócio. Nesse sentido, a abordagem adotada prioriza aspectos como resiliência, realismo e cobertura funcional, contribuindo de forma significativa para o aumento da confiabilidade e robustez da aplicação em ambiente de produção.