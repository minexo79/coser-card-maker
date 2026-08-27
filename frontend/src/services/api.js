// Thin API client for the CCM backend.
// All requests use relative paths (/api/..., /uploads/...); local dev uses
// Vite proxy, production uses Vercel rewrite — no hardcoded backend URL needed.
// Write operations are authenticated with a shared token kept in localStorage.
// VITE_API_TOKEN provides the default token at build time; note that any
// VITE_* variable is bundled into the shipped JS and readable by clients.

// Vite 只會暴露 VITE_ 前綴的變數給瀏覽器程式碼。
const ENV_API_TOKEN = import.meta.env.VITE_API_TOKEN || '';
const TOKEN_STORAGE_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ccm_api_token';

// 把資源路徑組合成可載入的網址：
// - 後端資源（以 / 開頭，如 /uploads/x.png）→ 原樣保留（相對路徑，proxy 或 rewrite 處理）。
// - 前端模板內建資源（./img/...）→ 原樣保留，由瀏覽器對前端頁面解析。
// - 已是完整網址（http/https/data/blob）→ 原樣使用（相容舊存的絕對路徑）。
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path;
}

export function getToken() {
  // .env 打包進去的預設 token 優先；否則使用使用者手動輸入（prompt）存的值
  return ENV_API_TOKEN || safeGetStoredToken();
}

function safeGetStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

const JWT_STORAGE_KEY = 'ccm_jwt';

function getJwtToken() {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  // JWT auth (user identity)
  const jwt = getJwtToken();
  if (jwt) {
    headers.set('Authorization', `Bearer ${jwt}`);
  }

  // Legacy shared token (write operations)
  const token = getToken();
  if (token) {
    headers.set('x-api-token', token);
  }

  const response = await fetch(path, {
    ...options,
    method: options.method || 'GET',
    headers
  });

  if (!response.ok) {
    let detail = null;
    try {
      detail = (await response.json()).detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    const error = new Error(detail || `API request failed with status ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  // 204 / empty body (e.g. DELETE) has no JSON to parse.
  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text);
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

  // 回傳相對路徑（/uploads/...），由 proxy 或 rewrite 處理。
  return data.url;
}

export async function getEventTemplates() {
  return request('/api/events');
}

export async function getEventTemplate(eventId) {
  return request(`/api/events/${encodeURIComponent(eventId)}`);
}

export async function saveEventTemplate(eventId, template) {
  return request(`/api/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  });
}

export async function deleteEventTemplate(eventId) {
  return request(`/api/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE'
  });
}
