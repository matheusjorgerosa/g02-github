---
sidebar_position: 2
---

# Refatoração e Evolução do Frontend VENUS

## 1. Contexto e Motivação da Refatoração

Ao longo do desenvolvimento da Sprint 3, o frontend do Dashboard VENUS passou por uma refatoração estrutural completa. O código original era composto por um único arquivo monolítico — praticamente toda a lógica, UI e estado da aplicação residiam dentro de um `App.jsx` extenso e de difícil manutenção.

Os principais problemas que motivaram a refatoração foram:

- **Acoplamento excessivo:** qualquer alteração em um gráfico, no mapa ou nos filtros exigia navegar por centenas de linhas de código sem separação clara de responsabilidades.
- **Ausência de acessibilidade:** a versão anterior não possuía atributos ARIA, navegação por teclado nem suporte a tecnologias assistivas.
- **Falta de personalização:** não havia suporte a temas (dark mode, alto contraste) nem opções de ajuste tipográfico.
- **Escalabilidade:** adicionar novas páginas (ex: tela de Campanhas) ao monólito seria custoso e propenso a regressões.

A refatoração adotou a **separação por componentes responsáveis**, onde cada arquivo cuida exclusivamente de uma fatia da interface, e um `App.jsx` enxuto atua como orquestrador de estado.

---

## 2. Arquitetura de Componentes

Após a refatoração, o projeto `sp-density-map` passou a ter a seguinte estrutura:

```
src/
├── App.jsx               ← Orquestrador de estado global
├── constants.js          ← Traduções, configurações padrão e paletas de cor
├── Dashboard.css         ← Estilos globais com suporte a temas
└── components/
    ├── Icons.jsx         ← Biblioteca de ícones SVG acessíveis
    ├── Sidebar.jsx       ← Barra de navegação lateral
    ├── MapView.jsx       ← Mapa 3D hexagonal (deck.gl)
    ├── StatsGrid.jsx     ← Painel de gráficos e estatísticas
    ├── FilterPanel.jsx   ← Filtros demográficos de público
    ├── SettingsPanel.jsx ← Painel de acessibilidade e personalização
    └── CampaignsPage.jsx ← Tela de listagem e criação de campanhas
```

---

## 3. Descrição de Cada Componente

### 3.1. `constants.js` — Configurações e Traduções

Centraliza todas as constantes da aplicação, eliminando strings espalhadas pelo código:

- **`T`**: objeto de internacionalização com todas as chaves de texto em Português (`pt`) e Inglês (`en`).
- **`DEFAULT_SETTINGS`**: valores padrão de acessibilidade (ex: `darkMode: false`, `fontSize: 'large'`, `fontFamily: 'inter'`).
- **`COLOR_RANGES`** e **`CHART_COLORS`**: paletas adaptadas para quatro modos visuais — padrão, deuteranopia, protanopia e tritanopia.
- **`FILTER_CONFIG`** e **`INITIAL_FILTERS`**: definição das opções e estado inicial dos filtros demográficos.
- **`INITIAL_VIEW_STATE`**: posição inicial do mapa centrada em São Paulo.
- **Helpers** `formatNumber` e `renderPieLabel`: funções utilitárias reutilizadas nos gráficos.

---

### 3.2. `App.jsx` — Orquestrador de Estado Global

Responsável por:

- Gerenciar o **estado global** da aplicação: aba ativa, dados carregados, filtros, estado do mapa e configurações de acessibilidade.
- **Persistir preferências** em cookie (`venus-settings`) com validade de 1 ano, para que as configurações do usuário sobrevivam a recarregamentos de página.
- **Aplicar temas** via atributos no elemento `<html>`: `data-theme`, `data-colorblind`, `data-font-size`, `data-font-family`, `data-high-contrast` e a classe `reduced-motion`. O CSS reage a esses atributos para aplicar as transformações visuais corretas sem `JavaScript` extra.
- **Carregar e processar o CSV** de dados geoespaciais via `PapaParse`, realizando o cruzamento demográfico com `useMemo` para evitar recalculos desnecessários.
- **Renderizar** o componente correto conforme a aba selecionada (`dashboard`, `campaigns`, `settings`).

---

### 3.3. `Icons.jsx` — Biblioteca de Ícones SVG

Componente que exporta um objeto `Icons` com todos os ícones SVG utilizados na aplicação (Dashboard, Campaign, Settings, Logout, Expand, Minimize, Map2D, Map3D, Check, Globe, Eye, Contrast, Type, Font, Zap).

Todos os ícones possuem `aria-hidden="true"` e `focusable="false"`, garantindo que leitores de tela ignorem os elementos decorativos e utilizem apenas os `aria-label` dos botões que os contêm.

---

### 3.4. `Sidebar.jsx` — Navegação Principal

Barra lateral fixa que exibe o logo VENUS e os botões de navegação entre as abas da aplicação.

**Destaques de acessibilidade:**
- Elemento `<aside>` com `role="navigation"` e `aria-label` descritivo.
- Cada botão de navegação possui `aria-label` com descrição de destino e `aria-current="page"` quando a aba está ativa, permitindo que leitores de tela anunciem a página atual.

