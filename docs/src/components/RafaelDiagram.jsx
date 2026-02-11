import React from 'react';

import rafaelImg from '@site/static/img/rafael.png';

export default function RafaelDiagram() {
  const sections = {
    perfil: {
      title: 'Perfil',
      color: '#4F46E5',
      icon: '👤',
      content: [
        { label: 'Idade', value: '29 anos' },
        { label: 'Cargo', value: 'Analista de Inteligência de Mercado' },
        { label: 'Empresa', value: 'Eletromidia' },
        { label: 'Formação', value: 'Administração' },
        { label: 'Nível tecnológico', value: 'Intermediário–avançado' },
        { label: 'Responsabilidade', value: 'Apoio técnico e estratégico aos clientes' }
      ]
    },
    dores: {
      title: 'Dores',
      color: '#DC2626',
      icon: '😰',
      content: [
        'Precisa responder clientes em tempo real sobre os melhores pontos da cidade.',
        'Monta análises manualmente em planilhas, gastando tempo com consolidação de dados em vez de focar no relacionamento com o cliente.',
        'Sofre pressão constante do time comercial por respostas rápidas que ajudem a fechar contratos.',
        'Dificuldade em escalar o atendimento, pois cada nova demanda exige esforço manual e personalizado.'
      ]
    },
    necessidades: {
      title: 'Necessidades',
      color: '#2563EB',
      icon: '🎯',
      content: [
        'Ter um dashboard integrado à plataforma comercial, centralizando todas as informações relevantes.',
        'Acesso rápido a mapas geográficos para demonstrar visualmente o potencial de cada ponto.',
        'Filtros por horário, região e perfil de público, permitindo análises personalizadas.',
        'Visualização automática do target, facilitando a explicação do perfil do público ao cliente.',
        'Indicadores prontos para explicar ao cliente, reduzindo a necessidade de análises manuais.',
        'Dados confiáveis e atualizados, garantindo segurança nas recomendações.'
      ]
    },
    motivacoes: {
      title: 'Motivações',
      color: '#059669',
      icon: '🚀',
      content: [
        'Ajudar clientes a tomarem decisões melhores com base em dados claros e objetivos.',
        'Aumentar a satisfação e a retenção dos clientes por meio de um atendimento mais qualificado.',
        'Reduzir o trabalho operacional repetitivo, ganhando mais tempo para atividades estratégicas.',
        'Fortalecer a relação com o time comercial, contribuindo diretamente para o fechamento de contratos.',
        'Entregar valor rapidamente, demonstrando eficiência e profissionalismo.'
      ]
    },
    desafios: {
      title: 'Desafios',
      color: '#D97706',
      icon: '⚠️',
      content: [
        'Atender vários clientes ao mesmo tempo sem comprometer a qualidade das análises.',
        'Explicar dados complexos para clientes leigos de forma simples e acessível.',
        'Conciliar demandas técnicas com necessidades comerciais, equilibrando precisão e agilidade.',
        'Evitar erros em análises e recomendações que possam comprometer contratos e relacionamentos.'
      ]
    },
    desejos: {
      title: 'Desejos',
      color: '#7C3AED',
      icon: '✨',
      content: [
        'Disponibilizar um dashboard intuitivo para os clientes, reduzindo a dependência direta do suporte.',
        'Trabalhar com dados visuais e autoexplicativos, facilitando apresentações e reuniões.',
        'Ter mapas prontos para uso imediato em negociações comerciais.',
        'Reduzir drasticamente as tarefas manuais.',
        'Ter mais autonomia no atendimento, atuando de forma mais estratégica.'
      ]
    }
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '2.5rem',
          color: 'white',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <img 
              src={rafaelImg} 
              alt="Rafael Moreira" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
              Rafael Moreira
            </h1>
            <p
              style={{
                margin: '0.5rem 0 0 0',
                fontSize: '1.2rem',
                opacity: 0.95
              }}
            >
              Analista de Inteligência de Mercado • 29 anos
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            borderLeft: '4px solid white'
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontStyle: 'italic',
              lineHeight: '1.6'
            }}
          >
            "Quando o cliente tem os dados em uma visualização clara, ele ganha autonomia e toma decisões com mais segurança."
          </p>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          background: '#F9FAFB',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          borderLeft: '4px solid #4F46E5'
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1F2937' }}>Descrição</h3>
        <p style={{ color: '#4B5563', lineHeight: '1.7', margin: 0 }}>
          Rafael trabalha diretamente com equipes de vendas, atendimento e clientes
          estratégicos da Eletromidia. Seu papel é transformar dados de fluxo em valor comercial, ajudando
          os gerentes de marketing a entenderem o impacto das campanhas.
        </p>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {Object.entries(sections).map(([key, section]) => (
          <div
            key={key}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: `2px solid ${section.color}`,
              boxShadow: `0 4px 20px ${section.color}30`
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}
            >
              <span style={{ fontSize: '2rem' }}>{section.icon}</span>
              <h3
                style={{
                  margin: 0,
                  color: section.color,
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}
              >
                {section.title}
              </h3>
            </div>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: `2px solid ${section.color}20`
              }}
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  color: '#4B5563',
                  lineHeight: '1.8'
                }}
              >
                {section.content.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {typeof item === 'object' ? (
                      <span>
                        <strong>{item.label}:</strong> {item.value}
                      </span>
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}