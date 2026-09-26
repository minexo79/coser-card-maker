import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createImageLayerRenderer } from '../../hooks/useImageLayerRenderer.js';

// 載入即成功的假 Image，讓 render() 能走到裁切圓角的步驟
class MockImage {
  constructor() {
    this.naturalWidth = 100;
    this.naturalHeight = 100;
  }
  set src(value) {
    this._src = value;
    queueMicrotask(() => this.onload?.());
  }
  get src() {
    return this._src;
  }
}

const createCanvas = () => {
  const ctx = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn()
  };
  return { canvas: { getContext: () => ctx }, ctx };
};

const template = (slot) => ({
  canvas: { width: 500, height: 500 },
  imageSlots: [{ key: 'd1', x: 10, y: 20, width: 100, height: 100, ...slot }]
});

const renderWith = async (slot, options) => {
  const { canvas, ctx } = createCanvas();
  await createImageLayerRenderer().render({
    canvas,
    renderTemplate: template(slot),
    imageDatas: { d1: 'blob:photo' },
    imageOffsets: {},
    ...options
  });
  return ctx;
};

describe('createImageLayerRenderer 圓角', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('未強制覆寫時使用圖片槽設定的圓角', async () => {
    const ctx = await renderWith({ radius: 12 }, { radius: undefined, defaultRadius: 32 });
    expect(ctx.roundRect).toHaveBeenCalledWith(10, 20, 100, 100, 12);
  });

  it('圖片槽未設定圓角時使用 defaultRadius', async () => {
    const ctx = await renderWith({}, { radius: undefined, defaultRadius: 32 });
    expect(ctx.roundRect).toHaveBeenCalledWith(10, 20, 100, 100, 32);
  });

  it('圖片槽圓角為 0 時為直角（不套用 defaultRadius）', async () => {
    const ctx = await renderWith({ radius: 0 }, { radius: undefined, defaultRadius: 32 });
    expect(ctx.roundRect).not.toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(10, 20, 100, 100);
  });

  it('radius 為數字時強制覆寫（例如關閉照片圓角 = 0）', async () => {
    const ctx = await renderWith({ radius: 12 }, { radius: 0, defaultRadius: 32 });
    expect(ctx.roundRect).not.toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalled();
  });
});
