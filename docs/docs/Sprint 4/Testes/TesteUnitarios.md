---
Title: Testes Unitários
sidebar-position: 1
---

# Testes Unitários

## 1. Visão Geral

A suíte de testes unitários do módulo `flow` tem como objetivo principal validar de forma isolada o comportamento de unidades individuais de código — funções, métodos e regras de negócio — sem dependência de infraestrutura real, como bancos de dados ou serviços externos. O foco está em garantir que cada componente do sistema se comporte conforme sua especificação formal, independentemente do estado do ambiente de execução.

## 2. Arquitetura da Suíte de Testes

### 2.1 Organização Geral

Os testes estão organizados seguindo a estrutura de pacotes da aplicação, respeitando a separação entre as camadas de apresentação (`handlers`) e de acesso a dados (`repository`). Cada arquivo de teste é colocado no mesmo pacote lógico da unidade que testa, utilizando a convenção `package handlers` e `package repository`, o que garante acesso direto aos tipos e interfaces necessárias sem exposição desnecessária de símbolos internos.

### 2.2 Uso de Mocks e Stubs

A simulação de dependências externas é realizada por meio de structs que implementam as interfaces definidas no domínio, como `FlowRepository`, `DBEngine` e `GeoCoder`. O arquivo `mock_repo_test.go` define a struct `MockFlowRepository`, que encapsula funções substituíveis para cada método do repositório, permitindo que cada caso de teste configure o comportamento esperado de forma precisa e localizada.

Na camada de repositório, a interface `DBEngine` é simulada pela struct `MockDBEngine`, cuja função `MockQuery` pode ser redefinida a cada teste para retornar iteradores customizados — como `MetricsIterator`, `SpatialIterator`, `DemographicsIterator` e `MockIterator` — que emulam o comportamento do cliente BigQuery sem realizar qualquer chamada de rede. Da mesma forma, a interface `GeoCoder` é simulada por `MockGeoCoder`, com controle total sobre o resultado do reverse geocoding. Esse modelo de isolamento é fundamental para garantir previsibilidade e determinismo: os testes não dependem de disponibilidade de rede, estado de banco de dados ou configuração de ambiente, tornando a execução da suíte reprodutível em qualquer contexto.

## 3. Testes por Módulo

### 3.1 Handler de Demografia (`demographics_handler_test.go`)

Este conjunto de testes valida o comportamento do handler `HandleDemographics` frente a diferentes cenários de entrada e estado do repositório. O objetivo é verificar que o handler processa corretamente payloads válidos, rejeita entradas malformadas com o código HTTP adequado e propaga falhas do repositório como erros internos do servidor.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Retorna demografia corretamente` | Payload válido com filtro de faixa etária; repositório retorna resposta vazia sem erro | Código HTTP `200 OK` |
| `Erro 400 - Payload invalido` | Corpo da requisição é uma string inválida (não serializável como JSON) | Código HTTP `400 Bad Request` |
| `Erro 500 - Falha no repositorio` | Payload válido; repositório retorna erro genérico de banco de dados | Código HTTP `500 Internal Server Error` |

### 3.2 Handler de Métricas (`metrics_handler_test.go`)

Este conjunto valida o handler `HandleMetrics`, responsável por retornar métricas gerais de audiência. Os testes cobrem o caminho feliz com dados de audiência, um cenário de payload estruturalmente inválido e uma falha simulada de timeout no BigQuery.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Retorna metricas gerais` | Payload vazio válido; repositório retorna `MetricsResponse` com `TotalAudience: 1000` | Código HTTP `200 OK` |
| `Erro 400 - Bad Request` | Payload com campo `filters` de tipo incorreto (string ao invés de objeto) | Código HTTP `400 Bad Request` |
| `Erro 500 - Erro de banco de dados` | Payload válido; repositório simula timeout no BigQuery | Código HTTP `500 Internal Server Error` |


### 3.3 Handler de Ranking de Bairros (`ranking_handler_test.go`)

