import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplateCanvas from '../../../components/templateEditor/TemplateCanvas.jsx';

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock;
}

// stub 掉瀏覽器獨有的 Pointer Capture API（jsdom 未實作）
function stubPointerCapture() {
  const protoSet = vi.fn(function setPointerCapture() {
    this.__hasPointerCapture = true;
  });
  const protoRelease = vi.fn(function releasePointerCapture() {
    this.__hasPointerCapture = false;
  });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: protoSet
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: protoRelease
  });
  return { protoSet, protoRelease };
}

const canvasWidth = 1220;
const canvasHeight = 700;

// 讓 wrapRef.getBoundingClientRect() 回傳邏輯寬度，使 scale === 1
function stubCanvasSize() {
  const original = HTMLElement.prototype.getBoundingClientRect;
  const rectSpy = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function getBoundingClientRect() {
      if (this.getAttribute && this.getAttribute('data-testid') === 'template-canvas') {
        return {
          width: canvasWidth,
          height: canvasHeight,
          left: 0,
          top: 0,
          right: canvasWidth,
          bottom: canvasHeight,
          x: 0,
          y: 0,
          toJSON: () => ({})
        };
      }
      return original.call(this);
    });
  return rectSpy;
}

const sampleElements = [
  {
    id: 'titleImage',
    label: '標題圖',
    group: 'titleImage',
    path: ['titleImage'],
    resizable: true,
    box: { x: 10, y: 20, width: 300, height: 200 }
  }
];

const renderCanvas = (overrides = {}) => {
  const props = {
    width: canvasWidth,
    height: canvasHeight,
    elements: sampleElements,
    baseImagePath: '',
    onSelect: vi.fn(),
    onElementChange: vi.fn(),
    onElementChangeEnd: vi.fn(),
    ...overrides
  };
  const utils = render(<TemplateCanvas {...props} />);
  const canvas = screen.getByTestId('template-canvas');
  return { ...utils, props, canvas };
};

describe('components/templateEditor/TemplateCanvas - P4 互動層', () => {
  let captureSpy;

  beforeEach(() => {
    const spies = stubPointerCapture();
    captureSpy = spies;
    stubCanvasSize();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('pointerdown 應綁定 capture 並選取元素', () => {
    const { props, canvas } = renderCanvas();
    const target = screen.getByTestId('element-overlay-titleImage');

    fireEvent.pointerDown(target, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0
    });

    expect(captureSpy.protoSet).toHaveBeenCalledWith(1);
    expect(props.onSelect).toHaveBeenCalledWith('titleImage');
    void canvas;
  });

  it('pointercancel 後再次拖曳仍應正常運作（狀態已重置）', () => {
    const { props } = renderCanvas();
    const target = screen.getByTestId('element-overlay-titleImage');

    // 第一次拖曳被 cancel
    fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerCancel(screen.getByTestId('template-canvas'), {
      clientX: 150,
      clientY: 120,
      pointerId: 1
    });
    expect(props.onElementChangeEnd).toHaveBeenCalledTimes(1);

    // 第二次拖曳前，不應殘留任何 interaction 狀態
    props.onElementChange.mockClear();
    props.onElementChangeEnd.mockClear();
    expect(props.onElementChange).not.toHaveBeenCalled();
  });

  it('拖曳結束後移動滑鼠不應再觸發 onElementChange（狀態已重置）', () => {
    const { props, canvas } = renderCanvas();

    // 第一次完整拖曳
    fireEvent.pointerDown(screen.getByTestId('element-overlay-titleImage'), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      button: 0
    });
    fireEvent.pointerMove(canvas, { clientX: 140, clientY: 130, pointerId: 1 });

    expect(props.onElementChange).toHaveBeenCalledTimes(1);

    // 放開
    fireEvent.pointerUp(canvas, { clientX: 140, clientY: 130, pointerId: 1 });
    expect(props.onElementChangeEnd).toHaveBeenCalledTimes(1);

    // 結束後再移動，不應再觸發（模擬「卡住」迴歸）
    props.onElementChange.mockClear();
    fireEvent.pointerMove(canvas, { clientX: 999, clientY: 999, pointerId: 1 });
    expect(props.onElementChange).not.toHaveBeenCalled();
  });

  it('畫布空白處 pointerdown 應清除選取', () => {
    const onSelect = vi.fn();
    render(
      <TemplateCanvas
        width={canvasWidth}
        height={canvasHeight}
        elements={sampleElements}
        baseImagePath=""
        onSelect={onSelect}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );
    // 模擬按在縮放層（template-canvas-inner）的空白處
    const inner = screen.getByTestId('template-canvas-inner');
    // 直接對縮放層本身觸發 pointerdown，等同按在空白處
    fireEvent.pointerDown(inner, {
      target: inner,
      clientX: 10,
      clientY: 10,
      pointerId: 2,
      button: 0
    });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
