import React, { useState, useEffect } from 'react';
import Icons from './Icons';

const MOCK_LOGS = [
  {
    id: 1,
    ts: '2026-03-25T12:09:00Z',
    level: 'error',
    source: 'auth/login',
    msg: 'Falha de autenticação para o usuário teste.front@venus.local (senha inválida).',
  },
  {
    id: 2,
    ts: '2026-03-25T12:03:00Z',
    level: 'warn',
    source: 'flow/metrics',
    msg: 'BigQuery indisponível no ambiente local. Retornando fallback de desenvolvimento.',
  },
  {
    id: 3,
    ts: '2026-03-25T11:58:00Z',
    level: 'info',
    source: 'admin/users',
    msg: 'Usuário Teste Front criado com sucesso via rota /signup.',
  },
  {
    id: 4,
    ts: '2026-03-25T11:52:00Z',
    level: 'info',
    source: 'server/bootstrap',
    msg: 'Aplicação iniciada e escutando em :8080.',
  },
  {
    id: 5,
    ts: '2026-03-25T11:49:00Z',
    level: 'warn',
    source: 'maps/geocode',
    msg: 'Chave de geocoding em modo desenvolvimento detectada.',
  },
];

export default function AdminLogsPage({ t }) {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setLogs(MOCK_LOGS);
  }, []);

  const tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'error', label: 'Erros' },
    { key: 'warn', label: 'Alertas' },
    { key: 'info', label: 'Info' },
  ];

  const filteredLogs = activeTab === 'all' ? logs : logs.filter((log) => log.level === activeTab);
  const totalLogs = logs.length;
  const errorsCount = logs.filter((log) => log.level === 'error').length;
  const warnsCount = logs.filter((log) => log.level === 'warn').length;

  return (
    <div className="campaigns-page admin-page" role="main">
      <div className="campaigns-header">
        <p className="campaigns-greeting">{t.hello}</p>
        <h1 className="campaigns-title">Logs do Sistema</h1>
      </div>

      <div className="campaigns-stats-row" role="region" aria-label="Resumo de logs">
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Logs /></span>
          <div>
            <div className="campaigns-stat-label">Total de eventos</div>
            <div className="campaigns-stat-value">{totalLogs}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Error /></span>
          <div>
            <div className="campaigns-stat-label">Erros</div>
            <div className="campaigns-stat-value">{errorsCount}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Alert /></span>
          <div>
            <div className="campaigns-stat-label">Alertas</div>
            <div className="campaigns-stat-value">{warnsCount}</div>
          </div>
        </div>
      </div>

      <div className="campaigns-toolbar">
        <div className="campaigns-tabs" role="tablist" aria-label="Filtro de logs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              className={`campaigns-tab ${activeTab === tab.key ? 'active' : ''}`}
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="admin-page-subtitle">Modo mockado para desenvolvimento de interface.</p>
      </div>

      <div className="campaigns-list" role="list">
        {filteredLogs.map((log) => (
          <article key={log.id} className="campaign-card admin-log-card" role="listitem">
            <div className="campaign-card-left">
              <div className="campaign-card-title-row">
                <span className="campaign-card-name">{log.source}</span>
                <span className={`campaign-status-badge admin-log-badge ${log.level}`}>
                  {log.level.toUpperCase()}
                </span>
              </div>

              <div className="campaign-meta">
                <span className="campaign-meta-item">{new Date(log.ts).toLocaleString('pt-BR')}</span>
              </div>

              <p className="admin-log-message">{log.msg}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
