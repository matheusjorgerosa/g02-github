import React, { useState } from 'react';
import Icons from './Icons';
import { FILTER_CONFIG } from '../constants';

const MOCK_CAMPAIGNS = [
  {
    id: 1, name: 'Lançamento Verão 2026', status: 'ativa',
    dateStart: '10 jan 2026', dateEnd: '28 fev 2026', locals: 5,
    impressions: '2.1m', impressionsChange: '+8.3%',
    reach: '870k', reachChange: '+5.7%',
    tags: ['18-29 anos', 'Classe B', 'Feminino', '12h-20h'],
  },
  {
    id: 2, name: 'Campanha Institucional', status: 'ativa',
    dateStart: '15 fev 2026', dateEnd: '28 fev 2026', locals: 5,
    impressions: '2.1m', impressionsChange: '+8.3%',
    reach: '870k', reachChange: '+5.1%',
    tags: ['18-29 anos', 'Classe B', 'Feminino', '12h-20h'],
  },
  {
    id: 3, name: 'Dia das mães 2026', status: 'aguardando',
    dateStart: '30 abr 2026', dateEnd: '20 mai 2026', locals: 5,
    impressions: '2.1m', impressionsChange: '+8.3%',
    reach: '870k', reachChange: '+5.7%',
    tags: ['18-29 anos', 'Classe B', 'Feminino', '12h-20h'],
  },
  {
    id: 4, name: 'Black Friday 2026', status: 'aguardando',
    dateStart: '20 nov 2026', dateEnd: '30 nov 2026', locals: 5,
    impressions: '2.1m', impressionsChange: '+8.3%',
    reach: '870k', reachChange: '+5.7%',
    tags: ['18-29 anos', 'Classe B', 'Feminino', '12h-20h'],
  },
];

const STATUS_LABELS = {
  pt: { ativa: 'Ativa', aguardando: 'Aguardando Início', finalizada: 'Finalizada' },
  en: { ativa: 'Active', aguardando: 'Awaiting Start', finalizada: 'Finished' },
};

const TAB_LABELS = {
  pt: ['Todas', 'Ativas', 'Aguardando', 'Finalizadas'],
  en: ['All', 'Active', 'Awaiting', 'Finished'],
};

const TAB_KEYS = ['all', 'ativa', 'aguardando', 'finalizada'];

