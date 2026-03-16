import React from 'react';
import { FILTER_CONFIG } from '../constants';

function FilterPanel({ filters, toggleFilter, onlyRelevant, setOnlyRelevant, chartColors, t }) {
  return (
    <aside className="venus-right-col" style={{ paddingBottom: '100px' }} aria-label={t.publicFilters}>
      <h2 className="venus-filters-title">{t.publicFilters}</h2>

      <div className="venus-filter-group" style={{ background: chartColors.primary + '11', borderColor: chartColors.primary + '44' }}>
        <label className="venus-checkbox" style={{ fontWeight: 700, color: chartColors.primary }}>
          <input
            type="checkbox"
            checked={onlyRelevant}
            onChange={(e) => setOnlyRelevant(e.target.checked)}
            aria-label={t.onlyRelevant}
          />
          {t.onlyRelevant}
        </label>
      </div>

      <div className="venus-filter-group">
        <div className="venus-filter-label" id="filter-idade">{t.ageRange}</div>
        <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-idade">
          {FILTER_CONFIG.idade.map(opt => (
            <label key={opt} className="venus-checkbox">
              <input type="checkbox" checked={filters.idade.includes(opt)} onChange={() => toggleFilter('idade', opt)} aria-label={opt} />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div className="venus-filter-group">
        <div className="venus-filter-label" id="filter-genero">{t.genderLabel}</div>
        <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-genero">
          {FILTER_CONFIG.genero.map(opt => (
            <label key={opt.id} className="venus-checkbox">
              <input type="checkbox" checked={filters.genero.includes(opt.id)} onChange={() => toggleFilter('genero', opt.id)} aria-label={opt.id === 'M' ? t.male : t.female} />
              {opt.id === 'M' ? t.male : t.female}
            </label>
          ))}
        </div>
      </div>

      <div className="venus-filter-group">
        <div className="venus-filter-label" id="filter-classe">{t.socialClassLabel}</div>
        <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-classe">
          {FILTER_CONFIG.classe_social.map(opt => (
            <label key={opt} className="venus-checkbox">
              <input type="checkbox" checked={filters.classe_social.includes(opt)} onChange={() => toggleFilter('classe_social', opt)} aria-label={`Classe ${opt}`} />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div className="venus-filter-group">
        <div className="venus-filter-label" id="filter-horario">{t.hoursLabel}</div>
        <div className="venus-hour-grid" role="group" aria-labelledby="filter-horario">
          {FILTER_CONFIG.horario.map(h => (
            <label key={h} className="venus-checkbox">
              <input type="checkbox" checked={filters.horario.includes(h)} onChange={() => toggleFilter('horario', h)} aria-label={`${h}:00`} />
              {h}h
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FilterPanel;
