// 模板草稿（draft）的純函式資料操作。
//
// 一個 draft 的形狀為：
//   { dayCount: number, startDate: string, overWriteCanvas: object }
// overWriteCanvas 與 cardTemplates.js / skill.md 描述的結構相同。
//
// 本模組不依賴 React，方便直接用 Vitest 測試。

import { CARD_TEMPLATES } from '../models/cardTemplates.js';

export const clone = (value) => JSON.parse(JSON.stringify(value));

// 由 dayCount（1~4）找出對應的內建模板 key（如 "1p"）。
export function templateKeyForDayCount(dayCount) {
  const count = Number.parseInt(dayCount, 10);
  if (CARD_TEMPLATES[`${count}p`]) return `${count}p`;
  return '1p';
}

// 「今天」的 YYYY-MM-DD（本地時區）。
export function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 以內建模板為起手，建立一份全新的可編輯草稿。
// options.startDate: 供測試注入固定日期。
export function createDraftFromBase(dayCount, options = {}) {
  const key = templateKeyForDayCount(dayCount);
  const base = CARD_TEMPLATES[key];
  return {
    dayCount: base.imageSlots.length,
    startDate: options.startDate ?? todayString(),
    overWriteCanvas: clone(base)
  };
}

// 建立一份「從 0 開始」的空白草稿（不依賴任何內建模板）。
// dayCount 以 imageSlots 的長度為準（此處為 0）；文字位置為空物件巢狀。
export function createBlankDraft(options = {}) {
  const canvas = options.canvas || {};
  const width = canvas.width ?? 1220;
  const height = canvas.height ?? 700;
  return {
    // 從 0 開始時沒有圖片槽，dayCount 設為 1 以符合後端最小語意；
    // 真正的天數以 imageSlots.length === 0 表示「尚未設定」。
    dayCount: 1,
    startDate: options.startDate ?? todayString(),
    overWriteCanvas: {
      baseImagePath: options.baseImagePath ?? '',
      canvas: {
        width,
        height,
        downloadWidth: canvas.downloadWidth ?? width,
        downloadHeight: canvas.downloadHeight ?? height
      },
      upload: { maxFileSizeBytes: 5 * 1024 * 1024 },
      imageSlots: [],
      titleImage: null,
      textPositions: {
        fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif'
      },
      fontColor: null,
      categorySelection: null
    }
  };
}

// 由後端 event template payload（{ dayCount, startDate, overWriteCanvas }）建立草稿。
// 若資料不完整則擲錯。
export function createDraftFromEventPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('無效的活動模板資料');
  }
  const { overWriteCanvas } = payload;
  if (!overWriteCanvas || typeof overWriteCanvas !== 'object') {
    throw new Error('活動模板缺少 overWriteCanvas 設定');
  }
  const slots = Array.isArray(overWriteCanvas.imageSlots) ? overWriteCanvas.imageSlots : [];
  const dayCount = payload.dayCount ?? slots.length;
  return {
    dayCount,
    startDate: payload.startDate || todayString(),
    overWriteCanvas: clone(overWriteCanvas)
  };
}

// 序列化草稿為可送出的 payload。
// dayCount 以 imageSlots 的長度為準（方案 A，見 PLAN2 §9-4）；若無任何槽位則為 1。
export function serializeDraft(draft) {
  if (!draft || !draft.overWriteCanvas) {
    throw new Error('草稿未初始化');
  }
  const slots = draft.overWriteCanvas.imageSlots || [];
  const dayCount = slots.length || 1;
  return {
    dayCount,
    startDate: draft.startDate || '',
    overWriteCanvas: clone(draft.overWriteCanvas)
  };
}

const boxKeys = ['x', 'y', 'width', 'height', 'fontSize', 'lineHeight', 'radius'];

function pickBox(value) {
  if (!value || typeof value !== 'object') return {};
  return boxKeys.reduce((acc, key) => {
    if (typeof value[key] === 'number') acc[key] = value[key];
    return acc;
  }, {});
}

const boxDefaults = { x: 0, y: 0, width: 0, height: 0 };