function NewCampaignModal({ onClose, t, language }) {
  const [form, setForm] = useState({
    empresa: '', cnpj: '', responsavel: '', email: '',
    nomeCampanha: '', descricao: '', dataInicio: '', dataFim: '',
    idade: [], genero: [], classe: [], horario: [],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleArr = (key, val) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));

  const CheckGroup = ({ label, optKey, options }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div className="campaign-modal-checkbox-group">
        {options.map(opt => {
          const val = typeof opt === 'object' ? opt.id : opt;
          const lbl = typeof opt === 'object' ? (opt.id === 'M' ? (language === 'pt' ? 'Masculino' : 'Male') : (language === 'pt' ? 'Feminino' : 'Female')) : opt;
          return (
            <label key={val} className="venus-checkbox" style={{ fontSize: '0.8rem' }}>
              <input
                type="checkbox"
                checked={form[optKey].includes(val)}
                onChange={() => toggleArr(optKey, val)}
                aria-label={lbl}
              />
              {lbl}
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="campaign-modal-overlay" role="dialog" aria-modal="true" aria-label={language === 'pt' ? 'Nova Campanha' : 'New Campaign'}>
      <div className="campaign-modal">
        <button className="campaign-modal-close" onClick={onClose} aria-label="Fechar">✕</button>

        <div>
          <h2 className="campaign-modal-title">{language === 'pt' ? 'Nova Campanha' : 'New Campaign'}</h2>
          <p className="campaign-modal-subtitle">
            {language === 'pt' ? 'Preencha os dados e defina o público-alvo da campanha' : 'Fill in the details and define the campaign target audience'}
          </p>
        </div>

        {/* Company data */}
        <div>
          <h3 className="campaign-modal-section-title">{language === 'pt' ? 'Dados da empresa' : 'Company Data'}</h3>
          <div className="campaign-modal-grid">
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Empresa' : 'Company'}</label>
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Eletromidia S.A" />
            </div>
            <div className="campaign-modal-field">
              <label>CNPJ</label>
              <input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="12.345.678/0001-39" />
            </div>
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Responsável' : 'Contact'}</label>
              <input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="André Souza" />
            </div>
            <div className="campaign-modal-field">
              <label>E-mail</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Andre@eletro.com" />
            </div>
          </div>
        </div>

        {/* Campaign data */}
        <div>
          <h3 className="campaign-modal-section-title">{language === 'pt' ? 'Dados da campanha' : 'Campaign Data'}</h3>
          <div className="campaign-modal-grid full" style={{ gap: 14 }}>
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Nome da Campanha' : 'Campaign Name'}</label>
              <input value={form.nomeCampanha} onChange={e => set('nomeCampanha', e.target.value)} placeholder={language === 'pt' ? 'Ex. Lançamento 2026' : 'Ex. Launch 2026'} />
            </div>
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Descrição' : 'Description'}</label>
              <textarea rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder={language === 'pt' ? 'Descrição' : 'Description'} />
            </div>
          </div>
          <div className="campaign-modal-grid" style={{ marginTop: 14 }}>
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Data de Início' : 'Start Date'}</label>
              <input type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div className="campaign-modal-field">
              <label>{language === 'pt' ? 'Data de Fim' : 'End Date'}</label>
              <input type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
          </div>
        </div>

        {/* Target audience */}
        <div>
          <h3 className="campaign-modal-section-title">{language === 'pt' ? 'Público Alvo' : 'Target Audience'}</h3>
          <CheckGroup label={language === 'pt' ? 'Faixa etária' : 'Age Range'} optKey="idade" options={FILTER_CONFIG.idade} />
          <CheckGroup label={language === 'pt' ? 'Gênero' : 'Gender'} optKey="genero" options={FILTER_CONFIG.genero} />
          <CheckGroup label={language === 'pt' ? 'Classe Social' : 'Social Class'} optKey="classe" options={FILTER_CONFIG.classe_social} />
          <CheckGroup
            label={language === 'pt' ? 'Horário' : 'Hours'}
            optKey="horario"
            options={[
              { id: '00h-04h', label: '00h-04h' }, { id: '05h-09h', label: '05h-09h' },
              { id: '10h-14h', label: '10h-14h' }, { id: '15h-19h', label: '15h-19h' },
              { id: '20h-00h', label: '20h-00h' },
            ].map(o => ({ ...o }))}
          />
        </div>

        <button className="campaign-modal-submit" onClick={onClose}>
          {language === 'pt' ? 'Criar Campanha' : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, language }) {
  const statusLabels = STATUS_LABELS[language] || STATUS_LABELS.pt;
  return (
    <article className="campaign-card">
      <div className="campaign-card-left">
        <div className="campaign-card-title-row">
          <span className="campaign-card-name">{campaign.name}</span>
          <span className={`campaign-status-badge ${campaign.status}`}>{statusLabels[campaign.status]}</span>
        </div>

        <div className="campaign-meta">
          <span className="campaign-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {campaign.dateStart} – {campaign.dateEnd}
          </span>
          <span className="campaign-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {campaign.locals} {language === 'pt' ? 'locais' : 'locations'}
          </span>
        </div>

        <div className="campaign-tags">
          {campaign.tags.map(tag => <span key={tag} className="campaign-tag">{tag}</span>)}
        </div>
      </div>

      <div className="campaign-card-right">
        <div className="campaign-metrics">
          <div className="campaign-metric">
            <div className="campaign-metric-label">{language === 'pt' ? 'Impressões' : 'Impressions'}</div>
            <div className="campaign-metric-value">{campaign.impressions}</div>
            <div className="campaign-metric-change">{campaign.impressionsChange}</div>
          </div>
          <div className="campaign-metric">
            <div className="campaign-metric-label">{language === 'pt' ? 'Alcance' : 'Reach'}</div>
            <div className="campaign-metric-value">{campaign.reach}</div>
            <div className="campaign-metric-change">{campaign.reachChange}</div>
          </div>
        </div>

        <div className="campaign-actions">
          <button className="campaign-btn edit" aria-label={language === 'pt' ? `Editar ${campaign.name}` : `Edit ${campaign.name}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {language === 'pt' ? 'Editar' : 'Edit'}
          </button>
          <button className="campaign-btn view" aria-label={language === 'pt' ? `Ver no dashboard ${campaign.name}` : `View dashboard ${campaign.name}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {language === 'pt' ? 'Ver no dashboard' : 'View dashboard'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CampaignsPage({ t, language }) {
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const tabLabels = TAB_LABELS[language] || TAB_LABELS.pt;

  const filtered = activeTab === 'all'
    ? MOCK_CAMPAIGNS
    : MOCK_CAMPAIGNS.filter(c => c.status === activeTab);

  const total = MOCK_CAMPAIGNS.length;
  const ativas = MOCK_CAMPAIGNS.filter(c => c.status === 'ativa').length;
  const aguardando = MOCK_CAMPAIGNS.filter(c => c.status === 'aguardando').length;

  return (
    <div className="campaigns-page" role="main">
      <div className="campaigns-header">
        <p className="campaigns-greeting">{t.hello}</p>
        <h1 className="campaigns-title">{t.campaignsTitle}</h1>
      </div>

      <div className="campaigns-stats-row" role="region" aria-label={language === 'pt' ? 'Resumo de campanhas' : 'Campaigns summary'}>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Campaign /></span>
          <div>
            <div className="campaigns-stat-label">{language === 'pt' ? 'Total de campanhas' : 'Total campaigns'}</div>
            <div className="campaigns-stat-value">{total}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Campaign /></span>
          <div>
            <div className="campaigns-stat-label">{language === 'pt' ? 'Campanhas ativas' : 'Active campaigns'}</div>
            <div className="campaigns-stat-value">{ativas}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Campaign /></span>
          <div>
            <div className="campaigns-stat-label">{language === 'pt' ? 'Aguardando início' : 'Awaiting start'}</div>
            <div className="campaigns-stat-value">{aguardando}</div>
          </div>
        </div>
      </div>

      <div className="campaigns-toolbar">
        <div className="campaigns-tabs" role="tablist" aria-label={language === 'pt' ? 'Filtrar campanhas' : 'Filter campaigns'}>
          {TAB_KEYS.map((key, i) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              className={`campaigns-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {tabLabels[i]}
            </button>
          ))}
        </div>

        <button className="campaigns-new-btn" onClick={() => setShowModal(true)} aria-label={language === 'pt' ? 'Criar nova campanha' : 'Create new campaign'}>
          + {language === 'pt' ? 'Nova Campanha' : 'New Campaign'}
        </button>
      </div>

      <div className="campaigns-list" role="tabpanel">
        {filtered.map(c => <CampaignCard key={c.id} campaign={c} language={language} />)}
      </div>

      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} t={t} language={language} />}
    </div>
  );
}

export default CampaignsPage;
