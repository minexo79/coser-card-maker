import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCardMaker } from '../../hooks/useCardMaker';
import { CARD_TEMPLATES } from '../../models/cardTemplates';
import { uploadImage, saveCard } from '../../services/api';

vi.mock('../../services/api', () => ({
  uploadImage: vi.fn(),
  saveCard: vi.fn(),
  loadCard: vi.fn(),
  getToken: vi.fn(() => 'test-token'),
  setToken: vi.fn(),
  resolveAssetUrl: vi.fn((path) => path)
}));

class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.complete = true;
    this.naturalWidth = 1000;
    this.naturalHeight = 1000;
    this.__imageKind = 'user';
  }

  set src(value) {
    this._src = value;
    this.__imageKind = String(value).includes('/img/card_base_') ? 'base' : 'user';
    if (this.onload) {
      this.onload();
    }
  }

  get src() {
    return this._src;
  }
}

const createMockCanvasContext = () => ({
  drawImage: vi.fn(),
  save: vi.fn(),
  beginPath: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  clip: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  fillText: vi.fn(),
  fillRect: vi.fn(),
  stroke: vi.fn(),
  measureText: vi.fn((text) => ({ width: String(text).length * 10 })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic'
});

describe('useCardMaker - Phase 2', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    uploadImage.mockResolvedValue('/uploads/mock-image.png');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('dayCount 切換時，getCurrentTemplate 應回傳正確模板', () => {
    const { result } = renderHook(() => useCardMaker());

    expect(result.current.dayCount).toBe(1);
    expect(result.current.getCurrentTemplate()).toBe(CARD_TEMPLATES['1p']);

    act(() => {
      result.current.setDayCount(2);
    });

    expect(result.current.dayCount).toBe(2);
    expect(result.current.getCurrentTemplate()).toBe(CARD_TEMPLATES['2p']);
  });

  it('handleImageUpload(d1) 只更新 imageDatas.d1，且不上傳後端', async () => {
    const { result } = renderHook(() => useCardMaker());
    const file = new File(['x'], 'demo.png', { type: 'image/png' });

    await act(async () => {
      result.current.handleImageUpload(file, 'd1');
    });

    await waitFor(() => {
      expect(result.current.imageDatas.d1).toMatch(/^blob:/);
    });

    expect(result.current.imageDatas.d2).toBeNull();
    // 每日照片不應上傳後端
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('updateDayDetail(d2, date, value) 應更新正確欄位', () => {
    const { result } = renderHook(() => useCardMaker());

    act(() => {
      result.current.updateDayDetail('d2', 'date', '2026-04-01');
    });

    expect(result.current.dayDetails.d2.date).toBe('2026-04-01');
    expect(result.current.dayDetails.d1.date).toBe('');
  });

  it('roundedCorners 預設為 false，且可切換', () => {
    const { result } = renderHook(() => useCardMaker());

    expect(result.current.roundedCorners).toBe(false);

    act(() => {
      result.current.setRoundedCorners(true);
    });
    expect(result.current.roundedCorners).toBe(true);
  });

  it('handleBaseImageUpload 後 getCurrentTemplate 應以上傳底圖覆蓋 baseImagePath', async () => {
    const { result } = renderHook(() => useCardMaker());
    const file = new File(['x'], 'base.png', { type: 'image/png' });

    await act(async () => {
      result.current.handleBaseImageUpload(file);
    });

    await waitFor(() => {
      expect(result.current.getCurrentTemplate()).toMatchObject({
        baseImagePath: '/uploads/mock-image.png'
      });
    });
  });

  it('上傳活動底圖後儲存，payload.overWriteCanvas.baseImagePath 應為上傳的圖片 URL', async () => {
    localStorage.setItem('ccm_jwt', 'test-jwt-token');
    saveCard.mockResolvedValue({ id: 'card-1' });

    const { result } = renderHook(() => useCardMaker());
    const file = new File(['x'], 'base.png', { type: 'image/png' });

    await act(async () => {
      result.current.handleBaseImageUpload(file);
    });

    await act(async () => {
      await result.current.saveCard();
    });

    expect(saveCard).toHaveBeenCalledTimes(1);
    const payload = saveCard.mock.calls[0][0];
    expect(payload.overWriteCanvas.baseImagePath).toBe('/uploads/mock-image.png');
  });
});

describe('天數切換', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('Image', MockImage);
    uploadImage.mockResolvedValue('/uploads/mock-image.png');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('1p 模板時，應只繪製 1 張使用者圖片', async () => {
    const { result } = renderHook(() => useCardMaker());
    const ctx = createMockCanvasContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock')
    };
    const layerCtx = createMockCanvasContext();
    const layerCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => layerCtx)
    };

    act(() => {
      result.current.canvasRef.current = canvas;
      result.current.imageLayerRef.current = layerCanvas;
    });

    const file = new File(['x'], 'demo.png', { type: 'image/png' });
    await act(async () => {
      result.current.handleImageUpload(file, 'd1');
    });

    expect(result.current.imageDatas.d1).toBeTruthy();

    await act(async () => {
      result.current.renderCanvas();
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    const userImageCalls = layerCtx.drawImage.mock.calls.filter((args) => args[0]?.__imageKind === 'user');
    expect(userImageCalls).toHaveLength(1);
  });

  it('2p 模板時，應繪製 2 張使用者圖片', async () => {
    const { result } = renderHook(() => useCardMaker());
    const ctx = createMockCanvasContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock')
    };
    const layerCtx = createMockCanvasContext();
    const layerCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => layerCtx)
    };

    act(() => {
      result.current.canvasRef.current = canvas;
      result.current.imageLayerRef.current = layerCanvas;
      result.current.setDayCount(2);
    });

    const file = new File(['x'], 'demo.png', { type: 'image/png' });
    await act(async () => {
      result.current.handleImageUpload(file, 'd1');
      result.current.handleImageUpload(file, 'd2');
    });

    expect(result.current.imageDatas.d1).toBeTruthy();
    expect(result.current.imageDatas.d2).toBeTruthy();

    await act(async () => {
      result.current.renderCanvas();
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    const userImageCalls = layerCtx.drawImage.mock.calls.filter((args) => args[0]?.__imageKind === 'user');
    expect(userImageCalls).toHaveLength(2);
  });
});
