import React, { useState } from 'react';

const FILTER_GROUPS = {
  idade: ['18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'],
  genero: ['F', 'M'],
  classe_social: ['A', 'B1', 'B2', 'C1', 'C2', 'DE']
};

const LABELS = {
  idade: 'Faixa Etária',
  genero: 'Gênero',
  classe_social: 'Classe Social'
};

const FilterPanel = ({ filters, onFilterChange, isOpen, togglePanel }) => {
  const handleChange = (category, value) => {
    const newFilters = { ...filters };
    if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter(v => v !== value);
    } else {
      newFilters[category] = [...newFilters[category], value];
    }
    onFilterChange(newFilters);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={togglePanel}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          padding: '12px 20px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          fontSize: '14px'
        }}
      >
        Filtros ☰
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      background: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(10px)',
      color: '#f3f4f6',
      zIndex: 20,
      padding: '24px',
      overflowY: 'auto',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.6)',
      fontFamily: 'system-ui, sans-serif',
      borderLeft: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <h2 style={{margin: 0, fontSize: '20px', fontWeight: 600}}>Filtros de Público</h2>
        <button 
          onClick={togglePanel}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      <p style={{fontSize: '13px', color: '#9ca3af', marginBottom: '24px', lineHeight: '1.5'}}>
        Refine a visualização selecionando dados demográficos específicos.
      </p>

      {Object.entries(FILTER_GROUPS).map(([key, options]) => (
        <div key={key} style={{marginBottom: '32px'}}>
          <h3 style={{
            fontSize: '14px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: '#60a5fa',
            marginBottom: '12px',
            fontWeight: 700
          }}>
            {LABELS[key]}
          </h3>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px 12px'
          }}>
            {options.map(option => (
              <label 
                key={option} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  padding: '6px 0',
                  color: filters[key].includes(option) ? 'white' : '#9ca3af',
                  transition: 'color 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={filters[key].includes(option)}
                  onChange={() => handleChange(key, option)}
                  style={{
                    marginRight: '12px',
                    width: '18px',
                    height: '18px',
                    accentColor: '#2563eb',
                    cursor: 'pointer'
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      
      <div style={{
        marginTop: 'auto', 
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '12px', 
        color: '#6b7280'
      }}>
        Escala de Altura: Fixa (Normalizada)
      </div>
    </div>
  );
};

export default FilterPanel;
