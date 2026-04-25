/*
* 卡片模板測試
* 這些測試確保卡片模板的結構和內容符合預期，並且在未來的修改中保持一致性。
* 測試涵蓋了模板的基本結構、圖片槽配置、文字位置配置等方面。
*
* V1.0: 2026.3.29 GPT: 初始版本
*/


import { describe, it, expect } from 'vitest';
import { CARD_TEMPLATES } from '../../models/cardTemplates.js';

describe('卡片模板', () => {
  describe('CARD_TEMPLATES 結構', () => {
    it('應該包含 1p 和 2p 模板', () => {
      expect(CARD_TEMPLATES).toHaveProperty('1p');
      expect(CARD_TEMPLATES).toHaveProperty('2p');
    });
  });

  describe('1p 模板', () => {
    const template1p = CARD_TEMPLATES['1p'];

    it('應該擁有所有必需欄位', () => {
      expect(template1p).toHaveProperty('canvas');
      expect(template1p).toHaveProperty('upload');
      expect(template1p).toHaveProperty('qrCode');
      expect(template1p).toHaveProperty('imageSlots');
      expect(template1p).toHaveProperty('textPositions');
    });

    it('canvas 應該擁有必需的尺寸', () => {
      expect(template1p.canvas).toHaveProperty('width');
      expect(template1p.canvas).toHaveProperty('height');
      expect(template1p.canvas).toHaveProperty('downloadWidth');
      expect(template1p.canvas).toHaveProperty('downloadHeight');
      expect(template1p.canvas.width).toBe(1220);
      expect(template1p.canvas.height).toBe(700);
    });

    it('upload 應該擁有 maxFileSizeBytes', () => {
      expect(template1p.upload).toHaveProperty('maxFileSizeBytes');
      expect(template1p.upload.maxFileSizeBytes).toBeGreaterThan(0);
    });

    it('qrCode 應該擁有必需的屬性', () => {
      expect(template1p.qrCode).toHaveProperty('size');
      expect(template1p.qrCode).toHaveProperty('contentPadding');
      expect(template1p.qrCode).toHaveProperty('backgroundPadding');
    });

    it('應該恰好包含 1 個圖片槽', () => {
      expect(template1p.imageSlots).toHaveLength(1);
    });

    it('圖片槽應該擁有必需欄位', () => {
      const slot = template1p.imageSlots[0];
      expect(slot).toHaveProperty('key');
      expect(slot).toHaveProperty('label');
      expect(slot).toHaveProperty('x');
      expect(slot).toHaveProperty('y');
      expect(slot).toHaveProperty('width');
      expect(slot).toHaveProperty('height');
      expect(slot.key).toBe('d1');
    });

    it('textPositions 應該擁有必需欄位', () => {
      expect(template1p.textPositions).toHaveProperty('fontFamily');
      expect(template1p.textPositions).toHaveProperty('title');
      expect(template1p.textPositions).toHaveProperty('nickname');
      expect(template1p.textPositions).toHaveProperty('category');
      expect(template1p.textPositions).toHaveProperty('message');
      expect(template1p.textPositions).toHaveProperty('dateRole');

      ['title', 'nickname', 'category', 'message', 'dateRole'].forEach((key) => {
        expect(template1p.textPositions[key]).toHaveProperty('x');
        expect(template1p.textPositions[key]).toHaveProperty('y');
        expect(template1p.textPositions[key]).toHaveProperty('width');
        expect(template1p.textPositions[key]).toHaveProperty('height');
      });
    });
  });

  describe('2p 模板', () => {
    const template2p = CARD_TEMPLATES['2p'];

    it('應該擁有所有必需欄位', () => {
      expect(template2p).toHaveProperty('canvas');
      expect(template2p).toHaveProperty('upload');
      expect(template2p).toHaveProperty('qrCode');
      expect(template2p).toHaveProperty('imageSlots');
      expect(template2p).toHaveProperty('textPositions');
    });

    it('應該恰好包含 2 個圖片槽', () => {
      expect(template2p.imageSlots).toHaveLength(2);
    });

    it('圖片槽應該擁有正確的鍵值', () => {
      expect(template2p.imageSlots[0].key).toBe('d1');
      expect(template2p.imageSlots[1].key).toBe('d2');
    });

    it('每個圖片槽應該擁有必需欄位', () => {
      template2p.imageSlots.forEach((slot) => {
        expect(slot).toHaveProperty('key');
        expect(slot).toHaveProperty('label');
        expect(slot).toHaveProperty('x');
        expect(slot).toHaveProperty('y');
        expect(slot).toHaveProperty('width');
        expect(slot).toHaveProperty('height');
      });
    });

    it('textPositions 應該擁有必需欄位', () => {
      expect(template2p.textPositions).toHaveProperty('fontFamily');
      expect(template2p.textPositions).toHaveProperty('title');
      expect(template2p.textPositions).toHaveProperty('nickname');
      expect(template2p.textPositions).toHaveProperty('category');
      expect(template2p.textPositions).toHaveProperty('message');
      expect(template2p.textPositions).toHaveProperty('dateRole');

      ['title', 'nickname', 'category', 'message', 'dateRole'].forEach((key) => {
        expect(template2p.textPositions[key]).toHaveProperty('x');
        expect(template2p.textPositions[key]).toHaveProperty('y');
        expect(template2p.textPositions[key]).toHaveProperty('width');
        expect(template2p.textPositions[key]).toHaveProperty('height');
      });
    });
  });
});
