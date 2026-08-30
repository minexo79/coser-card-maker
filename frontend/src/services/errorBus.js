// 全域錯誤匯流排：純 JS 模組（不依賴 React），供 api.js / auth.js / ErrorBoundary
// 在捕捉到錯誤時發布事件，由 ErrorProvider 監聽並以彈窗顯示。

import { ERROR_CODES } from '../utils/errorCodes';

const listeners = new Set();

export function subscribeError(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function detectErrorCode(error) {
  if (!error) return 'E006';
  if (error.code && ERROR_CODES[error.code]) return error.code;
  if (error.isNetworkError) return 'E001';
  if (error.status) {
    const detail = String(error.detail || error.message || '').toLowerCase();
    if (/mongodb|\bdatabase\b|資料庫|資料庫連線/.test(detail)) return 'E002';
    if (/storage|upload|儲存空間|儲存/.test(detail)) return 'E003';
    return 'E005';
  }
  return 'E006';
}

export function normalizeError(error) {
  const code = detectErrorCode(error);
  return {
    code,
    title: ERROR_CODES[code] || ERROR_CODES.E006,
    message: error?.detail || error?.message || '',
  };
}

export function emitError(error) {
  const normalized = normalizeError(error);
  listeners.forEach((listener) => listener(normalized));
  return normalized;
}