---

### 3.5. `MapView.jsx` — Mapa de Densidade 3D

Renderiza o mapa hexagonal 3D usando `deck.gl` (HexagonLayer) sobre um mapa base via `MapLibre GL`. O estilo do mapa base alterna automaticamente entre tema claro (`positron`) e escuro (`dark-matter`) conforme o estado de `darkMode` ou `highContrast`.

**Funcionalidades:**
- **Expansão de tela cheia:** botão que alterna o mapa para ocupar toda a área de conteúdo e um `ResizeObserver` que recalcula as dimensões do canvas do deck.gl ao final da transição CSS.
- **Alternância 2D/3D:** controla o `pitch` do mapa entre visão isométrica (45°) e visão plana (0°), com ícones e `aria-pressed` para indicar o estado atual.
- **Tooltip acessível:** informações de impacto ao hover exibidas em um elemento com `role="tooltip"` e `aria-live="polite"`, lido automaticamente por leitores de tela ao surgir.

---

### 3.6. `StatsGrid.jsx` — Painel de Estatísticas

Grade de cartões com gráficos interativos construídos com `Recharts`, exibindo:

- **Público Total:** valor absoluto de impressões filtradas e o horário de pico estimado.
- **Fluxo 24h:** gráfico de área mostrando a distribuição de impressões ao longo do dia.
- **Distribuição por Bairro:** gráfico de barras horizontais com os top bairros por volume de público.
- **Classe Social:** gráfico de barras verticais com a distribuição por classe econômica.
- **Gênero:** gráfico de rosca (donut) com a proporção masculino/feminino.

Todos os cartões utilizam `role="article"` e `aria-label` descritivos. As cores dos gráficos são fornecidas pelo `chartColors` derivado do modo daltônico selecionado, garantindo legibilidade universal.

---

### 3.7. `FilterPanel.jsx` — Filtros de Público

Painel lateral direito com checkboxes para filtrar o público exibido no mapa e nos gráficos por:

- **Faixa Etária:** 18-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80+
- **Gênero:** Masculino, Feminino
- **Classe Social:** A, B1, B2, C1, C2, DE
- **Horários (24h):** horas 0 a 23
- **Flag "Apenas Bins Relevantes":** oculta hexágonos com valor calculado abaixo de um limiar mínimo.

Cada grupo de checkboxes utiliza `role="group"` com `aria-labelledby` apontando para o rótulo visual do grupo.

---

### 3.8. `SettingsPanel.jsx` — Painel de Acessibilidade

Tela dedicada às configurações de personalização e acessibilidade (detalhada na seção 5 deste documento).

---

### 3.9. `CampaignsPage.jsx` — Tela de Campanhas

Nova tela adicionada nesta sprint (detalhada na seção 6 deste documento).

---

## 4. Suporte a Dark Mode

O dark mode foi implementado de forma **puramente via CSS** — sem troca de componentes nem lógica JavaScript complexa.

### Como funciona

Quando o usuário ativa o dark mode no `SettingsPanel`, o `App.jsx` executa:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

O `Dashboard.css` define todas as variáveis de cor dentro de seletores condicionais:

```css
:root {
  --bg-primary: #FFFFFF;
  --text-primary: #1A1A2E;
  /* ... demais variáveis de tema claro */
}

[data-theme="dark"] {
  --bg-primary: #0F0F1A;
  --text-primary: #E8E8F0;
  /* ... demais variáveis de tema escuro */
}
```

Cada componente utiliza apenas variáveis CSS (`var(--bg-primary)`, `var(--text-primary)` etc.), garantindo que a troca de tema seja instantânea e global sem nenhuma renderização adicional.

### Mapa base adaptativo

O `MapView.jsx` detecta o tema atual via props e alterna o estilo do mapa base:

```js
const mapStyle = (darkMode || highContrast)
  ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
```

### Persistência

A preferência de dark mode é salva no cookie `venus-settings` e restaurada na próxima visita, sem necessidade de o usuário reconfigurar.

---

## 5. Acessibilidade — `SettingsPanel`

O painel de configurações foi inteiramente projetado para conformidade com as diretrizes **WCAG 2.1 AA**. As funcionalidades disponíveis são:

### 5.1. Idioma

Alterna toda a interface entre **Português (BR)** e **English**. A tradução é gerenciada pelo objeto `T` em `constants.js` e propagada via props `t` e `language`.

### 5.2. Modo Daltônico

Substitui a paleta de cores dos hexágonos do mapa e dos gráficos por variantes otimizadas para três tipos de daltonismo:

| Modo | Condição visual atendida |
|---|---|
| `none` | Visão padrão (laranja/vermelho) |
| `deutan` | Deuteranopia (ausência de receptores verdes) |
| `protan` | Protanopia (ausência de receptores vermelhos) |
| `tritan` | Tritanopia (ausência de receptores azuis) |

Uma prévia visual das cores é exibida no próprio painel, com swatches acessíveis via `aria-label`.

### 5.3. Dark Mode

