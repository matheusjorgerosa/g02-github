import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Icons from './Icons';

export default function AdminUsersPage({ t }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', is_active: true });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/admin/users');
      if (!res.ok) throw new Error('Falha ao carregar usuários');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (user = null) => {
    setFormError('');
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'user', is_active: user.is_active !== false });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'user', is_active: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        // Update (PUT /admin/users/:id)
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active
        };
        const res = await apiFetch(`/admin/users/${editingUser.id || editingUser.ID}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errBody = await res.json().catch(()=>({}));
            throw new Error(errBody.error || 'Erro ao atualizar usuário');
        }
      } else {
        // Create (POST /admin/users)
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        const res = await apiFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errBody = await res.json().catch(()=>({}));
            throw new Error(errBody.error || 'Erro ao criar usuário');
        }
      }

      await loadUsers();
      handleCloseModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) return;
    try {
      const res = await apiFetch(`/admin/users/${user.id || user.ID}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === 'admin').length;
  const activeUsers = users.filter((u) => u.is_active !== false).length;

  return (
    <div className="campaigns-page admin-page" role="main">
      <div className="campaigns-header">
        <p className="campaigns-greeting">{t.hello}</p>
        <h1 className="campaigns-title">Gerenciamento de Usuários</h1>
      </div>

      <div className="campaigns-stats-row" role="region" aria-label="Resumo de usuários">
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Users /></span>
          <div>
            <div className="campaigns-stat-label">Total de usuários</div>
            <div className="campaigns-stat-value">{totalUsers}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Settings /></span>
          <div>
            <div className="campaigns-stat-label">Administradores</div>
            <div className="campaigns-stat-value">{admins}</div>
          </div>
        </div>
        <div className="campaigns-stat-card">
          <span className="campaigns-stat-icon"><Icons.Check /></span>
          <div>
            <div className="campaigns-stat-label">Usuários ativos</div>
            <div className="campaigns-stat-value">{activeUsers}</div>
          </div>
        </div>
      </div>

      <div className="campaigns-toolbar">
        <p className="admin-page-subtitle">Controle de acesso e permissões de usuários do sistema.</p>
        <button className="campaigns-new-btn" onClick={() => handleOpenModal()}>
          + Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="admin-page-empty">{t?.loading || 'Carregando...'}</div>
      ) : error ? (
        <div className="admin-page-error">{error}</div>
      ) : (
        <div className="campaigns-list" role="list">
          {users.length === 0 ? (
            <div className="admin-page-empty">Nenhum usuário encontrado.</div>
          ) : users.map((user) => (
            <article key={user.id || user.ID} className="campaign-card admin-user-card" role="listitem">
              <div className="campaign-card-left">
                <div className="campaign-card-title-row">
                  <span className="campaign-card-name">{user.name}</span>
                  <span className={`campaign-status-badge ${user.is_active !== false ? 'ativa' : 'finalizada'}`}>
                    {user.is_active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="campaign-meta">
                  <span className="campaign-meta-item">{user.email}</span>
                  <span className="campaign-meta-item">
                    Perfil: <strong>{String(user.role || 'user').toUpperCase()}</strong>
                  </span>
                </div>
              </div>

              <div className="campaign-card-right">
                <div className="campaign-actions">
                  <button className="campaign-btn edit" onClick={() => handleOpenModal(user)}>
                    Editar
                  </button>
                  <button className="campaign-btn admin-danger-btn" onClick={() => handleDelete(user)}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="campaign-modal-overlay">
          <div className="campaign-modal admin-modal">
            <button className="campaign-modal-close" onClick={handleCloseModal} aria-label="Fechar">✕</button>

            <div>
              <h3 className="campaign-modal-title">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <p className="campaign-modal-subtitle">Defina perfil e permissões de acesso</p>
            </div>

            {formError && <div className="admin-page-error">{formError}</div>}

            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="campaign-modal-field">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="campaign-modal-field">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {!editingUser && (
                <div className="campaign-modal-field">
                  <label>Senha</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="campaign-modal-field">
                <label>Perfil</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {editingUser && (
                <label className="admin-active-check">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Usuário ativo
                </label>
              )}

              <div className="admin-modal-actions">
                <button type="button" className="campaign-btn edit" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="campaign-btn view" disabled={formLoading}>
                  {formLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
