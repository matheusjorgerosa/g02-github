import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export default function AdminLogsPage({ t }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await apiFetch('/admin/logs');
        if (!res.ok) throw new Error('Falha ao carregar logs');
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
      <header>
        <h2 className="venus-title" style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, color: 'var(--text-main)'}}>
          Logs do Sistema
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)'}}>
          Histórico de eventos e erros do backend.
        </p>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t?.loading || 'Carregando...'}</div>
      ) : error ? (
        <div style={{ padding: '2rem', backgroundColor: '#ff4d4f22', color: '#ff4d4f', borderRadius: 'var(--radius)', border: '1px solid #ff4d4f' }}>
          {error}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nível</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum log encontrado.</td></tr>
                ) : logs.map((log, i) => {
                  const ts = log.T || log.ts || log.timestamp;
                  const level = String(log.L || log.level || 'info').toLowerCase();
                  const msg = log.M || log.msg || log.message || JSON.stringify(log);
                  
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{ts ? new Date(ts).toLocaleString() : '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          backgroundColor: (level === 'error' || level === 'fatal') ? '#ff4d4f22' : level === 'warn' ? '#faad1422' : '#52c41a22',
                          color: (level === 'error' || level === 'fatal') ? '#ff4d4f' : level === 'warn' ? '#faad14' : '#52c41a'
                        }}>
                          {level.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{msg}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
