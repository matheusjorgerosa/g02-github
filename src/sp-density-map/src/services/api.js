// Camada de serviço para comunicação com o backend

const TOKEN_KEY = 'venus-token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

// Tratamento de erros seguro para o caso do servidor retornar HTML (ex: Fallback do SPA)
async function parseResponse(res, defaultErrorMsg) {
  if (!res.ok) {
    let errorMsg = defaultErrorMsg;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      errorMsg = data.error || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // Se o backend retornar 200 OK mas não for JSON (ex: index.html do front), é um erro de rota
    throw new Error('Erro de conexão com a API: O servidor não retornou dados válidos.');
  }

  return res.json();
}

// Faz login e salva o token
export async function apiLogin(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(res, 'Erro ao fazer login');
  
  if (data.token) {
    setToken(data.token);
  } else {
    throw new Error('Token não recebido');
  }
  return data;
}

// Faz cadastro público
export async function apiSignup(name, email, password) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  return parseResponse(res, 'Erro ao fazer cadastro');
}

// Fetch genérico que injeta o token JWT automaticamente
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Se o backend retornar 401, token expirou ou é inválido
  if (res.status === 401) {
    removeToken();
    window.location.reload();
    return res;
  }

  return res;
}

// Atalho para POST com body JSON
export async function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

