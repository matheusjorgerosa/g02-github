---
Title: Atualização da Arquitetura
sidebar-position: 1
---

Ao longo do desenvolvimento do projeto, algumas alterações precisaram ser feitas na arquitetura para melhor atender aos requisitos do projeto. Desse modo, a principal alteração da arquitetura da primeira Sprint de desenvolvimento em relação à segunda Sprint foi a migração do provedor de nuvem utilizado: ao invés de utilizarmos a AWS, passamos a utilizar a Google Cloud Platform (GCP). Tal alteração se deu por alguns motivos. O primeiro deles é que a Eletromídia já utiliza os serviços da Google, o que agrega mais valor ao projeto por facilitar a integração com o sistema já existente. Ademais, outro ponto que influenciou essa decisão foi a disponibilidade de créditos na GCP, pois, ao criar uma conta, a plataforma libera trezentos dólares para desenvolvimento. Com a AWS, possuíamos cinquenta dólares provenientes do acesso de estudante, contudo haveria a derrubada constante dos serviços. Dessa forma, optamos pela GCP.

## Escolha dos serviços

A decisão de utilizar uma fila de mensagens em vez do Kafka se deve ao fato de que o projeto não requer streaming de dados nem processamento em tempo real. Uma fila simples atende satisfatoriamente ao volume e ao padrão de consumo esperados, sendo mais leve e de mais fácil manutenção para o caso de uso em questão. Em relação ao serviço de computação, optamos pelo Cloud Run em detrimento do App Engine e do Google Kubernetes Engine (GKE); dado que o Cloud Run oferece escalabilidade automática com cobrança por uso, sem a necessidade de gerenciar infraestrutura subjacente, o que o torna mais adequado do que o GKE, que exige configuração e manutenção de clusters. Em comparação ao App Engine, o Cloud Run oferece maior flexibilidade na conteinerização e no controle do ambiente de execução.

## Evolução da segunda para a terceira Sprint

Da segunda para a terceira Sprint, alguns serviços precisaram ser adicionados. Foi introduzido um novo serviço Cloud Run posicionado entre o API Gateway e a fila de mensagens, cuja responsabilidade é processar e encaminhar os dados recebidos para a fila. A adição desse serviço intermediário se justifica pela necessidade de desacoplar a camada de entrada de dados da camada de enfileiramento, permitindo que transformações, validações e enriquecimentos dos dados sejam realizados de forma isolada antes de sua inserção na fila. Além disso, a dashboard passou a consultar diretamente o BigQuery para obtenção dos dados analíticos; tal escolha se justifica pelo fato de o BigQuery ser um serviço de data warehouse otimizado para consultas sobre grandes volumes de dados, oferecendo alto desempenho e escalabilidade nativa para esse tipo de workload. A integração direta elimina camadas intermediárias desnecessárias entre a visualização e os dados consolidados, reduzindo a latência das consultas e simplificando a arquitetura. Por ser um serviço gerenciado pela GCP, o BigQuery também se integra naturalmente aos demais componentes da infraestrutura adotada, garantindo consistência operacional.

Vale destacar que, conforme descrito na arquitetura da segunda Sprint, toda a arquitetura foi projetada para suportar um alto volume de carga, garantindo que as adições realizadas na terceira Sprint se integrem de forma consistente com os requisitos de escalabilidade já estabelecidos. 

## Diagramas de Arquitetura

Conforme explicado nas sprints anteriores, a arquitetura foi dividida em duas parte a fim de facilitar a organização do desenvolvimento e separar claramente as responsabilidades de cada parte. As duas partes são:

* Ingestão de Dados e Armazenamento
* tilização da Aplicação (Frontend/Backend - Dashboard)

### 1.2 Diagrama da Arquitetura de Ingestão de Dados e Armazenamento

Este diagrama representa o fluxo de ingestão, processamento e armazenamento dos dados provenientes de duas fontes externas distintas: a **API da Claro** (dados em lote) e os **Sensores IoT** (dados em tempo real). Toda a infraestrutura está contida dentro de uma **VPC Network** na GCP, garantindo isolamento e segurança de rede.

