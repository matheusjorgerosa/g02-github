---
sidebar_position: 1
title: Requisitos Funcionais
---

# Requisitos Funcionais

---
## 1. Contextualização

Um Requisito Funcional (RF) descreve o comportamento do sistema, definindo o que ele deve fazer para atender às necessidades dos usuários e atingir os objetivos do projeto. Ele especifica as funções, reações a entradas e comportamentos esperados.

De acordo com **Sommerville (2011)**, requisitos funcionais especificam _“as funções que o sistema deve oferecer, como o sistema deve reagir a entradas específicas e como deve se comportar em determinadas situações”_.

### Atores do Sistema
Para melhor compreensão dos requisitos, eles foram separados nos seguintes atores:
- **Sistema de Ingestão:** Processo automatizado responsável pela coleta, tratamento e armazenamento dos dados.
- **Usuário Analista:** Profissional que interage com a interface visual para extração de insights.

## 2. Lista de Requisitos Funcionais

| ID    | Requisitos| Prioridade | Critério de Aceite| Status|
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- | --------- |
| **Ingestão e Processamento** |
| RF-01 | O sistema deve consumir os dados de fluxo de pessoas através da API da Claro.| Alta| O sistema deve obter resposta HTTP 200 com payload de dados.| Planejado |
| RF-02 | O sistema deve armazenar os dados brutos recebidos da API no formato JSON.| Alta| O arquivo JSON salvo deve conter a mesma estrutura e campos do payload original.| Planejado |
| RF-03 | O sistema deve registrar logs operacionais de ingestão, incluindo sucessos e falhas de comunicação.                                                                 | Alta       | O log deve conter data, hora e código do erro (se houver) para cada tentativa de ingestão.| Planejado |
| RF-04 | O sistema deve persistir os dados validados em um Data Lake, preservando o histórico.| Alta| Os dados devem estar acessíveis para leitura no diretório correto do Data Lake após a ingestão.| Planejado |
| RF-05 | O sistema deve transformar os dados do Data Lake, normalizando-os para um modelo relacional estruturado.| Alta| A transformação deve converter corretamente tipos de dados (ex: string para datetime).| Planejado |
| RF-06 | O sistema deve carregar os dados transformados no Banco de Dados Relacional para consumo do dashboard sem perdas de dados.| Alta       | A contagem de registros no banco deve bater com a contagem do Data Lake.              | Planejado |
| RF-07 | O sistema deve suportar a ingestão recorrente de novos dados integrando-os ao histórico existente.| Média      | Novos dados devem ser adicionados (append) sem sobrescrever o histórico anterior.| Planejado |
| RF-08 | O sistema deve suportar a ingestão massiva de dados fornecidos pela API da Claro sem que haja queda do sistema.| Alta       | O sistema deve ser projetado para suportar volumes massivos de dados na casa dos vários MB/s.           | Planejado |
| **Visualização e Analytics** |
| RF-09 | O sistema deve exibir os dados em um mapa interativo.| Alta       | Os pontos devem aparecer na localização geográfica correta conforme coordenadas do banco.| Planejado |
| RF-10 | O sistema deve permitir a visualização em formato de mapa de calor (Heatmap) para representar densidade.| Alta       | Regiões com maior valor no campo `uniques` devem apresentar coloração mais intensa.            | Planejado |
| RF-11 | O sistema deve permitir a segmentação dos dados por perfil demográfico (idade, gênero e classe social).| Alta       | Ao selecionar um filtro (ex: "Classe B"), o totalizador deve refletir apenas esse grupo.       | Planejado |
| RF-12 | O sistema deve permitir a filtragem temporal dos dados (intervalo de datas, dias da semana e horários).| Alta       | A visualização deve atualizar e exibir apenas os dados compreendidos no período selecionado.   | Planejado |
| RF-13 | O sistema deve calcular e exibir métricas agregadas (Soma total de fluxo, Média diária e Picos de horário).| Alta       | Os valores exibidos nos cards devem corresponder à soma aritmética dos dados filtrados.        | Planejado |
| RF-14 | O sistema deve permitir interações de navegação no mapa, incluindo Zoom In, Zoom Out e Drill-down em pontos específicos.| Média      | O usuário deve conseguir alterar o nível de zoom e clicar em um ponto para ver detalhes.       | Planejado |
| RF-15 | O sistema deve permitir a exportação dos dados visualizados e relatórios para formatos externos (CSV e PDF).| Baixa      | O arquivo gerado deve conter os mesmos dados apresentados na tela no momento da exportação.    | Planejado |

---
## 3. Conclusão
A definição dos requisitos funcionais estabelece uma base para o desenvolvimento do Visualizador de Dados de Fluxo de Pessoas da Eletromidia, garantindo alinhamento entre os objetivos de negócio, as necessidades dos usuários e as capacidades técnicas do sistema. Com esses requisitos, baseados nas personas, o projeto poderá ser desenvolvido atendendo e solucionando as dores dos usuários.


**Referências**
- _Sommerville, I. (2011). Requisitos Funcionais Engenharia de Software. 9ª edição. Pearson._