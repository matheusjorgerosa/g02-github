import React, { useState, useEffect } from 'react';
import { apiFetch, apiPost } from '../services/api';

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

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="venus-title" style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, color: 'var(--text-main)'}}>
            Gerenciar Usuários
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)'}}>
            Controle de acesso e permissões de usuários do sistema.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Novo Usuário
        </button>
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
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nome</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum usuário encontrado.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id || user.ID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{user.name}</td>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        backgroundColor: user.role === 'admin' ? 'var(--primary-color)22' : 'var(--border-color)',
                        color: user.role === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)'
                      }}>
                        {String(user.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                        <span style={{ color: user.is_active !== false ? '#52c41a' : '#ff4d4f' }}>
                            {user.is_active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => handleOpenModal(user)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginRight: '1rem' }}>Editar</button>
                        <button onClick={() => handleDelete(user)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            
            {formError && <div style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.9rem' }}>{formError}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Senha</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    required={!editingUser}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Role</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                    />
                    Usuário Ativo
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading} style={{ flex: 1, padding: '0.75rem', background: 'var(--primary-color)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
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
