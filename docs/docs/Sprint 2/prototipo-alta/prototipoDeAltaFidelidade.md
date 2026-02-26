---
title: Protótipo de Alta fidelidade
sidebar_position: 2
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Protótipo de Alta Fidelidade

<strong>Link para o Figma:</strong> 

Durante a Sprint 1, desenvolvemos um wireframe de baixa fidelidade para validar os fluxos principais da plataforma, como cadastro de campanhas, seleção de locais e visualização de dados. Com base nesse aprendizado, evoluímos para um protótipo de alta fidelidade, detalhando as interações, elementos visuais e fluxos completos do sistema, aproximando-se da experiência final do usuário.

O protótipo cobre os seguintes fluxos principais:

1. Visualização de campanhas em aberto (aquelas sem local definido para exibição)
2. Cadastro de novas campanhas, com definição de nome, descrição e público-alvo
3. Acesso e gerenciamento de todas as campanhas do usuário, com status (ativas, pendentes de local, finalizadas)
4. Escolha da localização das campanhas utilizando mapas interativos, com seleção de pontos e visualização de indicadores
5. Aplicação de filtros demográficos (idade, gênero, classe social) e de visualização (mapa de calor, hexbins) para análise dos dados
6. Visualização de tela de performance para campanhas ativas (funcionalidade futura)

## Telas do Protótipo

### 1. Login

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 1 - Tela inicial de Login</strong></p>
  <img 
    src={useBaseUrl('/img/login_alta.png')} 
    alt="Tela inicial de Login" 
    title="Tela inicial de Login" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

<div style={{marginBottom: '1.5rem'}}>Tela inicial para autenticação do usuário, garantindo acesso seguro à plataforma. O design é simples e objetivo, focando na experiência rápida de entrada.</div>

### 2. Dashboard Inicial (Mapa, Filtros e Seleção de Pontos)

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 2 - Tela de visualização de dados</strong></p>
  <img 
    src={useBaseUrl('/img/dashboard_alta.png')} 
    alt="Tela de visualização de dados" 
    title="Tela de visualização de dados" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

<div style={{marginBottom: '1.5rem'}}>Esta é a tela central da plataforma. O usuário visualiza um mapa interativo, podendo aplicar filtros demográficos (idade, gênero, classe social) e escolher o tipo de visualização (mapa de calor, hexbins). Ao clicar em pontos do mapa, pode selecionar locais para sua campanha e visualizar indicadores de performance do local, como fluxo estimado de pessoas e perfil do público.</div>

### 3. Suas Campanhas

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 3 - Tela de visualização de campanhas</strong></p>
  <img 
    src={useBaseUrl('/img/criacao_campanha_alta.png')} 
    alt="Tela de visualização de campanhas" 
    title="Tela de visualização de campanhas" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

<div style={{marginBottom: '1.5rem'}}>Tela dedicada à gestão das campanhas do usuário. Exibe uma lista com todas as campanhas cadastradas, destacando o status de cada uma (ativa, aguardando seleção de local, finalizada). Permite acessar detalhes, editar ou excluir campanhas, além de identificar rapidamente quais precisam de ação.</div>

### 4. Popup de Criar Campanha

<div style={{ textAlign: 'center' }}>
  <p><strong>Figura 4 - Popup de Criar Campanha</strong></p>
  <img 
    src={useBaseUrl('/img/criar_campanha_alta.png')} 
    alt="Popup de Criar Campanha" 
    title="Popup de Criar Campanha" 
    style={{ maxWidth: '80%', height: 'auto' }}
  />
  <p>Fonte: Elaborado pelo grupo Café da Sophia (2026)</p>
</div>

<div style={{marginBottom: '1.5rem'}}>Ao clicar para criar uma nova campanha, um popup é exibido solicitando informações essenciais: nome, descrição e público-alvo. Após o cadastro, o usuário é direcionado ao dashboard para selecionar os locais no mapa. Se o usuário clicar em uma campanha existente, é levado ao dashboard com os filtros e dados daquela campanha aplicados automaticamente.</div>

## Conclusão

O protótipo de alta fidelidade foi fundamental para validar fluxos, testar a experiência do usuário e alinhar as funcionalidades com os requisitos do projeto. Ele detalha cada etapa da jornada do usuário, desde o login até a gestão e análise de campanhas, garantindo que a plataforma seja intuitiva, eficiente e atenda às necessidades do público-alvo. Além disso, o protótipo serve como referência visual e funcional para o desenvolvimento do produto final, facilitando a comunicação entre equipe técnica, stakeholders e usuários, e assegurando que os requisitos funcionais e não funcionais sejam contemplados desde as fases iniciais do projeto.

