---
title: Arquitetura da Aplicação - Visão geral
sidebar_position: 1
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Arquitetura da Aplicação - Versão GCP

:::info
Esta é a versão 2 da arquitetura da aplicação, migrada para Google Cloud Platform (GCP). Esta versão representa uma evolução da arquitetura original AWS, mantendo os mesmos princípios de escalabilidade e alta disponibilidade, com otimizações específicas do ecossistema Google Cloud.
:::

## 1. Visão Geral do Sistema

O projeto consiste no desenvolvimento de uma aplicação web para análise de dados de mídia exterior (OOH - Out of Home) para a Eletromidia. No contexto real, a empresa recebe um arquivo CSV a cada 3 meses contendo dados consolidados. No entanto, para este projeto acadêmico, estamos simulando um cenário de API em tempo real que envia requisições HTTP com lotes de dados várias vezes por segundo/minuto, permitindo o estudo e desenvolvimento de uma aplicação intensiva de dados com alta volumetria.

A arquitetura foi dividida em dois momentos principais:

1. Ingestão de Dados e Armazenamento (Data Lake e Data Warehouse)
2. Utilização da Aplicação (Frontend/Backend - Dashboard)

Esta divisão permite uma separação clara de responsabilidades, escalabilidade independente de cada componente e otimização específica para diferentes tipos de carga de trabalho.

```mermaid
graph TB
    USR[👤 Usuário]
    EXT[Sistemas de Coleta de Dados]
    ARM[Armazenamento]
    PRO[Processamento]
    DASH[Dashboard]

    %% Fluxo de dados
    EXT -->|Envia dados brutos| ARM
    ARM -->|Dados armazenados| PRO
    PRO -->|Processa e transforma| ARM
    ARM -->|Dados processados| DASH
    USR -->|Solicita dados por meio de filtros| DASH
    DASH -->|Mapas e gráficos| USR

    %% Estilos
    classDef system fill:#4285F4,stroke:#1a73e8,stroke-width:3px,color:#fff
    classDef external fill:#EA4335,stroke:#c5221f,stroke-width:2px,color:#fff
    classDef users fill:#202124,stroke:#4285F4,stroke-width:2px,color:#fff
    classDef infra fill:#34A853,stroke:#1e8e3e,stroke-width:2px,color:#fff

    class DASH system
    class EXT external
    class USR users
    class ARM,PRO infra

```

---

## 2. Migração de AWS para GCP

:::tip Por que migrar para GCP?
A decisão de migrar para Google Cloud Platform foi baseada na atual stack tecnológica do parceiro de projeto, Eletromídia. Dessa forma, a fins de aprendizado e compatibilidade com o parceiro, alteramos a arquitetura para sua segunda versão, utilizando o ambiente Google Cloud Platform. Esta seção documenta as principais motivações e trade-offs envolvidos.
:::
