---
title: Visão Geral do Sistema
sidebar_position: 2
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Arquitetura da Aplicação - Primeira Versão

:::info
Esta é a **primeira versão** da arquitetura da aplicação e está **sujeita a mudanças** conforme o projeto evolui e novos requisitos são identificados durante o desenvolvimento.
:::

## 1. Visão Geral do Sistema

O projeto consiste no desenvolvimento de uma aplicação web para análise de dados de mídia exterior (OOH - Out of Home) para a Eletromidia. No contexto real, a empresa recebe um arquivo CSV a cada 3 meses contendo dados consolidados. No entanto, para este projeto acadêmico, **estamos simulando um cenário de API em tempo real** que envia requisições HTTP com lotes de dados várias vezes por segundo/minuto, permitindo o estudo e desenvolvimento de uma **aplicação intensiva de dados com alta volumetria**.

A arquitetura foi dividida em **dois momentos principais**:

1. **Ingestão de Dados e Armazenamento** (Data Lake e Data Warehouse)
2. **Utilização da Aplicação** (Frontend/Backend - Dashboard)

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
    classDef system fill:#FF9900,stroke:#232F3E,stroke-width:3px,color:#fff
    classDef external fill:#00A4A6,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef users fill:#232F3E,stroke:#FF9900,stroke-width:2px,color:#fff
    classDef infra fill:#3B48CC,stroke:#232F3E,stroke-width:2px,color:#fff
    
    class DASH system
    class EXT external
    class USR users
    class ARM,PRO infra

```
