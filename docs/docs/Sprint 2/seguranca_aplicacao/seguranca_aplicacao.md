---
title: Segurança da Aplicação
sidebar_position: 2
---

## 1. Introdução
&emsp; Esta sessão detalha as medidas de segurança, protocolos e controles que serão implementados para proteger a integridade, confidencialidade e disponibilidade do sistema de análise de fluxo de pessoas. O objetivo é estabelecer uma defesa em profundidade, garantindo que os dados de geolocalização e demografia da Claro sejam processados sem riscos de exfiltração, interceptação ou acesso não autorizado.

&emsp; A estratégia baseia-se no modelo de Responsabilidade Compartilhada, onde utilizamos os recursos nativos de segurança da Google Cloud Platform (GCP) integrados a políticas de acesso rigorosas baseadas em perfis.

---

## 2. Segurança da Arquitetura de Ingestão
&emsp; A ingestão de dados lida com o volume massivo vindo da API externa (Claro) e sua persistência no Data Lake. As defesas planejadas neste documento focam no OWASP API Security Top 10.

### 2.1 Proteção contra Broken Object Level Authorization
**Identidade do Serviço:** Cada componente (Cloud Functions, Dataflow) operará sob uma Service Account dedicada com permissões mínimas,como escrever no bucket de camada RAW, mas sem permissão para ler ou apagar dados existentes. Isso impede que uma falha em um serviço comprometa todo o Data Lake.

**Isolamento via IAM:**  O processo de ingestão terá permissão apenas para escrita no bucket RAW do Cloud Storage, sem capacidade de leitura ou deletar os dados.

**Autenticação de API:** O Cloud Endpoints valida tokens JWT assinados ou chaves de API para garantir que apenas a origem autorizada, a API da claro e os Mocks desenvolvidos para este projeto, enviem dados.


### 2.2 Prevenção de Unrestricted Resource Consumption 
**Rate Limiting no Cloud Endpoints:** Configuração de quotas e limites de requisições por segundo para prevenir ataques de negação de serviço (DoS) que possam inflar custos ou derrubar o sistema.

**Cloud Armor (WAF):** Implementação de regras de filtragem de IP (Allowlist) para permitir apenas o tráfego originado dos endereços IP conhecidos da Claro para evitar ataques de negação de serviço.

## 2.3 Integridade e Segredos

**Criptografia TLS 1.2+**: Uso obrigatório de HTTPS para o GET e o POST na API da Claro e comunicação interna entre os serviços GCP.

**Secret Management:** Armazenamento de chaves de API e certificados no Secret Manager, protegidos por chaves criptográficas gerenciadas no Cloud KMS.

**Consistência de Dados:** Uso do Apache Iceberg para garantir transações ACID, impedindo que falhas técnicas corrompam os arquivos no Storage.

---

## 3. Segurança da Aplicação Web (Dashboard)
&emsp; A segurança da interface foca na proteção da identidade dos usuários (analistas) e na integridade das consultas analíticas, baseando-se no OWASP Top 10 Web.

### 3.1 Gestão de Sessão e Acesso
**Autenticação Centralizada:** Uso do Identity Platform (GCP) com suporte a Multi-Factor Authentication (MFA) e tokens JWT para validar sessões de usuários.

**Controle de Acesso Baseado em Perfis:** 
- `Usuários Comuns:` Acesso restrito a visualizações de mapas e métricas agregadas.

- `Administradores:` Permissões estendidas para auditoria, gestão de logs e controle de usuários.

**Gateway Authentication:** Validação de tokens JWT diretamente no Load Balancer/Cloud Endpoints, impedindo que requisições não autorizadas alcancem o backend (Cloud Run).

### 3.2 Isolamento de Rede e Proteção de Dados
**VPC Service Controls:** Criação de um perímetro de rede que isola o Banco de Dados e o Data Lake, impedindo que vulnerabilidades na aplicação web sejam usadas para exfiltração de dados para fora da organização.

**Sanitização de Entradas:** Uso de consultas parametrizadas e ORM no backend para evitar SQL Injection no Cloud SQL.

### 3.3 Auditoria e Observabilidade
**Logging de Dados Sensíveis:** Registro de todas as consultas feitas ao BigQuery/Iceberg que envolvam filtros demográficos (classe social, gênero), garantindo conformidade com a LGPD.

**Monitoramento de Anomalias:** Uso do Cloud Monitoring para alertar comportamentos suspeitos, como picos de download de dados ou acessos em horários não usuais.

---

## Referências


OWASP FOUNDATION. OWASP API Security Top 10. 2023. Disponível em: https://owasp.org/API-Security/editions/2023/en/0x11-t10/.

OWASP FOUNDATION. OWASP Top 10:2025. The Ten Most Critical Web Application Security Risks. 2021. Disponível em: https://owasp.org/Top10/2025/.