// 攤平 overWriteCanvas 成為可編輯元素清單，供畫布／清單／屬性面板使用。
// 每個元素：{ id, label, group, path, box, resizable, deletable, single }。
// single=true 表示此類元素只能有一個（titleImage / textPositions.*），
// 刪除後可再透過 addElement 重建。
export function collectElementFlatten(canvas) {
  const elements = [];
  if (!canvas || typeof canvas !== 'object') return elements;

  const safeBox = (slot) => ({ ...boxDefaults, ...pickBox(slot) });

  const isBoxLike = (value) => value && typeof value === 'object' && 'width' in value && 'height' in value;

  if (canvas.titleImage && isBoxLike(canvas.titleImage)) {
    elements.push({
      id: 'titleImage',
      label: '標題圖 (titleImage)',
      group: 'titleImage',
      path: ['titleImage'],
      resizable: true,
      deletable: true,
      single: true,
      box: safeBox(canvas.titleImage)
    });
  }

  (canvas.imageSlots || []).forEach((slot, index) => {
    const key = `imageSlots.${index}`;
    elements.push({
      id: key,
      label: `圖片槽 ${index + 1} (${slot?.label || index + 1})`,
      group: 'imageSlots',
      path: ['imageSlots', index],
      resizable: true,
      deletable: true,
      single: false,
      box: safeBox(slot)
    });
    if (slot?.dateRole && isBoxLike(slot.dateRole)) {
      elements.push({
        id: `${key}.dateRole`,
        label: `${slot.label || index + 1} 出角列 (dateRole)`,
        group: 'dateRole',
        path: ['imageSlots', index, 'dateRole'],
        resizable: true,
        deletable: false,
        single: false,
        box: safeBox(slot.dateRole)
      });
    }
  });

  const textPositions = canvas.textPositions || {};
  Object.keys(textPositions).forEach((field) => {
    const value = textPositions[field];
    // 跳過非座標欄位（如 fontFamily）與非 box 值
    if (!isBoxLike(value)) return;
    elements.push({
      id: `textPositions.${field}`,
      label: `${textLabel(field)} (${field})`,
      group: 'textPositions',
      path: ['textPositions', field],
      resizable: true,
      deletable: true,
      single: true,
      box: safeBox(value)
    });
  });

  if (canvas.categorySelection) {
    Object.keys(canvas.categorySelection).forEach((name) => {
      const value = canvas.categorySelection[name];
      if (!isBoxLike(value)) return;
      elements.push({
        id: `categorySelection.${name}`,
        label: `身分圈選：${name}`,
        group: 'categorySelection',
        path: ['categorySelection', name],
        resizable: true,
        deletable: true,
        single: false,
        box: safeBox(value)
      });
    });
  }

  return elements;
}

function textLabel(field) {
  const labels = { nickname: '暱稱', category: '身分', message: '留言' };
  return labels[field] || field;
}

// 建立一個新的身分圈選框（categorySelection 項目）。
export function createCategoryBox(x = 50, y = 50) {
  return { x, y, width: 200, height: 80 };
}

// 建立單一元素（titleImage / textPositions.*）的預設 box。
export function buildBlankBox(group, field) {
  const base = { x: 30, y: 100, width: 300, height: 100 };
  switch (group) {
    case 'titleImage':
      return { ...base, x: 30, y: 30, width: 400, height: 200 };
    case 'textPositions': {
      if (field === 'message') return { ...base, y: 450, height: 150, fontSize: 26, lineHeight: 32 };
      if (field === 'category') return { ...base, y: 320, height: 80, fontSize: 28 };
      return { ...base, y: 180, height: 120, fontSize: 30 };
    }
    default:
      return { ...base };
  }
}

// 將 overWriteCanvas 中所有方框（box）的座標與尺寸按比例縮放。
// 用於底圖更換時，同步調整編輯區域與所有元素位置。
export function scaleOverWriteCanvas(canvas, scaleX, scaleY) {
  const next = clone(canvas);
  const scaleBox = (box) => {
    if (!box || typeof box !== 'object') return box;
    return {
      ...box,
      x: Math.round((box.x || 0) * scaleX),
      y: Math.round((box.y || 0) * scaleY),
      width: Math.round((box.width || 0) * scaleX),
      height: Math.round((box.height || 0) * scaleY)
    };
  };

  if (next.titleImage && typeof next.titleImage === 'object') {
    next.titleImage = scaleBox(next.titleImage);
  }

  if (Array.isArray(next.imageSlots)) {
    next.imageSlots = next.imageSlots.map((slot) => {
      const scaledSlot = scaleBox(slot);
      if (scaledSlot.dateRole && typeof scaledSlot.dateRole === 'object') {
        scaledSlot.dateRole = scaleBox(scaledSlot.dateRole);
      }
      return scaledSlot;
    });
  }

  if (next.textPositions && typeof next.textPositions === 'object') {
    Object.keys(next.textPositions).forEach((field) => {
      const value = next.textPositions[field];
      if (value && typeof value === 'object' && 'width' in value) {
        next.textPositions[field] = scaleBox(value);
      }
    });
  }

  if (next.categorySelection && typeof next.categorySelection === 'object') {
    Object.keys(next.categorySelection).forEach((name) => {
      const value = next.categorySelection[name];
      if (value && typeof value === 'object' && 'width' in value) {
        next.categorySelection[name] = scaleBox(value);
      }
    });
  }

  return next;
}