Este conjunto valida o handler `HandleNeighborhoodRanking`, com ênfase especial na lógica de fallback de limite. Além dos cenários de sucesso e erro, inclui um caso de borda que verifica se o handler substitui um limite zero pelo valor padrão de 10, garantindo robustez no comportamento da API.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Limite informado` | Payload com `Limit: 5`; repositório verifica se recebeu exatamente o valor 5 | Código HTTP `200 OK`; parâmetro `limit` igual a `5` |
| `Sucesso - Edge Case: Fallback para limite padrao (10)` | Payload com `Limit: 0`; handler deve substituir por 10 antes de chamar o repositório | Código HTTP `200 OK`; parâmetro `limit` igual a `10` |
| `Erro 500 - Erro no repositorio de ranking` | Payload padrão; repositório retorna erro geográfico genérico | Código HTTP `500 Internal Server Error` |

### 3.4 Handler de Dados Espaciais (`spatial_handler_test.go`)

Este conjunto valida o handler `HandleSpatialData`, que retorna pontos georreferenciados com latitude, longitude e volume de audiência. Os testes cobrem o retorno bem-sucedido de dados espaciais, rejeição de JSON malformado e propagação de erros internos do repositório.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Dados espaciais retornados` | Payload válido; repositório retorna um ponto com coordenadas de São Paulo e volume `100` | Código HTTP `200 OK` |
| `Erro 400 - JSON incorreto` | Corpo da requisição contém JSON sintaticamente inválido (`{ bad_json }`) | Código HTTP `400 Bad Request` |
| `Erro 500 - Repositorio falhou` | Payload válido; repositório retorna erro interno do BigQuery | Código HTTP `500 Internal Server Error` |

### 3.5 Repositório de Dados Espaciais (`spatial_repo_test.go`)

Este conjunto valida o método `GetSpatialData` do repositório, verificando se os dados retornados pelo iterador de banco de dados são corretamente mapeados para a struct `SpatialResponse`, preservando os campos de latitude, longitude e volume.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Mapeamento de Latitude/Longitude` | Iterador retorna dois pontos geográficos distintos | Slice resultante com comprimento `2`; primeiro elemento com `Volume: 500` |

### 3.6 Repositório de Métricas Gerais (`metrics_repo_test.go`)

Este conjunto valida o método `GetGeneralMetrics`, com foco na agregação de volumes horários e no comportamento frente a um resultado vazio do banco de dados. O teste verifica tanto a soma total do público (`TotalAudience`) quanto a correta construção do array de fluxo horário (`Flow24h`).

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Soma total e mapeia as horas corretamente` | Iterador retorna dois registros horários com volumes `150` e `50` | `TotalAudience` igual a `200`; `len(Flow24h)` igual a `2` |
| `Sucesso - Retorno vazio do banco` | Iterador retorna slice vazio | `TotalAudience` igual a `0`; `len(Flow24h)` igual a `0` |

### 3.7 Repositório de Ranking de Bairros (`ranking_repo_test.go`)

Este conjunto é o mais completo da suíte de repositórios, validando o método `GetNeighborhoodRanking` em três dimensões: o caminho feliz com geocodificação bem-sucedida, o comportamento de fallback quando o endereço não é encontrado, e a propagação de erros de consulta ao banco de dados.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Deve retornar ranking formatado com nome de rua` | Iterador retorna um ponto; geocoder resolve para `"Avenida Paulista"` | Slice com comprimento `1`; `res[0].Name` igual a `"Avenida Paulista"` |
| `Sucesso - Endereço não encontrado (Fallback)` | Iterador retorna um ponto; geocoder retorna erro de endereço não localizado | Slice com comprimento `1`; `res[0].Name` igual a `"Rua não encontrada"` |
| `Erro - Falha na query do BigQuery` | Iterador retorna erro de timeout; nenhum dado processado | Erro não nulo retornado; slice resultante vazio |


### 3.8 Repositório de Dados Demográficos (`demographics_repo_test.go`)

Este conjunto valida o método `GetDemographics`, que realiza múltiplas consultas ao banco de dados para compor a distribuição de gênero e classe social do público. O mock do `DBEngine` diferencia as consultas por conteúdo do SQL, retornando iteradores distintos para cada dimensão demográfica.

| Caso de Teste | Descrição | Validação |
|---|---|---|
| `Sucesso - Retorna distribuição de gênero e classe` | Iterador retorna `"Feminino"` para a query de gênero e `"Classe C"` para a query de classe social | `res.Gender[0].Category` igual a `"Feminino"`; `res.SocialClass[0].Category` igual a `"Classe C"` |
| `Erro - Falha na query do banco` | Iterador retorna erro para qualquer query executada | Erro não nulo retornado pelo método |

## 5. Considerações Finais

Os testes unitários documentados neste relatório representam um componente estrutural da estratégia de qualidade do módulo `flow`, garantindo que cada unidade de código seja verificada de forma precisa, isolada e reprodutível. Ao validar handlers e repositórios em separado, a suíte permite identificar a origem exata de qualquer falha de comportamento, reduzindo significativamente o tempo médio de diagnóstico e resolução de defeitos.