```mermaid
graph TB
    %% Atores externos
    CLARO["🌐 API Claro<br/><br/>Fonte de dados<br/>externos"]:::external
    SENSORS["📡 Sensores<br/><br/>Dispositivos IoT<br/>em campo"]:::external

    subgraph VPC["VPC Network"]
        direction TB
        SCHEDULER["Cloud Scheduler<br/>+ Cloud Run Job<br/><br/>Realiza<br/>HTTP GET na API Claro<br/>e recebe os dados"]:::gcpBlue
        API["Cloud Endpoints<br/>+ Load Balancer<br/><br/>Recebe dados dos sensores<br/>e encaminha para Pub/Sub"]:::gcpBlue
        PUBSUB_CLARO["Cloud Pub/Sub<br/>(tópico: claro-batch)<br/><br/>Mensageria assíncrona<br/>dados Claro"]:::gcpBlue
        PUBSUB_SENSOR["Cloud Pub/Sub<br/>(tópico: sensores)<br/><br/>Mensageria assíncrona<br/>dados sensores"]:::gcpBlue
        FUNCTIONS_CLARO["⚡ Cloud Functions<br/>2ª Geração<br/><br/>Processa dados Claro<br/>e armazena no datalake RAW"]:::gcpBlue
        FUNCTIONS_SENSOR["⚡ Cloud Functions<br/>2ª Geração<br/><br/>Processa dados dos sensores<br/>e armazena no BigQuery Trusted"]:::gcpBlue

        subgraph GCS_LAYER["Cloud Storage"]
            direction TB
            GCS["☁️ GCS Bucket"]:::gcpGreen
            subgraph DATALAKE["Datalake - Camada RAW"]
                direction LR
                ICEBERG["Apache Iceberg<br/>via BigLake<br/><br/>Dados não processados"]:::iceberg
                TABLE["Tabela<br/>┌──────────┬────────┐<br/>│ PK, FK1  │ Row 1  │<br/>│ PK, FK2  │ Row 2  │<br/>│          │ Row 3  │<br/>│          │ Row 4  │<br/>└──────────┴────────┘"]:::iceberg
            end
        end

        WORKER["Dataflow<br/>ou Cloud Run Jobs<br/><br/>Processa dados do lake<br/>periodicamente e faz<br/>ingestão para BigQuery DW"]:::worker
    end

    subgraph BQ_LAYER["BigQuery"]
        direction TB
        BQ_TRUSTED[("BigQuery<br/>Camada TRUSTED<br/><br/>Dados dos sensores<br/>estruturados e validados")]:::gcpBlue
        BQ_DW[("BigQuery<br/>Camada DW / Analytics<br/><br/>Dados Claro processados<br/>+ queries sobre Iceberg")]:::gcpBlue
    end

    %% Fluxos - Claro
    CLARO -->|"Disponibiliza<br/>dados via HTTP"| SCHEDULER
    SCHEDULER -->|"HTTP GET periódico<br/>← resposta: batch de dados"| CLARO
    SCHEDULER -->|"Publica<br/>mensagens"| PUBSUB_CLARO
    PUBSUB_CLARO -->|"Push via<br/>Eventarc"| FUNCTIONS_CLARO
    FUNCTIONS_CLARO -->|"Grava dados<br/>brutos (RAW)"| GCS
    FUNCTIONS_CLARO -->|"Grava dados<br/>no DW"| BQ_DW
    GCS -.-> DATALAKE
    DATALAKE -.->|"Leitura<br/>periódica"| WORKER
    DATALAKE -.->|"Query SQL<br/>direto"| BQ_DW
    WORKER -->|"ETL e<br/>ingestão"| BQ_DW

    %% Fluxos - Sensores
    SENSORS -->|"HTTP POST<br/>dados em tempo real"| API
    API -->|"Publica<br/>mensagens"| PUBSUB_SENSOR
    PUBSUB_SENSOR -->|"Push via<br/>Eventarc"| FUNCTIONS_SENSOR
    FUNCTIONS_SENSOR -->|"Grava dados<br/>validados (TRUSTED)"| BQ_TRUSTED
    FUNCTIONS_SENSOR -->|"Grava dados<br/>no DW"| BQ_DW

    %% Estilos
    classDef gcpBlue fill:#4285F4,stroke:#1a73e8,stroke-width:2px,color:#fff
    classDef gcpGreen fill:#34A853,stroke:#1e8e3e,stroke-width:2px,color:#fff
    classDef iceberg fill:#00BCD4,stroke:#0097A7,stroke-width:2px,color:#fff
    classDef worker fill:#FF6D00,stroke:#e65100,stroke-width:2px,color:#fff
    classDef external fill:#202124,stroke:#4285F4,stroke-width:3px,color:#fff

    style VPC fill:#E8F4FC,stroke:#4285F4,stroke-width:4px,stroke-dasharray: 5 5
    style GCS_LAYER fill:#E6F4EA,stroke:#34A853,stroke-width:3px
    style DATALAKE fill:#E6F7FF,stroke:#00C7D4,stroke-width:3px
    style BQ_LAYER fill:#E8F0FE,stroke:#4285F4,stroke-width:3px
```

#### Fluxo de dados dos Sensores IoT (tempo real)

1. Os sensores enviam dados via HTTP POST para um Cloud Endpoints + Load Balancer, que atua como ponto de entrada seguro e escalável.
2. As mensagens são publicadas no tópico Cloud Pub/Sub `sensores`.
3. Uma Cloud Function dedicada é acionada via Eventarc, processando e validando os dados dos sensores.
4. Os dados validados são gravados na camada TRUSTED do BigQuery**, além de também alimentarem a camada Analytics para consolidação.

#### Camadas de armazenamento

| Camada | Tecnologia | Finalidade |
|---|---|---|
| RAW | GCS + Apache Iceberg (BigLake) | Armazenamento bruto, imutável e auditável |
| TRUSTED | BigQuery | Dados de sensores validados e estruturados |
| Analytics | BigQuery | Dados consolidados e prontos para análise |


