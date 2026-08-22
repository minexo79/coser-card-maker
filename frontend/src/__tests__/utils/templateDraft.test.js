import { describe, it, expect } from 'vitest';
import {
  createDraftFromBase,
  createDraftFromEventPayload,
  createBlankDraft,
  serializeDraft,
  collectElementFlatten,
  templateKeyForDayCount,
  buildBlankBox,
  scaleOverWriteCanvas
} from '../../utils/templateDraft.js';
import { CARD_TEMPLATES } from '../../models/cardTemplates.js';

describe('utils/templateDraft', () => {
  describe('templateKeyForDayCount', () => {
    it('應回傳對應的天數模板 key', () => {
      expect(templateKeyForDayCount(1)).toBe('1p');
      expect(templateKeyForDayCount(4)).toBe('4p');
    });
    it('不支援的天數應回退 1p', () => {
      expect(templateKeyForDayCount(99)).toBe('1p');
    });
  });

  describe('createDraftFromBase', () => {
    it('建立正確結構的草稿，且為深拷貝（不與常量共用參考）', () => {
      const draft = createDraftFromBase(2, { startDate: '2026-05-23' });
      expect(draft.dayCount).toBe(2);
      expect(draft.startDate).toBe('2026-05-23');
      expect(draft.overWriteCanvas.imageSlots).toHaveLength(2);
      // 修改草稿不應影響原始模板
      draft.overWriteCanvas.canvas.width = 1;
      expect(CARD_TEMPLATES['2p'].canvas.width).not.toBe(1);
    });
  });

  describe('createDraftFromEventPayload', () => {
    it('由 event payload 建立草稿', () => {
      const payload = {
        dayCount: 3,
        startDate: '2026-05-30',
        overWriteCanvas: {
          canvas: { width: 100, height: 100 },
          imageSlots: [{ key: 'd1' }, { key: 'd2' }, { key: 'd3' }]
        }
      };
      const draft = createDraftFromEventPayload(payload);
      expect(draft.dayCount).toBe(3);
      expect(draft.overWriteCanvas.imageSlots).toHaveLength(3);
    });
    it('缺少 overWriteCanvas 應拋錯', () => {
      expect(() => createDraftFromEventPayload({})).toThrow();
      expect(() => createDraftFromEventPayload(null)).toThrow();
    });
  });

  describe('serializeDraft', () => {
    it('dayCount 等於 imageSlots 長度時回傳 payload', () => {
      const payload = serializeDraft({
        dayCount: 2,
        startDate: '2026-01-01',
        overWriteCanvas: { imageSlots: [{}, {}] }
      });
      expect(payload.dayCount).toBe(2);
      expect(payload.overWriteCanvas.imageSlots).toHaveLength(2);
    });
    it('dayCount 與 imageSlots 不一致時以 imageSlots 長度為準（方案 A）', () => {
      const payload = serializeDraft({
        dayCount: 2,
        startDate: '',
        overWriteCanvas: { imageSlots: [{}] }
      });
      expect(payload.dayCount).toBe(1);
    });
    it('陣列內容不應影響原草稿', () => {
      const src = {
        dayCount: 1,
        startDate: '2026-01-01',
        overWriteCanvas: { imageSlots: [{}] }
      };
      const payload = serializeDraft(src);
      payload.overWriteCanvas.imageSlots[0].foo = 'bar';
      expect(src.overWriteCanvas.imageSlots[0].foo).toBeUndefined();
    });
  });

  describe('collectElementFlatten', () => {
    it('應攤平所有可編輯元素', () => {
      const draft = createDraftFromBase(2);
      const elements = collectElementFlatten(draft.overWriteCanvas);
      const ids = elements.map((e) => e.id);
      // titleImage + 2 imageSlots + 2 dateRole + nickname + category + message
      expect(ids).toContain('titleImage');
      expect(ids).toContain('imageSlots.0');
      expect(ids).toContain('imageSlots.1');
      expect(ids).toContain('textPositions.nickname');
      expect(ids).toContain('textPositions.category');
      expect(ids).toContain('textPositions.message');
    });
    it('每個元素都有座標資訊', () => {
      const draft = createDraftFromBase(1);
      const elements = collectElementFlatten(draft.overWriteCanvas);
      elements.forEach((element) => {
        expect(typeof element.box.x).toBe('number');
        expect(typeof element.box.y).toBe('number');
        expect(typeof element.box.width).toBe('number');
        expect(typeof element.box.height).toBe('number');
      });
    });
    it('categorySelection 元素可標記可刪除', () => {
      const draft = createDraftFromBase(1);
      draft.overWriteCanvas.categorySelection = {
        COSER: { x: 10, y: 10, width: 100, height: 50 }
      };
      const elements = collectElementFlatten(draft.overWriteCanvas);
      const categoryElement = elements.find((e) => e.id === 'categorySelection.COSER');
      expect(categoryElement).toBeTruthy();
      expect(categoryElement.deletable).toBe(true);
    });
  });
});

