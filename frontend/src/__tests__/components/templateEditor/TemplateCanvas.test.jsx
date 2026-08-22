import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateCanvas from '../../../components/templateEditor/TemplateCanvas.jsx';

// 避免 ResizeObserver 在 jsdom 未定義
class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock;
}

describe('components/templateEditor/TemplateCanvas', () => {
  beforeEach(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  const sampleElements = [
    {
      id: 'titleImage',
      label: '標題圖 (titleImage)',
      group: 'titleImage',
      path: ['titleImage'],
      resizable: true,
      box: { x: 10, y: 20, width: 300, height: 200 }
    },
    {
      id: 'imageSlots.0',
      label: '圖片槽 1 (第一天)',
      group: 'imageSlots',
      path: ['imageSlots', 0],
      resizable: true,
      box: { x: 390, y: 83, width: 439, height: 532 }
    }
  ];

  it('應渲染所有元素與其標籤', () => {
    render(
      <TemplateCanvas
        width={1220}
        height={700}
        elements={sampleElements}
        baseImagePath=""
        onSelect={vi.fn()}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );

    expect(screen.getByTestId('template-canvas')).toBeTruthy();
    expect(screen.getByTestId('element-overlay-titleImage')).toBeTruthy();
    expect(screen.getByTestId('element-overlay-imageSlots.0')).toBeTruthy();
    // 標籤應顯示
    expect(screen.getByText('標題圖 (titleImage)')).toBeTruthy();
  });

  it('未上傳底圖時顯示佔位提示', () => {
    render(
      <TemplateCanvas
        width={1220}
        height={700}
        elements={[]}
        baseImagePath=""
        onSelect={vi.fn()}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );
    expect(screen.getByText(/尚未上傳底圖/)).toBeTruthy();
  });

  it('點擊元素應觸發 onSelect', () => {
    const onSelect = vi.fn();
    render(
      <TemplateCanvas
        width={1220}
        height={700}
        elements={sampleElements}
        baseImagePath=""
        onSelect={onSelect}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );

    fireEvent.pointerDown(screen.getByTestId('element-overlay-titleImage'), {
      clientX: 100,
      clientY: 100,
      button: 0
    });

    expect(onSelect).toHaveBeenCalledWith('titleImage');
  });

  it('未選取元素時不會渲染縮放把手', () => {
    render(
      <TemplateCanvas
        width={1220}
        height={700}
        elements={sampleElements}
        baseImagePath=""
        onSelect={vi.fn()}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );
    // 無選取時不應有把手
    expect(screen.queryByTestId('resize-handle-se')).toBeNull();
  });

  it('選取元素時顯示縮放把手', () => {
    render(
      <TemplateCanvas
        width={1220}
        height={700}
        elements={sampleElements}
        selectedId="titleImage"
        baseImagePath=""
        onSelect={vi.fn()}
        onElementChange={vi.fn()}
        onElementChangeEnd={vi.fn()}
      />
    );
    expect(screen.getByTestId('resize-handle-se')).toBeTruthy();
  });
});
