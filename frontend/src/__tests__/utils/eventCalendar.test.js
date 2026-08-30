import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekEnd,
  isEventInWeek,
  filterThisWeek,
  formatEventDateRange,
} from '../../utils/eventCalendar.js';

// 2026-08-31 是週一
const MONDAY = new Date(2026, 7, 31, 14, 30, 0);

describe('getWeekStart / getWeekEnd', () => {
  it('週一起點：本週一為 08-31', () => {
    expect(getWeekStart(MONDAY).toDateString()).toBe('Mon Aug 31 2026');
  });

  it('非週一的日子也回到同一週的週一', () => {
    const sunday = new Date(2026, 8, 6, 10, 0, 0); // 09-06 (Sun)
    expect(getWeekStart(sunday).toDateString()).toBe('Mon Aug 31 2026');
  });

  it('週末 = 下週一（不含）', () => {
    expect(getWeekEnd(MONDAY).toDateString()).toBe('Mon Sep 07 2026');
  });
});

describe('isEventInWeek', () => {
  it('週內單日場次正中', () => {
    expect(isEventInWeek({ startDate: '2026-08-31', dayCount: 1 }, MONDAY)).toBe(true);
    expect(isEventInWeek({ startDate: '2026-09-06', dayCount: 1 }, MONDAY)).toBe(true);
  });

  it('本週六(08-29)不在這週（本週起點是 08-31）', () => {
    expect(isEventInWeek({ startDate: '2026-08-29', dayCount: 1 }, MONDAY)).toBe(false);
  });

  it('下一週(09-07)不在這週', () => {
    expect(isEventInWeek({ startDate: '2026-09-07', dayCount: 1 }, MONDAY)).toBe(false);
  });

  it('過期場次不在這週', () => {
    expect(isEventInWeek({ startDate: '2026-07-20', dayCount: 3 }, MONDAY)).toBe(false);
  });

  it('由上週跨到本週的多日場次被納入', () => {
    // 08-30 開始、為期 3 天 → 覆蓋 08-31（本週一）
    expect(isEventInWeek({ startDate: '2026-08-30', dayCount: 3 }, MONDAY)).toBe(true);
  });

  it('缺 startDate 或非法日期回 false', () => {
    expect(isEventInWeek({ dayCount: 1 }, MONDAY)).toBe(false);
    expect(isEventInWeek({ startDate: 'not-a-date', dayCount: 1 }, MONDAY)).toBe(false);
    expect(isEventInWeek(null, MONDAY)).toBe(false);
  });
});

describe('filterThisWeek', () => {
  const events = [
    { id: 'in_week', startDate: '2026-09-01', dayCount: 1 },
    { id: 'past', startDate: '2026-07-01', dayCount: 1 },
    { id: 'next_week', startDate: '2026-09-14', dayCount: 1 },
    { id: 'spanning', startDate: '2026-08-30', dayCount: 3 },
  ];

  it('只回傳本週場次（含跨週）', () => {
    const ids = filterThisWeek(events, MONDAY).map((e) => e.id).sort();
    expect(ids).toEqual(['in_week', 'spanning']);
  });

  it('空陣列回傳空陣列', () => {
    expect(filterThisWeek([], MONDAY)).toEqual([]);
  });
});

describe('formatEventDateRange', () => {
  it('單日回傳 MM/DD', () => {
    expect(formatEventDateRange({ startDate: '2026-08-31', dayCount: 1 })).toBe('08/31');
  });

  it('多日回傳 MM/DD ～ MM/DD', () => {
    expect(formatEventDateRange({ startDate: '2026-08-29', dayCount: 5 })).toBe('08/29 ～ 09/02');
  });

  it('無資料回傳空字串', () => {
    expect(formatEventDateRange(null)).toBe('');
    expect(formatEventDateRange({})).toBe('');
  });
});
