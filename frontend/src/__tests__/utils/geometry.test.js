import { describe, it, expect } from 'vitest';
import {
  clamp,
  round,
  toInt,
  clampBox,
  normalizeRect,
  keepInBounds
} from '../../utils/geometry.js';

describe('utils/geometry', () => {
  describe('clamp', () => {
    it('應在範圍內原樣回傳', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
    it('應限制在最小值', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });
    it('應限制在最大值', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('round', () => {
    it('應四捨五入到小數位', () => {
      expect(round(1.005, 2)).toBe(1.01);
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(42.6, 0)).toBe(43);
    });
    it('非數值應回傳 0', () => {
      expect(round(Number.NaN, 2)).toBe(0);
    });
  });

  describe('toInt', () => {
    it('應解析整數', () => {
      expect(toInt('42')).toBe(42);
      expect(toInt(20.7)).toBe(21);
    });
    it('解析失敗回傳 0', () => {
      expect(toInt('abc')).toBe(0);
    });
  });

  describe('clampBox', () => {
    const bounds = { width: 1000, height: 800 };
    it('應正常回傳四捨五入的值', () => {
      const result = clampBox({ x: 10.2, y: 20.7, width: 50, height: 30 }, bounds);
      expect(result).toEqual({ x: 10, y: 21, width: 50, height: 30 });
    });
    it('不應讓方塊超出邊界', () => {
      const result = clampBox({ x: -50, y: 0, width: 100, height: 100 }, bounds);
      expect(result.x).toBe(0);
    });
    it('維持最小寬高', () => {
      const result = clampBox({ x: 0, y: 0, width: 0, height: 0 }, bounds, { minSize: 5 });
      expect(result.width).toBeGreaterThanOrEqual(1);
    });
  });

  describe('normalizeRect', () => {
    it('負寬高應正規化，並標記翻轉', () => {
      const { rect, flipped } = normalizeRect({ x: 100, y: 100, width: -40, height: 30 });
      expect(rect.x).toBe(60);
      expect(rect.width).toBe(40);
      expect(flipped).toEqual({ x: true, y: false });
    });
    it('正值不翻轉', () => {
      const { flipped } = normalizeRect({ x: 0, y: 0, width: 50, height: 50 });
      expect(flipped).toEqual({ x: false, y: false });
    });
  });

  describe('keepInBounds', () => {
    it('應將方塊夾回邊界內', () => {
      const result = keepInBounds({ x: 900, y: 100, width: 500, height: 100 }, { width: 1000, height: 800 });
      expect(result.x).toBe(500);
      expect(result.width).toBe(500);
    });
  });
});
