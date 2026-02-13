---
sidebar_position: 2
title: Requisitos Não Funcionais
---

# Requisitos Não Funcionais

---
## 1. Contextualização

Os Requisitos Não Funcionais (RNF) definem os atributos de qualidade do sistema, como desempenho, segurança, confiabilidade e escalabilidade. Para este projeto, que lida com **Big Data** (fluxo de pessoas em metrópoles) e utiliza uma arquitetura *Serverless* na AWS, os RNFs são cruciais para garantir que a ingestão de dados não falhe sob alta carga e que a visualização seja fluida.

### Alinhamento com a Arquitetura Proposta
A definição destes requisitos considera explicitamente a arquitetura de ingestão apresentada:
- **AWS API Gateway & SQS:** Para desacoplamento e absorção de picos de carga.
- **AWS Lambda:** Para processamento escalável sob demanda.
- **Data Lake (S3 + Apache Iceberg):** Para garantir transações ACID e performance em grandes volumes de dados (camada *Bronze/Raw*).

## 2. Lista de Requisitos Não Funcionais

| ID | Categoria | Requisito | Prioridade | Critério de Aceite |
| :--- | :--- | :--- | :--- | :--- |
| **Performance e Eficiência** |
| RNF-01 | **Latência de Ingestão** | O tempo total de processamento da ingestão (desde a chegada no API Gateway até a persistência na tabela Iceberg no S3) não deve exceder **5 minutos** por lote de arquivos, garantindo atualização quase real-time para processos batch. | Alta | Monitoramento via AWS CloudWatch deve indicar duração da função Lambda dentro do limite estabelecido. |
| RNF-02 | **Tempo de Resposta do Dashboard** | As consultas no banco de dados relacional (consumido pelo visualizador) devem retornar em menos de **3 segundos** para filtros padrões (ex: fluxo diário por região), mesmo com milhões de registros históricos. | Alta | Testes de carga no front-end simulando 50 usuários simultâneos mantendo o tempo de resposta < 3s. |
| **Escalabilidade e Volumetria (Smart City)** |
| RNF-03 | **Elasticidade de Processamento** | O sistema deve escalar automaticamente o número de instâncias da AWS Lambda para processar múltiplas mensagens da fila SQS simultaneamente, suportando picos de envio da Claro Geodata sem intervenção manual. | Crítica | O sistema deve processar um aumento de 300% no volume de dados de entrada sem gerar erros de *throttling* ou perda de mensagens. |
| RNF-04 | **Capacidade de Armazenamento** | O Data Lake (S3) e as tabelas Iceberg devem suportar o armazenamento de dados históricos de, no mínimo, **5 anos** de fluxo de pessoas sem degradação de performance na escrita. | Alta | A arquitetura deve permitir particionamento dos dados (ex: por ano/mês/região) nas tabelas Iceberg. |
| **Confiabilidade e Integridade** |
| RNF-05 | **Tolerância a Falhas (Ingestão)** | Caso o processamento na Lambda falhe, a mensagem deve retornar à fila SQS e, após 3 tentativas falhas, ser enviada para uma **DLQ (Dead Letter Queue)** para análise posterior, garantindo perda zero de dados. | Alta | Simulação de erro no código da Lambda deve resultar no redirecionamento da mensagem para a DLQ correspondente. |
| RNF-06 | **Consistência de Dados (ACID)** | A gravação no Data Lake deve utilizar o formato **Apache Iceberg** para garantir propriedades ACID (Atomicidade, Consistência, Isolamento, Durabilidade), evitando leituras de dados parciais ou corrompidos durante o processo de escrita. | Alta | Consultas concorrentes durante o processo de ingestão não devem retornar dados incompletos ("dirty reads"). |
| **Segurança e Privacidade** |
| RNF-07 | **Segurança em Trânsito e Repouso** | Todos os dados trafegados entre a API da Claro e o API Gateway devem usar HTTPS (TLS 1.2+). Os dados armazenados no S3 e no Banco Relacional devem estar criptografados (ex: AWS KMS). | Crítica | Auditoria de segurança confirmando criptografia ativa nos buckets S3 e conexões SSL/TLS obrigatórias. |
| RNF-08 | **Isolamento de Rede** | Os componentes de processamento (Lambda e Banco de Dados) devem operar dentro de uma **VPC (Virtual Private Cloud)**, sem exposição pública direta dos bancos de dados. | Alta | Testes de penetração não devem conseguir acessar o banco de dados diretamente via IP público. |
| **Manutenibilidade** |
| RNF-09 | **Evolução de Schema** | O sistema deve suportar mudanças na estrutura dos dados enviados pela Claro (ex: adição de nova coluna) sem quebrar o pipeline histórico, utilizando as capacidades de *Schema Evolution* do Apache Iceberg. | Média | Adição de um campo novo no JSON de entrada deve ser refletida na tabela Iceberg sem necessidade de recriar toda a tabela. |

---

## 3. Justificativa Técnica da Arquitetura

A escolha dos requisitos acima visa sustentar a robustez necessária para uma aplicação de nível "Cidade Inteligente":

1.  **Uso de Fila (SQS):** Justifica o **RNF-03 (Elasticidade)** e **RNF-05 (Tolerância a Falhas)**. Em cenários de Smart City, eventos atípicos (grandes shows, manifestações) geram picos de dados anômalos. A fila protege o sistema de cair (Backpressure).
2.  **Apache Iceberg:** Justifica o **RNF-06 (Consistência)** e **RNF-09 (Evolução)**. Diferente de arquivos CSV soltos no S3, o Iceberg gerencia metadados, permitindo que o Data Lake funcione quase como um banco de dados robusto, essencial para não "quebrar" análises históricas quando o formato do dado muda.
3.  **AWS Lambda:** Justifica o **RNF-01 (Latência)**. Por ser *serverless*, elimina a necessidade de gerenciar servidores ociosos, otimizando custos e garantindo poder computacional imediato assim que os dados chegam.

**Referências**
- *Sommerville, I. (2011). Engenharia de Software. 9ª edição. Pearson.*
- *AWS Architecture Center. (2024). Serverless Data Processing Patterns.*
- *Apache Iceberg Documentation. (2024). High Performance Data Lake Tables.*