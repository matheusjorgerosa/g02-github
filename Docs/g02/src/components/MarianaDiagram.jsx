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
        'Dificuldade em escolher os melhores pontos da cidade',
        'Insegurança ao investir parte significativa do orçamento',
        'Dependência da equipe da Eletromídia para análises',
        'Tempo perdido tentando entender relatórios técnicos',
        'Risco de campanhas mal direcionadas'
      ]
    },
    necessidades: {
      title: 'Necessidades',
      color: '#2563EB',
      icon: '🎯',
      content: [
        'Visualizar dados geográficos em mapas',
        'Entender fluxo de pessoas por horário',
        'Analisar público por idade, gênero e classe social',
        'Comparar diferentes regiões da cidade',
        'Filtrar dados por período',
        'Identificar pontos com maior potencial de conversão',
        'Tomar decisões sem depender de analistas da Eletromídia'
      ]
    },
    motivacoes: {
      title: 'Motivações',
      color: '#059669',
      icon: '🚀',
      content: [
        'Maximizar retorno sobre investimento',
        'Aumentar vendas da empresa',
        'Justificar decisões para diretoria',
        'Ganhar credibilidade interna',
        'Ser reconhecida como estratégica',
        'Reduzir desperdício de verba'
      ]
    },
    desafios: {
      title: 'Desafios',
      color: '#D97706',
      icon: '⚠️',
      content: [
        'Cruzar localização com perfil demográfico',
        'Tomar decisões rápidas com pouco tempo',
        'Conciliar estratégia com limitações financeiras',
        'Competir com empresas maiores'
      ]
    },
    desejos: {
      title: 'Desejos',
      color: '#7C3AED',
      icon: '✨',
      content: [
        'Mapa interativo por localização',
        'Heatmap por horário e público',
        'Indicadores automáticos de melhor ponto',
        'Sugestões visuais de investimento',
        'Relatórios prontos para apresentação',
        'Poucos cliques para gerar insights'
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
