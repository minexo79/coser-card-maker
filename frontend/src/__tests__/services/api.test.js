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

  it('uploadImage(file) 應以 FormData POST /api/uploads，並回傳補上 BASE_URL 的圖片網址', async () => {
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
    expect(url).toBe('http://api.test:8000/uploads/a.png');
  });
});
