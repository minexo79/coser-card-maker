import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePointerDrag } from '../../../components/templateEditor/usePointerDrag.js';

afterEach(() => {
  cleanup();
});

const makeEvent = (overrides = {}) => ({
  clientX: 0,
  clientY: 0,
  pointerId: 1,
  currentTarget: null,
  ...overrides
});

describe('hooks/usePointerDrag', () => {
  it('未開始拖曳時 move/end 回傳 null', () => {
    const { result } = renderHook(() => usePointerDrag());
    expect(result.current.move(makeEvent())).toBeNull();
    expect(result.current.end(makeEvent())).toBeNull();
    expect(result.current.isDragging()).toBe(false);
  });

  it('start 後 move 回傳自起點的累計位移', () => {
    const { result } = renderHook(() => usePointerDrag());
    const meta = { id: 'box', mode: 'move' };

    act(() => {
      result.current.start(makeEvent({ clientX: 100, clientY: 50 }), meta);
    });

    expect(result.current.isDragging()).toBe(true);

    const delta = result.current.move(makeEvent({ clientX: 180, clientY: 25 }));
    expect(delta.dx).toBe(80);
    expect(delta.dy).toBe(-25);
    expect(delta.deltaX).toBe(80);
    expect(delta.deltaY).toBe(-25);
    expect(delta.meta).toEqual(meta);
  });

  it('start 會對 currentTarget 呼叫 setPointerCapture', () => {
    const setCapture = vi.fn();
    const { result } = renderHook(() => usePointerDrag());

    act(() => {
      result.current.start(makeEvent({ pointerId: 7, currentTarget: { setPointerCapture: setCapture, releasePointerCapture: vi.fn() } }), {});
    });
    expect(setCapture).toHaveBeenCalledWith(7);
  });

  it('end 回傳 meta 並清空狀態，之後 move 回傳 null', () => {
    const { result } = renderHook(() => usePointerDrag());
    const meta = { id: 'box', mode: 'resize', handle: 'se' };

    act(() => {
      result.current.start(makeEvent({ currentTarget: { setPointerCapture: vi.fn() } }), meta);
    });

    let ended;
    act(() => {
      ended = result.current.end(makeEvent({ type: 'pointerup', currentTarget: { releasePointerCapture: vi.fn() } }));
    });
    expect(ended).toEqual({ meta, cancelled: false });
    expect(result.current.isDragging()).toBe(false);
    expect(result.current.move(makeEvent())).toBeNull();
  });

  it('pointercancel 時 cancelled 為 true', () => {
    const { result } = renderHook(() => usePointerDrag());
    act(() => {
      result.current.start(makeEvent({ currentTarget: { setPointerCapture: vi.fn() } }), { a: 1 });
    });
    let ended;
    act(() => {
      ended = result.current.end({ type: 'pointercancel', currentTarget: { releasePointerCapture: vi.fn() } });
    });
    expect(ended.cancelled).toBe(true);
  });

  it('重複呼叫 start 會替換狀態（不會堆疊舊拖曳）', () => {
    const { result } = renderHook(() => usePointerDrag());
    act(() => {
      result.current.start(makeEvent({ currentTarget: { setPointerCapture: vi.fn() } }), { id: 'first' });
    });
    act(() => {
      result.current.start(makeEvent({ currentTarget: { setPointerCapture: vi.fn() } }), { id: 'second' });
    });
    const delta = result.current.move(makeEvent({ clientX: 5, clientY: 0 }));
    expect(delta.meta.id).toBe('second');
  });

  it('cancel 會立即清除狀態', () => {
    const { result } = renderHook(() => usePointerDrag());
    act(() => {
      result.current.start(makeEvent({ currentTarget: { setPointerCapture: vi.fn() } }), {});
    });
    expect(result.current.isDragging()).toBe(true);
    act(() => result.current.cancel());
    expect(result.current.isDragging()).toBe(false);
  });
});
