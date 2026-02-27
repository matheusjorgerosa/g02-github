# Documentação Técnica e Estratégica: Análise de Dados de Fluxo de Pessoas

## 1. Contexto do Projeto e Visão Geral

A Eletromidia, empresa brasileira líder no segmento de mídia *out-of-home* (OOH), possui acesso a uma quantidade massiva de dados referentes ao fluxo diário de pessoas na cidade de São Paulo em vários horários. Estes dados, fornecidos pela Claro Geodata, são de imenso valor estratégico. Contudo, devido à sua volumetria e complexidade, a visualização e interpretação em formato bruto (CSV) não são triviais para a maior parte dos clientes internos (principalmente da área de Negócios e Growth).

**Objetivo Central:** Desenvolver uma aplicação web interativa, performática e *user-friendly* que consolide esse Big Data geoespacial em um mapa 3D intuitivo, permitindo a geração de *insights* rápidos através de filtros demográficos e processamento sob demanda (*on-the-fly*).

---

## 2. Estrutura e Origem dos Dados

A base do mapeamento é um arquivo CSV estático, atualizado periodicamente, contendo milhões de registros geolocalizados. Cada registro possui a seguinte estrutura de colunas essenciais:

*   **`location_id`**: Chave única identificadora do local geográfico.
*   **`impression_hour`**: Horário da leitura do fluxo.
*   **`uniques`**: A volumetria absoluta, ou seja, a quantidade de pessoas únicas que passaram por aquele local específico em um determinado horário.
*   **`latitude` / `longitude`**: Coordenadas espaciais do ponto de fluxo.
*   **`target`**: Um objeto JSON (armazenado como string) que detalha a proporção demográfica dessas pessoas únicas dividida nas seguintes subcategorias:
    *   **Idade**: '18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'
    *   **Gênero**: 'F' (Feminino), 'M' (Masculino)
    *   **Classe Social**: 'A', 'B1', 'B2', 'C1', 'C2', 'DE'

*Observação: Por questões de conformidade e cláusulas contratuais com a fornecedora (Claro Geodata), estes dados brutos constituem Conteúdo Restrito e não podem ser expostos diretamente.*

---

## 3. Lógica de Processamento e Visualização 3D

Para resolver o desafio de exibir um número massivo de pontos sem sobrecarregar a interface, a aplicação utiliza a biblioteca **`deck.gl`** em conjunto com **React**. A abordagem visual escolhida foi a **`HexagonLayer`** (Mapa de Calor Hexagonal 3D).

### 3.1. Cruzamento Demográfico Interativo

A grande inovação da ferramenta não é apenas plotar os pontos no mapa, mas permitir que o usuário refine o público exibido baseando-se no cruzamento de dados demográficos presentes na coluna `target`.

Quando um usuário aplica filtros no painel lateral, o sistema recalcula em tempo real a volumetria ponderada de cada local. A lógica de interseção é a seguinte:

1.  **Agregação de Percentuais:** O algoritmo soma as porcentagens de todas as opções ativas dentro de uma categoria (ex: se o usuário seleciona gêneros 'F' e 'M', e a área tem 55% 'F' e 45% 'M', a soma será 1.0).
2.  **Cálculo do Multiplicador Probabilístico:** O sistema calcula a interseção multiplicando as taxas agregadas de cada dimensão.
    $$ Multiplicador = (\sum Porcentagens_{Idades}) 	\times (\sum Porcentagens_{Generos}) 	\times (\sum Porcentagens_{Classes}) $$
3.  **Volumetria Final (Display Value):** O total de visitantes únicos (`uniques`) é então multiplicado por esse fator.
    $$ Valor Exibido = Uniques 	\times Multiplicador $$

### 3.2. Renderização Hexagonal

Os pontos geográficos, agora com seus valores ponderados, são agrupados em células hexagonais (com raio de 200 metros). 
A agregação ocorre por **SOMA**, significando que se vários pontos de coleta existirem no mesmo polígono hexagonal, o fluxo deles é somado. 
O resultado final determina a **elevação (altura em 3D)** e a **cor** do hexágono, criando "picos de calor" imediatos nas áreas onde a concentração do público-alvo filtrado é maior.

---

## 4. Benefícios e Importância Estratégica (Stakeholders)

A criação deste visualizador é um produto capaz de revolucionar as frentes de negócios da Eletromidia:

*   **Clientes da Eletromidia:** Possibilita que os anunciantes tenham dados de impactos e alcance muito mais precisos. Em vez de comprar painéis "no escuro", o cliente pode identificar exatamente os bairros e ruas onde o seu consumidor-alvo (ex: Mulheres, 20-39 anos, Classe AB) está transitando.
*   **Time de Precificação (Pricing):** Com uma visão granular do valor demográfico de cada face publicitária, a equipe pode realizar precificação dinâmica e otimizada. Um painel em uma área de altíssimo fluxo de uma demografia premium pode ter seu valor readequado com embasamento de dados.
*   **Expansão e Inteligência de Mercado:** Ajuda as áreas internas a tomarem decisões de aquisição de novos ativos físicos em regiões onde há alto fluxo de pessoas, mas ainda pouca cobertura da Eletromidia, maximizando o ROI.

---

## 5. Alinhamento com Cidades Inteligentes e ODS (Agenda 2030 ONU)

Para além do impacto empresarial, os dados de mobilidade revelados por essa aplicação possuem imenso valor público e socioambiental, alinhando-se com os Objetivos de Desenvolvimento Sustentável (ODS):

*   **Dimensão 1: Pessoas (ODS 1, 2, 3) - Saúde e Bem-estar:**
    Estudos públicos de mobilidade urbana podem usar recortes desses fluxos para compreender gargalos de trânsito, melhorar frotas de transporte e, consequentemente, reduzir o estresse urbano e melhorar a qualidade de vida.
*   **Dimensão 3: Prosperidade (ODS 8, 10, 7, 11) - Cidades Sustentáveis:**
    O mapa provê inteligência para o planejamento urbano. Ao revelar grandes migrações pendulares, o poder público pode direcionar investimentos para descentralizar serviços, reduzindo deslocamentos excessivos e o consequente gasto energético e emissão de poluentes ligados ao transporte de massa.
*   **Dimensão 5: Parcerias (ODS 9, 17):**
    Representa o avanço das parcerias público-privadas. Empresas de tecnologia/mídia investindo em inteligência de dados que posteriormente pode retroalimentar políticas públicas voltadas ao desenho de verdadeiras *Smart Cities* (Cidades Inteligentes).

---