describe('createBlankDraft', () => {
  it('建立從 0 開始的空白草稿（不依賴內建模板）', () => {
    const draft = createBlankDraft({ startDate: '2026-06-01' });
    expect(draft.dayCount).toBe(1); // 佔位
    expect(draft.startDate).toBe('2026-06-01');
    expect(draft.overWriteCanvas.imageSlots).toEqual([]);
    expect(draft.overWriteCanvas.titleImage).toBeNull();
    expect(draft.overWriteCanvas.categorySelection).toBeNull();
    expect(draft.overWriteCanvas.textPositions.fontFamily).toBeTruthy();
    expect(draft.overWriteCanvas.canvas.width).toBe(1220);
    expect(typeof draft.overWriteCanvas.canvas).toBe('object');
  });

  it('collectElementFlatten 對空白草稿回傳空陣列', () => {
    const draft = createBlankDraft();
    expect(collectElementFlatten(draft.overWriteCanvas)).toEqual([]);
  });

  it('serializeDraft 對空白草稿不拋錯且 dayCount 為 1', () => {
    const draft = createBlankDraft();
    const payload = serializeDraft(draft);
    expect(payload.dayCount).toBe(1);
    expect(payload.overWriteCanvas.imageSlots).toEqual([]);
  });
});

describe('buildBlankBox', () => {
  it('不同類型回傳不同預設位置', () => {
    const title = buildBlankBox('titleImage');
    const msg = buildBlankBox('textPositions', 'message');
    const nick = buildBlankBox('textPositions', 'nickname');
    expect(title.y).toBeLessThan(nick.y);
    expect(msg.lineHeight).toBeTruthy();
    expect(nick.fontSize).toBeTruthy();
  });
});

describe('scaleOverWriteCanvas', () => {
  it('應縮放 titleImage 的方框', () => {
    const canvas = {
      titleImage: { x: 10, y: 20, width: 100, height: 50 },
      imageSlots: [],
      textPositions: {},
      categorySelection: null
    };
    const result = scaleOverWriteCanvas(canvas, 2, 2);
    expect(result.titleImage).toEqual({ x: 20, y: 40, width: 200, height: 100 });
  });

  it('應縮放 imageSlots 及其 dateRole', () => {
    const canvas = {
      titleImage: null,
      imageSlots: [
        { x: 10, y: 20, width: 100, height: 50, dateRole: { x: 5, y: 5, width: 50, height: 20, fontSize: 14 } }
      ],
      textPositions: {},
      categorySelection: null
    };
    const result = scaleOverWriteCanvas(canvas, 2, 3);
    expect(result.imageSlots[0].x).toBe(20);
    expect(result.imageSlots[0].y).toBe(60);
    expect(result.imageSlots[0].width).toBe(200);
    expect(result.imageSlots[0].height).toBe(150);
    expect(result.imageSlots[0].dateRole).toEqual({ x: 10, y: 15, width: 100, height: 60, fontSize: 14 });
  });

  it('應縮放 textPositions 中的方框', () => {
    const canvas = {
      titleImage: null,
      imageSlots: [],
      textPositions: {
        nickname: { x: 10, y: 20, width: 100, height: 50 },
        fontFamily: 'LINESeedTW'
      },
      categorySelection: null
    };
    const result = scaleOverWriteCanvas(canvas, 0.5, 0.5);
    expect(result.textPositions.nickname).toEqual({ x: 5, y: 10, width: 50, height: 25 });
    expect(result.textPositions.fontFamily).toBe('LINESeedTW');
  });

  it('應縮放 categorySelection 中的方框', () => {
    const canvas = {
      titleImage: null,
      imageSlots: [],
      textPositions: {},
      categorySelection: {
        COSER: { x: 10, y: 20, width: 100, height: 50 }
      }
    };
    const result = scaleOverWriteCanvas(canvas, 2, 2);
    expect(result.categorySelection.COSER).toEqual({ x: 20, y: 40, width: 200, height: 100 });
  });

  it('不應修改原始物件', () => {
    const canvas = {
      titleImage: { x: 10, y: 20, width: 100, height: 50 },
      imageSlots: [],
      textPositions: {},
      categorySelection: null
    };
    const original = JSON.stringify(canvas);
    scaleOverWriteCanvas(canvas, 2, 2);
    expect(JSON.stringify(canvas)).toBe(original);
  });

  it('空 canvas 應回傳空物件', () => {
    const canvas = { titleImage: null, imageSlots: [], textPositions: {}, categorySelection: null };
    const result = scaleOverWriteCanvas(canvas, 2, 2);
    expect(result.titleImage).toBeNull();
    expect(result.imageSlots).toEqual([]);
  });
});
