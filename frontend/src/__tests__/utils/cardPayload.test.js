import { describe, it, expect } from 'vitest';
import { buildCardPayload, applyCardPayload } from '../../utils/cardPayload.js';

const stateSample = {
  dayCount: 2,
  eventId: 'demo-event',
  dayDetails: {
    d1: { date: '2026-05-23', cosrole: '' },
    d2: { date: '2026-05-24', cosrole: 'Miku' }
  },
  overWriteCanvas: {
    baseImagePath: './img/card_base_2p_demo.png',
    canvas: { width: 1700, height: 700 },
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 393,
        y: 83.6,
        width: 439.5,
        height: 532.7,
        dateRole: { fontSize: 26, x: 390.3, y: 616.4, width: 439.5, height: 52.6 }
      }
    ],
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      nickname: { fontSize: 36, x: 33.6, y: 323.2, width: 324.4, height: 129.1 },
      message: { fontSize: 30, x: 1342, y: 83.6, width: 324.4, height: 289.2, lineHeight: 42 }
    }
  },
  // 以下使用者內容不應進入 payload
  sharedFormData: { nickname: 'tester', message: 'hi', category: 'COSER' },
  imageDatas: { d1: '/uploads/a.png' },
  imageOffsets: { d1: -20 },
  baseImageData: '/uploads/base.png'
};

describe('utils/cardPayload', () => {
  it('build 應只輸出 dayCount / startDate / overWriteCanvas / eventId', () => {
    const payload = buildCardPayload(stateSample);

    expect(payload).toEqual({
      dayCount: 2,
      startDate: '2026-05-23',
      overWriteCanvas: stateSample.overWriteCanvas,
      eventId: 'demo-event'
    });
  });

  it('build→apply 應完整還原版面快照', () => {
    const payload = buildCardPayload(stateSample);
    const restored = applyCardPayload(payload);

    expect(restored).toEqual({
      dayCount: 2,
      startDate: '2026-05-23',
      overWriteCanvas: stateSample.overWriteCanvas,
      eventId: 'demo-event',
      eventName: null
    });
  });

  it('未填起始日期時 startDate 為空字串（對齊 card-expect.json）', () => {
    const payload = buildCardPayload({
      dayCount: 1,
      eventId: null,
      dayDetails: { d1: { date: '', cosrole: '' } },
      overWriteCanvas: {}
    });

    expect(payload.startDate).toBe('');
  });

  it('build 後修改 payload 不會影響原狀態（防禦性複製）', () => {
    const payload = buildCardPayload(stateSample);

    payload.overWriteCanvas.canvas.width = 1;
    payload.overWriteCanvas.imageSlots[0].dateRole.fontSize = 0;

    expect(stateSample.overWriteCanvas.canvas.width).toBe(1700);
    expect(stateSample.overWriteCanvas.imageSlots[0].dateRole.fontSize).toBe(26);
  });

  it('缺漏欄位應給安全預設值', () => {
    const restored = applyCardPayload({});

    expect(restored.dayCount).toBeNull();
    expect(restored.startDate).toBe('');
    expect(restored.overWriteCanvas).toBeNull();
    expect(restored.eventId).toBeNull();
    expect(restored.eventName).toBeNull();
  });

  it('舊卡片的 eventName 應視為 eventId', () => {
    const restored = applyCardPayload({ eventName: 'legacy-event' });

    expect(restored.eventId).toBe('legacy-event');
  });

  it('新卡片同時保留 eventId 與名稱快照', () => {
    const restored = applyCardPayload({ eventId: 'cwt-70', eventName: '開拓動漫祭' });

    expect(restored.eventId).toBe('cwt-70');
    expect(restored.eventName).toBe('開拓動漫祭');
  });

  it('非物件 payload 應拋出錯誤', () => {
    expect(() => applyCardPayload(null)).toThrow();
    expect(() => applyCardPayload(undefined)).toThrow();
    expect(() => applyCardPayload('nope')).toThrow();
    expect(() => applyCardPayload(42)).toThrow();
  });
});
