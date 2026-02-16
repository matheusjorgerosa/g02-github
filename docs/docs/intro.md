---
sidebar_position: 1
---

# Documentação

## 1. Introdução ao Projeto

**1.1 Contextualização do Problema**

&nbsp;&nbsp;&nbsp;&nbsp; A Eletromidia detém uma vasta quantidade de dados estáticos (em formato CSV) provenientes da Claro Geodata sobre o fluxo de pessoas na cidade de São Paulo. No entanto, a complexidade e o volume massivo dessas informações dificultam a interpretação e a extração de *insights* por parte dos clientes internos, tornando os dados subutilizados para decisões de negócios.

**1.2 Objetivos Gerais e Específicos**

&nbsp;&nbsp;&nbsp;&nbsp; O objetivo geral consiste no desenvolvimento de uma aplicação intuitiva para a visualização e análise de dados de fluxo populacional. 
Os objetivos específicos incluem:

*   Desenvolver mapas interativos, incluindo mapas de calor e representações em *hexbins*.
*   Implementar filtros por geolocalização, horários e perfis demográficos (idade, gênero e classe social).
*   Garantir que o sistema seja capaz de processar novas bases de dados para replicabilidade em outras cidades.
*   Prover uma interface amigável (UX) que dispense conhecimentos técnicos avançados para sua operação.

**1.3 Justificativa do Projeto**

&nbsp;&nbsp;&nbsp;&nbsp; A ferramenta permitirá que áreas como o time de precificação e vendas gerem análises mais precisas sobre o alcance de campanhas publicitárias. Além do impacto comercial, o projeto possui relevância social ao possibilitar estudos de mobilidade urbana que auxiliam no planejamento de cidades inteligentes e na redução da migração pendular, alinhando-se aos Objetivos de Desenvolvimento Sustentável (ODS) da ONU.

## 2. Planejamento Detalhado das Sprints

### **Sprint 1 – Concepção e Requisitos**

*   **Objetivo:** Definir as bases arquiteturais e os requisitos detalhados do sistema.
*   **Escopo e Funcionalidades:** Mapeamento de requisitos funcionais e não-funcionais.
*   **Atividades Planejadas:** Elaboração do esboço arquitetural e criação do protótipo de baixa fidelidade (*wireframes*).
*   **Entregáveis:** Documento de arquitetura inicial, lista de requisitos e protótipo de baixa fidelidade.

### **Sprint 2 – Prototipagem e Estrutura de Dados**

*   **Objetivo:** Evoluir a arquitetura e definir a interface visual de alta fidelidade.
*   **Escopo e Funcionalidades:** Refinamento do design e estruturação de filas de processamento de dados.
*   **Atividades Planejadas:** Desenvolvimento do protótipo de alta fidelidade e implementação de filas em memória.
*   **Entregáveis:** Protótipo interativo e módulo inicial de gestão de filas.

### **Sprint 3 – Desenvolvimento do Core e Visualização**

*   **Objetivo:** Implementar as funcionalidades centrais de visualização de dados.
*   **Escopo e Funcionalidades:** Dashboard funcional e lógica de processamento assíncrono.
*   **Atividades Planejadas:** Codificação do dashboard, implementação de lógica de mapas e testes unitários.
*   **Entregáveis:** Dashboard funcional com integração de dados e suíte de testes unitários.

### **Sprint 4 – Integração e Testes de Carga**

*   **Objetivo:** Integrar os componentes do sistema e validar o desempenho sob carga.
*   **Escopo e Funcionalidades:** Comunicação entre sistemas embarcados e o backend.
*   **Atividades Planejadas:** Realização de testes de carga com *payloads* customizados e simulação de falhas de sistema.
*   **Entregáveis:** Sistema integrado com relatórios de performance.

### **Sprint 5 – Refinamento e Deploy**

*   **Objetivo:** Finalização do produto e disponibilização em ambiente de produção.
*   **Escopo e Funcionalidades:** Ajustes finos de interface e encapsulamento da aplicação para nuvem.
*   **Atividades Planejadas:** Deploy em infraestrutura de nuvem comercial e ajustes finais baseados em testes.
*   **Entregáveis:** Aplicação completa em nuvem e documentação técnica final.
