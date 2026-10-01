import { describe, it, expect } from 'vitest';
import { getEventDisplayName, normalizeEventList } from '../../utils/eventDisplay.js';

describe('utils/eventDisplay', () => {
  describe('getEventDisplayName', () => {
    it('有名稱時顯示名稱', () => {
      expect(getEventDisplayName({ id: 'ff44', name: '開拓動漫祭 FF44' })).toBe('開拓動漫祭 FF44');
    });

    it('名稱空白或缺漏時退回活動代號', () => {
      expect(getEventDisplayName({ id: 'ff44', name: '   ' })).toBe('ff44');
      expect(getEventDisplayName({ id: 'ff44' })).toBe('ff44');
    });

    it('無效輸入回傳空字串', () => {
      expect(getEventDisplayName(null)).toBe('');
      expect(getEventDisplayName(undefined)).toBe('');
    });
  });

  describe('normalizeEventList', () => {
    it('保留 { id, name } 並補上缺漏的名稱', () => {
      expect(normalizeEventList([{ id: 'a', name: '活動 A' }, { id: 'b' }])).toEqual([
        { id: 'a', name: '活動 A' },
        { id: 'b', name: 'b' }
      ]);
    });

    it('相容舊版後端的字串陣列', () => {
      expect(normalizeEventList(['a', 'b'])).toEqual([
        { id: 'a', name: 'a' },
        { id: 'b', name: 'b' }
      ]);
    });

    it('過濾無效項目，非陣列回傳空陣列', () => {
      expect(normalizeEventList([null, {}, { id: '' }, { id: 'ok' }])).toEqual([{ id: 'ok', name: 'ok' }]);
      expect(normalizeEventList(null)).toEqual([]);
      expect(normalizeEventList({})).toEqual([]);
    });
  });
});
