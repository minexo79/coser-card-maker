// Thin API client for the CCM backend.
// All requests use relative paths (/api/..., /uploads/...); local dev uses
// Vite proxy, production uses Vercel rewrite — no hardcoded backend URL needed.
// Write operations are authenticated via JWT Bearer tokens.
// Automatic refresh: when a 401 is received, the client attempts to refresh
// the access token using the httpOnly refresh token cookie.

import { getToken, clearToken, refreshAccessToken } from './auth';
import { emitError } from './errorBus';

// 把資源路徑組合成可載入的網址：
// - 後端資源（以 / 開頭，如 /uploads/x.png）→ 原樣保留（相對路徑，proxy 或 rewrite 處理）。
// - 前端模板內建資源（./img/...）→ 原樣保留，由瀏覽器對前端頁面解析。
// - 已是完整網址（http/https/data/blob）→ 原樣使用（相容舊存的絕對路徑）。
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path;
}

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(path, {
      ...options,
      method: options.method || 'GET',
      headers,
    });
  } catch (error) {
    // 網路層失敗：後端連不上 → E001
    error.isNetworkError = true;
    if (!options.silent) emitError(error);
    throw error;
  }

  // If 401 and we have a stored token, try refresh
  if (response.status === 401 && token && !path.includes('/api/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        processQueue(null, newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(path, { ...options, headers });
      } catch (err) {
        processQueue(err);
        isRefreshing = false;
        clearToken();
        window.location.href = '/login';
        throw err;
      }
    }
    // Queue concurrent requests while refreshing
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          resolve(fetch(path, { ...options, headers }));
        },
        reject,
      });
    });
  }

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
    if (!options.silent) emitError(error);
    throw error;
  }

  // 204 / empty body (e.g. DELETE) has no JSON to parse.
  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text);
}

export async function ping(options = {}) {
  return request('/api/ping', options);
}

export async function saveCard(payload, options = {}) {
  return request('/api/cards', {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function loadCard(id, options = {}) {
  return request(`/api/cards/${encodeURIComponent(id)}`, options);
}

export async function uploadImage(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const data = await request('/api/uploads', {
    ...options,
    method: 'POST',
    body: formData
  });

  // 回傳相對路徑（/uploads/...），由 proxy 或 rewrite 處理。
  return data.url;
}

export async function getEventTemplates() {
  return request('/api/events');
}

export async function getEventList(options = {}) {
  return request('/api/events/list', options);
}

export async function getEventTemplate(eventId, options = {}) {
  return request(`/api/events/${encodeURIComponent(eventId)}`, options);
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
