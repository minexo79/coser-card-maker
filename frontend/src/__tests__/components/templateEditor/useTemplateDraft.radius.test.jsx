import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplateDraft } from '../../../components/templateEditor/useTemplateDraft.js';
import { DEFAULT_IMAGE_RADIUS, getSharedImageRadius } from '../../../utils/templateDraft.js';

const slots = (result) => result.current.draft.overWriteCanvas.imageSlots;

describe('useTemplateDraft 共用照片圓角', () => {
  it('預設圓角為 5，新增的圖片槽帶入預設值', () => {
    const { result } = renderHook(() => useTemplateDraft());
    expect(DEFAULT_IMAGE_RADIUS).toBe(32);

    act(() => {
      result.current.setSlotCount(2);
    });
    expect(slots(result).map((s) => s.radius)).toEqual([5, 5]);
  });

  it('setImageRadius 一次套用到所有圖片槽', () => {
    const { result } = renderHook(() => useTemplateDraft());
    act(() => {
      result.current.setSlotCount(3);
    });
    act(() => {
      result.current.setImageRadius(20);
    });
    expect(slots(result).map((s) => s.radius)).toEqual([20, 20, 20]);
  });

  it('之後新增的圖片槽沿用目前的共用圓角', () => {
    const { result } = renderHook(() => useTemplateDraft());
    act(() => {
      result.current.setSlotCount(1);
    });
    act(() => {
      result.current.setImageRadius(12);
    });
    act(() => {
      result.current.setSlotCount(2);
    });
    act(() => {
      result.current.addElement({ type: 'imageSlot' });
    });
    expect(slots(result).map((s) => s.radius)).toEqual([12, 12, 12]);
  });

  it('負數視為 0', () => {
    const { result } = renderHook(() => useTemplateDraft());
    act(() => {
      result.current.setSlotCount(1);
    });
    act(() => {
      result.current.setImageRadius(-3);
    });
    expect(slots(result)[0].radius).toBe(0);
  });
});

describe('getSharedImageRadius', () => {
  it('以第一個有設定的圖片槽為準，皆未設定時為預設值', () => {
    expect(getSharedImageRadius({ imageSlots: [{}, { radius: 8 }] })).toBe(8);
    expect(getSharedImageRadius({ imageSlots: [{ radius: 0 }] })).toBe(0);
    expect(getSharedImageRadius({ imageSlots: [{}] })).toBe(DEFAULT_IMAGE_RADIUS);
    expect(getSharedImageRadius(null)).toBe(DEFAULT_IMAGE_RADIUS);
  });
});
