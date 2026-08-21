// Thin API client for the CCM backend.
// Base URL comes from VITE_API_BASE_URL (separated deployment); write
// operations are authenticated with a shared token kept in localStorage.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = import.meta.env.API_TOKEN || '';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) {
    headers.set('x-api-token', token);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    method: options.method || 'GET',
    headers
  });

  if (!response.ok) {
    const error = new Error(`API request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function ping() {
  return request('/api/ping');
}

export async function saveCard(payload) {
  return request('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function loadCard(id) {
  return request(`/api/cards/${encodeURIComponent(id)}`);
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const data = await request('/api/uploads', {
    method: 'POST',
    body: formData
  });

  return `${BASE_URL}${data.url}`;
}
