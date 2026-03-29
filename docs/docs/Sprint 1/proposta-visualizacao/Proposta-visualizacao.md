---
title: Proposta de Visualização
---

import useBaseUrl from '@docusaurus/useBaseUrl';

&emsp;Este documento apresenta o wireframe do dashboard web para visualização de dados. A solução foi projetada para usuários não técnicos da área de negócios, priorizando clareza visual, navegação intuitiva e suporte à geração de insights.

&emsp;A interface está estruturada em três telas principais:

1. Exploração geográfica dos dados  
2. Visão consolidada com indicadores  
3. Análises temporais e demográficas  

---

## Tela 1 - Exploração Geográfica

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 1 - Proposta de Visualização Geográfica</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe1.jpeg')} 
    alt="Exploração Geográfica" 
    title="Exploração Geográfica" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;Esta tela tem como objetivo permitir a exploração espacial dos pontos de coleta de dados, possibilitando a identificação de padrões geográficos e consulta de informações associadas a cada local.

### Componentes

- **Seleção de localização**  
  Campo superior que permite definir a área de interesse por meio de um *dropdown* de regiões ou interação direta com o mapa.

- **Mapa com pontos (scatter map)**  
  Visualização central onde cada ponto representa um `location_id`.  
  Interações disponíveis:
  - **Hover**: exibe informações resumidas (ex: volume de pessoas)
  - **Clique**: detalha dados demográficos agregados do ponto selecionado

---

## Tela 2 - Visão Consolidada e Mapa de Calor

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 2 - Proposta de Visualização com Heatmap</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe2.jpeg')} 
    alt="Mapa de Calor" 
    title="Mapa de Calor" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;Esta tela fornece uma visão agregada dos dados, permitindo análise rápida por meio de indicadores-chave e distribuição espacial da intensidade de fluxo.

### Componentes

- **Filtros globais**  
  Permitem refinar a visualização com base em:
  - Período
  - Intervalo de horário
  - Segmentação demográfica
  - Região

- **Indicadores (KPI Cards)**  
  Apresentam métricas resumidas:
  - Total de pessoas
  - Pico de fluxo
  - Local mais movimentado

- **Mapa de calor (heatmap)**  
  Representa a intensidade de fluxo de pessoas de forma agregada, variando conforme os filtros aplicados.

---

## Tela 3 - Análises Temporais e Demográficas

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 3 - Proposta de Visualização Analítica</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe3.jpeg')} 
    alt="Análises e Comparações" 
    title="Análises e Comparações" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;Esta tela permite análises mais profundas, com foco em padrões temporais e perfil demográfico dos usuários.

### Componentes

- **Gráfico de Tempo × Fluxo**  
  Exibe a variação do volume de pessoas ao longo do tempo, conforme o período selecionado.

- **Gráficos demográficos**  
  Distribuições segmentadas por:
  - Idade
  - Gênero
  - Classe social

- **Gráfico de comparação**  
  Permite ao usuário comparar diferentes dimensões, como:
  - Regiões
  - Períodos
  - Perfis demográficos