### 2.2 Diagrama da Arquitetura da Aplicação

Este diagrama representa a arquitetura voltada à utilização da plataforma pelos usuários, abrangendo o fluxo de acesso ao frontend (Dashboard), o acesso aod dados no BigQuery e o processo de ETL que alimenta o Data Warehouse.

```mermaid
graph TB
    subgraph "DNS & CDN"
        DNS[Cloud DNS<br/>DNS Global]
        CDN[Cloud CDN<br/>CDN Global]
    end
    subgraph "Usuários"
        USER[Usuários]
    end
    GCS[(Cloud Storage<br/>Bucket de Dados)]
    SCHEDULER[Cloud Scheduler<br/>Execução Periódica]
    DATAFLOW[Cloud Run Jobs<br/>ETL Process<br/>Processa dados do GCS]
    BIGQUERY[(BigQuery<br/>Data Warehouse<br/>Dados Analíticos)]
    subgraph "VPC Network - Rede Privada"
        GLB[Cloud Load<br/>Balancer<br/>Global HTTP/S]
        APIGATEWAY[API Gateway]
        QUEUE[Cloud Pub/Sub<br/>Fila de Mensagens]
        subgraph "Cloud Run - Ingestão"
            CR_INGEST[Cloud Run<br/>Serviço Intermediário<br/>Processamento e Enfileiramento]
        end
        subgraph "Cloud Run - Backend"
            CR_B1[Cloud Run<br/>API REST]
            CR_B2[Cloud Run<br/>API REST]
        end
        subgraph "Cloud Run - Frontend"
            CR_F1[Cloud Run<br/>Dashboard]
            CR_F2[Cloud Run<br/>Dashboard]
        end
    end
    %% Fluxo de dados ETL
    GCS -->|Novos arquivos| SCHEDULER
    SCHEDULER -->|Trigger periódico| DATAFLOW
    DATAFLOW -->|Lê dados| GCS
    DATAFLOW -->|Consolida dados| BIGQUERY
    %% Fluxo de usuário
    USER -->|Acessa| DNS
    DNS -->|Resolve DNS| CDN
    CDN -->|Cache estático| CR_F1
    CDN -->|Cache estático| CR_F2
    %% Fluxo de requisições
    USER -->|Requisições| GLB
    GLB -->|Roteia| APIGATEWAY
    APIGATEWAY -->|Encaminha| CR_B1
    APIGATEWAY -->|Encaminha| CR_B2
    APIGATEWAY -->|Encaminha dados| CR_INGEST
    CR_INGEST -->|Enfileira dados| QUEUE
    CR_B1 -->|Consulta dados| BIGQUERY
    CR_B2 -->|Consulta dados| BIGQUERY
    CR_F1 -->|Chama API| GLB
    CR_F2 -->|Chama API| GLB
    CR_F1 -->|Consulta direta| BIGQUERY
    CR_F2 -->|Consulta direta| BIGQUERY
    QUEUE -->|Consome mensagens| CR_B1
    QUEUE -->|Consome mensagens| CR_B2
    %% Estilos GCP
    classDef storage fill:#34A853,stroke:#1e8e3e,stroke-width:2px,color:#fff
    classDef compute fill:#4285F4,stroke:#1a73e8,stroke-width:2px,color:#fff
    classDef network fill:#9334E6,stroke:#7627bb,stroke-width:2px,color:#fff
    classDef cdn fill:#EA4335,stroke:#c5221f,stroke-width:2px,color:#fff
    classDef user fill:#202124,stroke:#4285F4,stroke-width:3px,color:#fff
    classDef queue fill:#FF6D00,stroke:#e65100,stroke-width:2px,color:#fff
    classDef warehouse fill:#00897B,stroke:#00695C,stroke-width:2px,color:#fff
    class GCS storage
    class DATAFLOW,CR_B1,CR_B2,CR_F1,CR_F2,CR_INGEST compute
    class GLB,SCHEDULER,APIGATEWAY network
    class CDN,DNS cdn
    class USER user
    class QUEUE queue
    class BIGQUERY warehouse
```

#### Fluxo de acesso do usuário ao frontend

1. O usuário acessa a aplicação via Cloud DNS, que resolve o domínio e redireciona para o Cloud CDN.
2. O CDN entrega os assets estáticos com cache, reduzindo latência e carga nos servidores.
3. As instâncias de Cloud Run (Dashboard) servem a interface da aplicação e realizam consulta direta ao BigQuery para obtenção dos dados analíticos, eliminando camadas intermediárias desnecessárias.

#### Fluxo de ETL

1. Novos arquivos gravados no Cloud Storage acionam o Cloud Scheduler.
2. O Scheduler dispara periodicamente um job de Cloud Run (ETL Process), que lê os dados do GCS, consolida e carrega no BigQuery Data Warehouse.
3. A dashoboar consulta o BigQuery para servir dados atualizados ao frontend.