Descrito em detalhes na seção 4.

### 5.4. Alto Contraste

Define `data-high-contrast="true"` no `<html>`. O CSS aumenta o contraste entre textos e fundos para usuários com baixa visão, e também força o mapa base para o tema escuro (maior contraste cartográfico).

### 5.5. Tamanho de Fonte

Quatro opções: Pequena, Média, **Grande** (padrão), Extra Grande. Implementado via `data-font-size` e variáveis CSS `--font-size-base`.

### 5.6. Família de Fonte

| Opção | Fonte | Propósito |
|---|---|---|
| Inter (padrão) | Inter | Leitura confortável em telas |
| OpenDyslexic | OpenDyslexic | Usuários com dislexia |
| Monoespaçada | monospace | Preferência por espaçamento uniforme |
| Serifada | Georgia, serif | Preferência por fonte serifada |

### 5.7. Reduzir Animações

Adiciona a classe `reduced-motion` ao `<html>`. O CSS desativa transições, animações CSS e respeita a *media query* `prefers-reduced-motion`, atendendo usuários com distúrbios vestibulares ou epilepsia fotossensível.

### 5.8. Atributos ARIA Globais

Além das configurações do painel, toda a aplicação recebeu marcação semântica:

- **`role` e `aria-label`** em todas as regiões semânticas (`<aside>`, `<main>`, `<nav>`, `<section>`).
- **`aria-current="page"`** nos botões de navegação ativos.
- **`aria-pressed`** nos botões de toggle do mapa (expandir, 2D/3D).
- **`aria-live="polite"`** no valor de público total e no tooltip do mapa, para que leitores de tela anunciem mudanças dinamicamente.
- **`aria-modal="true"`** no modal de nova campanha.
- **Todos os inputs** possuem `aria-label` explícito.
- **`role="switch"`** nos toggles booleanos com `aria-checked` refletindo o estado.

### 5.9. Restaurar Padrões

Botão "Restaurar Padrões" que reinicia todas as configurações para o objeto `DEFAULT_SETTINGS`, garantindo que o usuário possa sempre voltar ao estado original da aplicação.

---

## 6. Nova Funcionalidade: Tela de Campanhas

A `CampaignsPage` é a principal adição de UX desta sprint. Ela pode ser acessada pelo item **Campanhas** na `Sidebar`.

### 6.1. Visão Geral

A tela exibe uma listagem das campanhas publicitárias cadastradas, com possibilidade de filtrar por status e criar novas campanhas via modal.

### 6.2. Listagem de Campanhas

Cada cartão de campanha exibe:

- **Nome** da campanha
- **Status** com badge colorido: `Ativa` (verde), `Aguardando Início` (amarelo), `Finalizada` (cinza)
- **Período** (data de início e fim)
- **Número de locais** de exibição
- **Impressões** totais com variação percentual
- **Alcance** estimado com variação percentual
- **Tags** de segmentação (faixa etária, classe social, gênero, horário)

### 6.3. Filtro por Aba

Quatro abas de filtragem: **Todas**, **Ativas**, **Aguardando**, **Finalizadas**. A filtragem é puramente client-side via `useState` sobre os dados mock.

### 6.4. Modal de Nova Campanha

Acessado pelo botão **"+ Nova Campanha"**, o modal coleta as seguintes informações organizadas em etapas:

**Dados do Anunciante:**
- Empresa, CNPJ, Responsável, E-mail

**Dados da Campanha:**
- Nome, Descrição, Data de Início, Data de Fim

**Segmentação de Público:**
- Faixa Etária (checkboxes múltiplos)
- Gênero (checkboxes múltiplos)
- Classe Social (checkboxes múltiplos)
- Horários de exibição (checkboxes múltiplos)

O modal utiliza `role="dialog"`, `aria-modal="true"` e captura o foco ao ser aberto, atendendo às diretrizes de acessibilidade para diálogos modais.

### 6.5. Responsividade e Internacionalização

Todos os rótulos, status e textos da tela de Campanhas estão mapeados nas chaves do objeto `T` (pt/en), garantindo suporte total à alternância de idioma implementada no `SettingsPanel`.

---

## 7. Resumo das Melhorias

| Aspecto | Antes da Refatoração | Após a Refatoração |
|---|---|---|
| Estrutura | Monólito em um único arquivo | 8 componentes com responsabilidades únicas |
| Temas | Apenas tema claro fixo | Dark mode + alto contraste via CSS variables |
| Acessibilidade | Sem atributos ARIA | WCAG 2.1 AA com ARIA completo |
| Modo Daltônico | Não suportado | 4 paletas (padrão, deuteranopia, protanopia, tritanopia) |
| Tipografia | Fonte e tamanho fixos | 4 tamanhos e 4 famílias tipográficas configuráveis |
| Animações | Sempre ativas | Redução de animações configurável |
| Idioma | Apenas português | Português e Inglês |
| Tela de Campanhas | Inexistente | Listagem com filtros, cards e modal de criação |
| Persistência | Sem memória de preferências | Cookie de 1 ano com todas as preferências salvas |
