import React from 'react';

import marianaImg from '@site/static/img/mariana.png';

export default function PersonaDiagram() {
  const sections = {
    perfil: {
      title: 'Perfil',
      color: '#4F46E5',
      icon: '👤',
      content: [
        { label: 'Idade', value: '34 anos' },
        { label: 'Cargo', value: 'Gerente de Marketing' },
        { label: 'Empresa', value: 'PME do setor varejista' },
        { label: 'Formação', value: 'Publicidade e Propaganda' },
        { label: 'Nível tecnológico', value: 'Intermediário' }
      ]
    },
    dores: {
      title: 'Dores',
      color: '#DC2626',
      icon: '😰',
      content: [
        'Dificuldade em escolher os melhores pontos da cidade, pois não há comparação clara entre regiões.',
        'Insegurança ao investir parte significativa do orçamento sem ter clareza sobre o real potencial de retorno de cada local.',
        'Dependência da equipe da Eletromídia para análises, o que gera atrasos nas decisões e reduz sua autonomia.',
        'Risco de campanhas mal direcionadas, atingindo públicos pouco relevantes e reduzindo a efetividade do investimento.'
      ]
    },
    necessidades: {
      title: 'Necessidades',
      color: '#2563EB',
      icon: '🎯',
      content: [
        'Visualizar dados geográficos em mapas interativos, facilitando a compreensão da distribuição dos pontos pela cidade.',
        'Entender o fluxo de pessoas por horário, identificando os períodos de maior visibilidade para as campanhas.',
        'Analisar o perfil do público por idade, gênero e classe social, garantindo alinhamento com o público-alvo.',
        'Comparar diferentes regiões da cidade de forma rápida, identificando áreas com maior potencial estratégico.',
        'Identificar pontos com maior potencial de conversão, cruzando localização, fluxo e perfil demográfico.',
        'Tomar decisões sem depender de analistas da Eletromídia, ganhando mais autonomia e agilidade.'
      ]
    },
    motivacoes: {
      title: 'Motivações',
      color: '#059669',
      icon: '🚀',
      content: [
        'Maximizar o retorno sobre investimento, garantindo que cada campanha gere resultados mensuráveis.',
        'Aumentar as vendas da empresa por meio de campanhas bem direcionadas.',
        'Justificar decisões para a diretoria com dados claros, visuais e confiáveis.',
        'Ganhar credibilidade interna como gestora estratégica e orientada por dados.',
        'Ser reconhecida como uma profissional capaz de transformar informações em resultados.',
        'Reduzir o desperdício de verba em campanhas pouco eficientes.'
      ]
    },
    desafios: {
      title: 'Desafios',
      color: '#D97706',
      icon: '⚠️',
      content: [
        'Cruzar dados de localização com perfil demográfico de forma eficiente.',
        'Tomar decisões rápidas.',
        'Conciliar estratégias de campanhas com limitações financeiras.',
        'Competir com empresas maiores, que possuem mais recursos.'
      ]
    },
    desejos: {
      title: 'Desejos',
      color: '#7C3AED',
      icon: '✨',
      content: [
        'Ter acesso a um mapa interativo por localização, facilitando a visualização dos pontos de mídia.',
        'Utilizar heatmaps por horário e perfil de público para identificar padrões de circulação.',
        'Contar com indicadores automáticos que apontem os melhores pontos para investimento.',
        'Receber sugestões visuais de investimento baseadas nos dados disponíveis.',
        'Obter insights relevantes em poucos cliques, sem precisar de suporte técnico.'
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
              src={marianaImg} 
              alt="Mariana Costa" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>
              Mariana Costa
            </h1>
            <p
              style={{
                margin: '0.5rem 0 0 0',
                fontSize: '1.2rem',
                opacity: 0.95
              }}
            >
              Gerente de Marketing • 34 anos
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
            "Cada campanha é um investimento alto. Preciso ter certeza de que estou escolhendo os lugares certos."
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
          Mariana é responsável por planejar, executar e otimizar campanhas
          publicitárias em mídia out-of-home. Ela precisa decidir onde, quando e
          para quem anunciar. Apesar de lidar diariamente com números, não é
          especialista em tecnologia ou dados. Prefere ferramentas
          visuais, intuitivas e diretas, que entreguem respostas
          rápidas.
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
