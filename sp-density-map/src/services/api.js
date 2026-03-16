// Camada de serviço para comunicação com o backend

const TOKEN_KEY = 'venus-token';

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

// Faz login e salva o token
export async function apiLogin(email, password) {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao fazer login');
  }

  const data = await res.json();
  setToken(data.token);
  return data;
}

// Faz cadastro público
export async function apiSignup(name, email, password) {
  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao fazer cadastro');
  }

  return res.json();
}

// Fetch genérico que injeta o token JWT automaticamente
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(path, {
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
