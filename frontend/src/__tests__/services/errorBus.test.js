import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  detectErrorCode,
  normalizeError,
  emitError,
  subscribeError,
} from '../../services/errorBus';

describe('detectErrorCode', () => {
  it('網路錯誤 → E001', () => {
    const err = new Error('Failed to fetch');
    err.isNetworkError = true;
    expect(detectErrorCode(err)).toBe('E001');
  });

  it('HTTP 狀態錯誤 → E005（後端運行錯誤）', () => {
    const err = new Error('bad');
    err.status = 500;
    err.detail = 'Internal Server Error';
    expect(detectErrorCode(err)).toBe('E005');
  });

  it('錯誤內容含資料庫字眼 → E002', () => {
    const err = new Error('bad');
    err.status = 500;
    err.detail = 'MongoDB connection failed';
    expect(detectErrorCode(err)).toBe('E002');
  });

  it('錯誤內容含儲存字眼 → E003', () => {
    const err = new Error('bad');
    err.status = 500;
    err.detail = 'storage full';
    expect(detectErrorCode(err)).toBe('E003');
  });

  it('已帶明碼則採用該碼', () => {
    const err = new Error('x');
    err.code = 'E004';
    expect(detectErrorCode(err)).toBe('E004');
  });

  it('無任何線索 → E006（未知錯誤）', () => {
    expect(detectErrorCode(null)).toBe('E006');
    expect(detectErrorCode(new Error('random'))).toBe('E006');
  });
});

describe('normalizeError', () => {
  it('回傳 code / title / message 結構', () => {
    const err = new Error('boom');
    err.status = 403;
    err.detail = 'Forbidden';
    expect(normalizeError(err)).toEqual({
      code: 'E005',
      title: '後端運行錯誤',
      message: 'Forbidden',
    });
  });
});

describe('emitError / subscribeError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('發布錯誤會通知所有訂閱者並回傳正規化結果', () => {
    const listener = vi.fn();
    subscribeError(listener);

    const err = new Error('no network');
    err.isNetworkError = true;
    const result = emitError(err);

    expect(result.code).toBe('E001');
    expect(listener).toHaveBeenCalledWith(result);
  });
});
