import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCardMaker } from '../../hooks/useCardMaker';
import { CARD_TEMPLATES } from '../../models/cardTemplates';

class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL() {
    if (this.onload) {
      this.onload({
        target: {
          result: 'data:image/png;base64,mock-d1'
        }
      });
    }
  }
}

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
  clip: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  fillRect: vi.fn(),
  measureText: vi.fn((text) => ({ width: String(text).length * 10 })),
  fillStyle: '',
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic'
});

describe('useCardMaker - Phase 2', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('FileReader', MockFileReader);
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

  it('handleImageUpload(d1) 只更新 imageDatas.d1', async () => {
    const { result } = renderHook(() => useCardMaker());
    const file = new File(['x'], 'demo.png', { type: 'image/png' });

    act(() => {
      result.current.handleImageUpload(file, 'd1');
    });

    await waitFor(() => {
      expect(result.current.imageDatas.d1).toBe('data:image/png;base64,mock-d1');
    });

    expect(result.current.imageDatas.d2).toBeNull();
  });

  it('updateDayDetail(d2, date, value) 應更新正確欄位', () => {
    const { result } = renderHook(() => useCardMaker());

    act(() => {
      result.current.updateDayDetail('d2', 'date', '2026-04-01');
    });

    expect(result.current.dayDetails.d2.date).toBe('2026-04-01');
    expect(result.current.dayDetails.d1.date).toBe('');
  });
});

describe('天數切換', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('FileReader', MockFileReader);
    vi.stubGlobal('Image', MockImage);
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

    act(() => {
      result.current.canvasRef.current = canvas;
    });

    const file = new File(['x'], 'demo.png', { type: 'image/png' });
    act(() => {
      result.current.handleImageUpload(file, 'd1');
    });

    expect(result.current.imageDatas.d1).toBeTruthy();

    await act(async () => {
      result.current.renderCanvas();
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    const userImageCalls = ctx.drawImage.mock.calls.filter((args) => args[0]?.__imageKind === 'user');
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

    act(() => {
      result.current.canvasRef.current = canvas;
      result.current.setDayCount(2);
    });

    const file = new File(['x'], 'demo.png', { type: 'image/png' });
    act(() => {
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

    const userImageCalls = ctx.drawImage.mock.calls.filter((args) => args[0]?.__imageKind === 'user');
    expect(userImageCalls).toHaveLength(2);
  });
});
