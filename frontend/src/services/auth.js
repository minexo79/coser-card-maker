// Auth API client — JWT-based authentication.
// All requests use relative paths; local dev uses Vite proxy, production uses Vercel rewrite.

import { FRONTEND_VERSION, NODE_VERSION } from '../versions.js';
import { emitError } from './errorBus';

const JWT_STORAGE_KEY = 'ccm_jwt';
const USER_STORAGE_KEY = 'ccm_user';

export function getToken() {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(JWT_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

async function authRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(path, {
      ...options,
      method: options.method || 'GET',
      headers,
      credentials: 'same-origin',
    });
  } catch (error) {
    error.isNetworkError = true;
    if (!options.silent) emitError(error);
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Auth request failed with status ${response.status}`);
    error.status = response.status;
    try {
      error.detail = (await response.json()).detail;
    } catch { /* ignore */ }
    if (!options.silent) emitError(error);
    throw error;
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function login(username, password) {
  const data = await authRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function refreshAccessToken() {
  let res;
  try {
    res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch (error) {
    error.isNetworkError = true;
    emitError(error);
    throw error;
  }
  if (!res.ok) {
    clearToken();
    const error = new Error('Token refresh failed');
    error.status = res.status;
    emitError(error);
    throw error;
  }
  const data = await res.json();
  setToken(data.token);
  setStoredUser(data.user);
  return data.token;
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => {});
  clearToken();
}

export async function getMe() {
  return authRequest('/api/auth/me');
}

export async function changePassword(oldPassword, newPassword) {
  return authRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function listUsers() {
  return authRequest('/api/auth/users');
}

export async function createUser(username, password, role = 'user') {
  return authRequest('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  });
}

export async function deleteUser(username) {
  return authRequest(`/api/auth/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

export async function resetUserPassword(username, newPassword) {
  return authRequest(`/api/auth/users/${encodeURIComponent(username)}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  });
}

export async function listAuditLogs(limit = 100) {
  return authRequest(`/api/auth/audit-logs?limit=${limit}`);
}

export async function getSystemStatus() {
  return authRequest('/api/admin/system-status', {
    headers: { 'X-Frontend-Version': FRONTEND_VERSION, 'X-Node-Version': NODE_VERSION },
  });
}
