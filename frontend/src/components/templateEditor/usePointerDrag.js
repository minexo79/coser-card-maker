import { useCallback, useRef } from 'react';

/**
 * usePointerDrag — 以 Pointer Capture 為基礎的可重用拖曳狀態機。
 *
 * 解決問題：
 *   - 舊實作以 `window.addEventListener('mousemove'|'mouseup')` 追蹤
 *     拖曳，遇到「在視窗外放開滑鼠、切窗、開啟 DevTools、blur」時
 *     mouseup 永遠不會觸發，造成 interaction 狀態永久殘留（卡死）。
 *   - 改以 setPointerCapture 綁定於起始元素，後續 pointermove/up/cancel
 *     保證送到該元素，不需全域監聽，也自然解決失焦清理問題。
 */
export function usePointerDrag() {
  const stateRef = useRef(null);

  /**
   * 開始新的拖曳互動。應於 onPointerDown 中呼叫。
   * @param {React.PointerEvent} event
   * @param {any} meta 一個「要帶到 move/end 的精靈資料」（例如元素 id、模式、縮放把）
   * @returns {{pointerId:number} | null}
   */
  const start = useCallback((event, meta) => {
    const node = event.currentTarget;
    if (node && typeof node.setPointerCapture === 'function') {
      try {
        if (stateRef.current && node.releasePointerCapture && stateRef.current.pointerId) {
          node.releasePointerCapture(stateRef.current.pointerId);
        }
        node.setPointerCapture(event.pointerId);
      } catch {
        // 某些環境（測試）不支援 capture，退回無 capture 模式
      }
    }
    const state = {
      meta,
      startX: event.clientX,
      startY: event.clientY,
      prevX: event.clientX,
      prevY: event.clientY,
      pointerId: event.pointerId
    };
    stateRef.current = state;
    return state;
  }, []);

  /**
   * 拖曳中移動。應於 onPointerMove 中呼叫。
   * @returns {{ dx:number, dy:number, deltaX:number, deltaY:number, meta:any } | null}
   */
  const move = useCallback((event) => {
    const state = stateRef.current;
    if (!state) return null;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const deltaX = event.clientX - state.prevX;
    const deltaY = event.clientY - state.prevY;
    state.prevX = event.clientX;
    state.prevY = event.clientY;
    return { dx, dy, deltaX, deltaY, meta: state.meta };
  }, []);

  /**
   * 結束拖曳（於 onPointerUp / onPointerCancel 呼叫）。
   * @returns {{ meta: any, cancelled: boolean } | null}
   */
  const end = useCallback((event) => {
    if (!stateRef.current) return null;
    const state = stateRef.current;
    const cancelled = event?.type === 'pointercancel';
    stateRef.current = null;
    const node = event?.currentTarget;
    if (node && typeof node.releasePointerCapture === 'function') {
      try {
        node.releasePointerCapture?.(event.pointerId);
      } catch {
        // ignore
      }
    }
    return { meta: state.meta, cancelled };
  }, []);

  /** 明確中斷目前拖曳（例如元件卸載、按 ESC 時呼叫）。 */
  const cancel = useCallback(() => {
    stateRef.current = null;
  }, []);

  /** 目前是否正處於拖曳中。 */
  const isDragging = useCallback(() => !!stateRef.current, []);

  /** 取得目前拖曳的中繼資料（唯讀）。 */
  const getMeta = useCallback(() => stateRef.current?.meta ?? null, []);

  return { start, move, end, cancel, isDragging, getMeta };
}

export default usePointerDrag;
