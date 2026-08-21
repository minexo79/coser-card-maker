import { describe, it, expect } from 'vitest';
import { buildCardPayload, applyCardPayload } from '../../utils/cardPayload.js';

const stateSample = {
  dayCount: 2,
  eventName: 'demo-event',
  sharedFormData: { nickname: 'tester', message: 'hi\nthere', category: 'COSER' },
  dayDetails: {
    d1: { date: '2026-05-23', cosrole: '' },
    d2: { date: '2026-05-24', cosrole: 'Miku' }
  },
  imageDatas: { d1: '/uploads/a.png', d2: null },
  imageOffsets: { d1: -20, d2: 30 },
  titleImageData: '/uploads/title.png'
};

describe('utils/cardPayload', () => {
  it('build→apply 應完整還原狀態', () => {
    const payload = buildCardPayload(stateSample);
    const restored = applyCardPayload(payload);

    expect(restored).toEqual({
      dayCount: 2,
      eventName: 'demo-event',
      sharedFormData: stateSample.sharedFormData,
      dayDetails: stateSample.dayDetails,
      imageDatas: stateSample.imageDatas,
      imageOffsets: stateSample.imageOffsets,
      titleImageData: '/uploads/title.png'
    });
  });

  it('build 後修改 payload 不會影響原狀態（防禦性複製）', () => {
    const payload = buildCardPayload(stateSample);

    payload.sharedFormData.nickname = 'changed';
    payload.dayDetails.d1.date = '2000-01-01';
    payload.imageOffsets.d1 = 999;

    expect(stateSample.sharedFormData.nickname).toBe('tester');
    expect(stateSample.dayDetails.d1.date).toBe('2026-05-23');
    expect(stateSample.imageOffsets.d1).toBe(-20);
  });

  it('缺漏欄位應給安全預設值', () => {
    const restored = applyCardPayload({});

    expect(restored.dayCount).toBeNull();
    expect(restored.eventName).toBeNull();
    expect(restored.sharedFormData).toEqual({});
    expect(restored.dayDetails).toEqual({});
    expect(restored.imageDatas).toEqual({});
    expect(restored.imageOffsets).toEqual({});
    expect(restored.titleImageData).toBeNull();
  });

  it('非物件 payload 應拋出錯誤', () => {
    expect(() => applyCardPayload(null)).toThrow();
    expect(() => applyCardPayload(undefined)).toThrow();
    expect(() => applyCardPayload('nope')).toThrow();
    expect(() => applyCardPayload(42)).toThrow();
  });
});
