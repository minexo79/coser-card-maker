import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

describe('services/api', () => {
  let fetchMock;

  beforeEach(() => {
    localStorage.clear();
    // 讓各測試不依賴本機 .env 的 VITE_API_BASE_URL，測試內再視需要自行 stub
    vi.stubEnv('VITE_API_BASE_URL', '');
    // 隔離本機 .env 的預設 token，避免影響 header 相關斷言
    vi.stubEnv('VITE_API_TOKEN', '');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const setupApi = async () => {
    const mod = await import('../../services/api.js');
    return mod;
  };

  it('ping() 應以 GET 呼叫 /api/ping', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }));
    const api = await setupApi();

    await api.ping();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/ping');
    expect(init.method).toBe('GET');
  });

  it('saveCard() 應以 POST JSON 呼叫 /api/cards，並帶 x-api-token header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'abc123' }, 201));
    const api = await setupApi();
    api.setToken('secret-token');

    const payload = { dayCount: 2 };
    const result = await api.saveCard(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(result).toEqual({ id: 'abc123' });
    expect(url).toBe('/api/cards');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('x-api-token')).toBe('secret-token');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('loadCard(id) 應 GET /api/cards/{id}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'abc123', payload: {} }));
    const api = await setupApi();

    await api.loadCard('abc123');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/cards/abc123');
  });

  it('uploadImage(file) 應以 FormData POST /api/uploads，並回傳相對路徑（不含 BASE_URL）', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ url: '/uploads/abc.png' }));
    const api = await setupApi();
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    const url = await api.uploadImage(file);

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('/api/uploads');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(url).toBe('/uploads/abc.png');
  });

  it('未帶 token 時不應有 x-api-token header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'x' }, 201));
    const api = await setupApi();

    await api.saveCard({});

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get('x-api-token')).toBeNull();
  });

  it('VITE_API_TOKEN 應作為預設 token（localStorage 無值時）', async () => {
    vi.stubEnv('VITE_API_TOKEN', 'env-token');
    fetchMock.mockResolvedValue(jsonResponse({ id: 'x' }, 201));
    const api = await setupApi();

    expect(api.getToken()).toBe('env-token');

    await api.saveCard({});
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get('x-api-token')).toBe('env-token');
  });

  it('VITE_API_TOKEN 存在時應優先於 localStorage 手動輸入的 token', async () => {
    vi.stubEnv('VITE_API_TOKEN', 'env-token');
    const api = await setupApi();
    api.setToken('manual-token');

    expect(api.getToken()).toBe('env-token');
  });

  it('VITE_API_TOKEN 未設定時應使用 localStorage 手動輸入的 token', async () => {
    const api = await setupApi();
    api.setToken('manual-token');

    expect(api.getToken()).toBe('manual-token');

    fetchMock.mockResolvedValue(jsonResponse({ id: 'x' }, 201));
    await api.saveCard({});
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get('x-api-token')).toBe('manual-token');
  });

  it('HTTP 錯誤應拋出帶 status 屬性的錯誤', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Unauthorized' }, 401));
    const api = await setupApi();

    await expect(api.ping()).rejects.toMatchObject({ status: 401 });
  });

  it('VITE_API_BASE_URL 應作為所有請求的前綴', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test:8000');
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }));
    const api = await setupApi();

    await api.ping();

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test:8000/api/ping');

    fetchMock.mockResolvedValue(jsonResponse({ url: '/uploads/a.png' }));
    const url = await api.uploadImage(new File(['x'], 'a.png', { type: 'image/png' }));
    expect(url).toBe('/uploads/a.png');
  });

  describe('resolveAssetUrl', () => {
    it('以 / 開頭的後端資源應補上 BASE_URL', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test:8000');
      const api = await setupApi();

      expect(api.resolveAssetUrl('/uploads/a.png')).toBe('http://api.test:8000/uploads/a.png');
    });

    it('BASE_URL 未設定時應原樣保留相對路徑', async () => {
      const api = await setupApi();

      expect(api.resolveAssetUrl('/uploads/a.png')).toBe('/uploads/a.png');
    });

    it('前端模板內建資源（./img/...）不應補 BASE_URL', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://api.test:8000');
      const api = await setupApi();

      expect(api.resolveAssetUrl('./img/card_base_1p.png')).toBe('./img/card_base_1p.png');
    });

    it('完整網址（http/data/blob）與空值應原樣處理', async () => {
      const api = await setupApi();

      expect(api.resolveAssetUrl('https://cdn.test/x.png')).toBe('https://cdn.test/x.png');
      expect(api.resolveAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
      expect(api.resolveAssetUrl('blob:http://x/y')).toBe('blob:http://x/y');
      expect(api.resolveAssetUrl('')).toBe('');
      expect(api.resolveAssetUrl(null)).toBe('');
    });
  });

  it('getEventTemplates() 應以 GET 呼叫 /api/events', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ fgzc01: { dayCount: 2 } }));
    const api = await setupApi();

    const result = await api.getEventTemplates();

    const [url, init] = fetchMock.mock.calls[0];
    expect(result).toEqual({ fgzc01: { dayCount: 2 } });
    expect(url).toBe('/api/events');
    expect(init.method).toBe('GET');
  });

  it('getEventTemplate(id) 應 GET /api/events/{id}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ dayCount: 2 }));
    const api = await setupApi();

    await api.getEventTemplate('fgzc01');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/events/fgzc01');
  });

  it('saveEventTemplate(id, template) 應以 PUT JSON 呼叫 /api/events/{id}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ dayCount: 1 }));
    const api = await setupApi();
    api.setToken('secret-token');

    const template = { dayCount: 1, startDate: '2026-05-23', overWriteCanvas: {} };
    await api.saveEventTemplate('demo', template);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/events/demo');
    expect(init.method).toBe('PUT');
    expect(new Headers(init.headers).get('x-api-token')).toBe('secret-token');
    expect(init.body).toBe(JSON.stringify(template));
  });

  it('deleteEventTemplate(id) 應以 DELETE 呼叫 /api/events/{id}', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const api = await setupApi();

    await api.deleteEventTemplate('demo');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/events/demo');
    expect(init.method).toBe('DELETE');
  });
});
