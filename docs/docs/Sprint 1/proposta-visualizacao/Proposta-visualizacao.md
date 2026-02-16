---
title: Proposta de Visualização
---

import useBaseUrl from '@docusaurus/useBaseUrl';

&emsp;	Este documento descreve o wireframe proposto para o dashboard web de visualização dos dados. A solução foi projetada para usuários não técnicos da área de negócios, priorizando clareza visual, exploração intuitiva e geração de insights.

&emsp;	A interface está organizada em três telas principais:

1. Exploração espacial dos dados
2. Visão consolidada e indicadores
3. Análises temporais e demográficas

## Tela 1 — Exploração Geográfica

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 1 - Proposta de Visulização de Exploração Geográgica</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe1.jpeg')} 
    alt="Exploração Geográgica" 
    title="Exploração Geográgica" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;	O objetivo é permitir que o usuário visualize os pontos de coleta de dados no mapa e consulte informações associadas a cada local. Desse modo, os componentes dessa tela são:

* Seleção de Localização: Campo superior para definir área/região de interesse com *dropdown* de regiões e navegação direta no mapa.

* Mapa com Pontos: Visualização central da tela, onde cada ponto representa um `location_id`. Como interação, hover ou clique mostra a quantidade de pessoas e dados demográficos agregados.


## Tela 2 — Mapa de Calor

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 2 - Proposta de Visulização de Mapa de Calor</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe2.jpeg')} 
    alt="Proposta de Visulização de Mapa de Calor" 
    title="Proposta de Visulização de Mapa de Calor" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;	O objetivo é oferecer uma visão resumida com métricas-chave e distribuição espacial agregada. Os componentes são:

* Filtros: Período, horário, segmentação demográfica e região.

* Indicadores (KPI Cards): total de pessoas, pico de fluxo e local mais movimentado

* Heatmap: Visualização principal que representa intensidade de fluxo relacionada aos filtros selecionados.

## Tela 3 — Gráficos para Análises e Comparações

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 3 - Proposta de Visulização de Gráficos para Análises e Comparações</strong></p>
  <img 
    src={useBaseUrl('/img/wireframe3.jpeg')} 
    alt="Proposta de Visulização de Gráficos para Análises e Comparações" 
    title="Proposta de Visulização de Gráficos para Análises e Comparações" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

&emsp;	O objetivo é permitir exploração analítica mais profunda sobre padrões temporais e perfil do público. Como componentes, possui:

* Gráfico Tempo × Fluxo: O usuário define período e o gráfico exibe a variação de movimentação ao longo do tempo.

* Gráficos Demográficos: Distribuições por idade, gênero e classe social.

* Gráfico de Comparação: O usuário seleciona dimensões para comparação como regiões, períodos e perfis.