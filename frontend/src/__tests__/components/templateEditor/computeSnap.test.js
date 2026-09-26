import { describe, it, expect } from 'vitest';
import { computeSnap } from '../../../components/templateEditor/snap.js';

const W = 1220;
const H = 700;
// 參考元素：left=500, right=600, top=300, bottom=400
const others = [{ id: 'ref', box: { x: 500, y: 300, width: 100, height: 100 } }];

describe('computeSnap', () => {
  describe('resize：只改變被拖曳的邊，對面的邊固定', () => {
    it('拉右邊（e）吸附時，左邊不動、寬度改變', () => {
      // right = 100 + 398 = 498，距離參考左邊 500 在門檻內
      const box = { x: 100, y: 50, width: 398, height: 80 };
      const { box: result, lines } = computeSnap(box, others, 'resize', 'e', W, H);
      expect(result.x).toBe(100);
      expect(result.width).toBe(400);
      expect(result.x + result.width).toBe(500);
      expect(lines).toEqual([{ x: 500, type: 'vertical' }]);
    });

    it('拉左邊（w）吸附時，右邊不動、寬度改變', () => {
      // left = 603，距離參考右邊 600 在門檻內；right = 803
      const box = { x: 603, y: 50, width: 200, height: 80 };
      const { box: result } = computeSnap(box, others, 'resize', 'w', W, H);
      expect(result.x).toBe(600);
      expect(result.x + result.width).toBe(803);
      expect(result.width).toBe(203);
    });

    it('拉下邊（s）吸附時，上邊不動、高度改變', () => {
      // bottom = 10 + 292 = 302，距離參考上邊 300 在門檻內
      const box = { x: 800, y: 10, width: 50, height: 292 };
      const { box: result } = computeSnap(box, others, 'resize', 's', W, H);
      expect(result.y).toBe(10);
      expect(result.height).toBe(290);
    });

    it('拉上邊（n）吸附時，下邊不動、高度改變', () => {
      // top = 398，距離參考下邊 400 在門檻內；bottom = 498
      const box = { x: 800, y: 398, width: 50, height: 100 };
      const { box: result } = computeSnap(box, others, 'resize', 'n', W, H);
      expect(result.y).toBe(400);
      expect(result.y + result.height).toBe(498);
    });

    it('拉角落（se）時兩軸都只改變被拖曳的邊', () => {
      const box = { x: 100, y: 10, width: 398, height: 292 };
      const { box: result } = computeSnap(box, others, 'resize', 'se', W, H);
      expect(result).toEqual({ x: 100, y: 10, width: 400, height: 290 });
    });

    it('resize 不吸附中心線，也不吸附未拖曳的邊', () => {
      // 左邊 x=498 接近 500，但拖曳的是右邊（e），不應吸附左邊
      const box = { x: 498, y: 50, width: 30, height: 80 };
      const { box: result, lines } = computeSnap(box, others, 'resize', 'e', W, H);
      expect(result).toEqual(box);
      expect(lines).toEqual([]);
    });
  });

  describe('move：整個方框平移，尺寸不變', () => {
    it('右邊吸附時平移，寬度維持原值（含小數）', () => {
      const box = { x: 100, y: 50, width: 398.4, height: 80.2 };
      const { box: result } = computeSnap(box, others, 'move', null, W, H);
      expect(result.width).toBe(398.4);
      expect(result.height).toBe(80.2);
      expect(result.x).toBe(Math.round(500 - 398.4));
    });

    it('中心線可吸附', () => {
      // cx = 548 + 2 = 550，參考 cx = 550
      const box = { x: 548, y: 600, width: 4, height: 4 };
      const { box: result } = computeSnap(box, others, 'move', null, W, H);
      expect(result.x + result.width / 2).toBe(550);
    });
  });
});
