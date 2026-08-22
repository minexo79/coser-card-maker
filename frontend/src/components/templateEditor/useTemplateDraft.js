import { useCallback, useMemo, useState } from 'react';
import {
  buildBlankBox,
  clone,
  collectElementFlatten,
  createCategoryBox,
  createDraftFromBase,
  createDraftFromEventPayload,
  createBlankDraft,
  scaleOverWriteCanvas
} from '../../utils/templateDraft.js';

// 對 overWriteCanvas 指定路徑做不可變更新，回傳新物件。
const ensurePath = (obj, path) => {
  let cursor = obj;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  return cursor;
};

function updatePath(root, path, updater) {
  const cloneRoot = clone(root);
  const parent = ensurePath(cloneRoot, path);
  const key = path[path.length - 1];
  parent[key] = updater(parent[key]);
  return cloneRoot;
}

// 確保 canvas 上具備可安全寫入的容器（陣列或物件），避免 undefined 炸掉。
function ensureContainers(canvas) {
  const next = { ...canvas };
  if (!Array.isArray(next.imageSlots)) next.imageSlots = [];
  if (!next.textPositions || typeof next.textPositions !== 'object') next.textPositions = {};
  return next;
}

// 取得 textPositions 中「可顯示」的單一元素欄位（跳過 fontFamily 等）。
export const TEXT_POSITION_FIELDS = ['nickname', 'category', 'message'];

const EMPTY_FN = () => {};

export function useTemplateDraft(initialDraft) {
  const [draft, setDraft] = useState(() => initialDraft || createBlankDraft());
  const [loadedEventId, setLoadedEventId] = useState(null);

  const elements = useMemo(
    () => (draft ? collectElementFlatten(draft.overWriteCanvas) : []),
    [draft]
  );

  const elementsById = useMemo(() => {
    const map = {};
    elements.forEach((element) => {
      map[element.id] = element;
    });
    return map;
  }, [elements]);

  // 以內建模板為基礎重設草稿（僅供「套用 1p 模板」的選用動作使用）。
  const resetFromTemplate = useCallback((dayCount) => {
    setDraft(createDraftFromBase(dayCount));
    setLoadedEventId(null);
  }, []);

  // 重設為空白草稿。
  const clearAll = useCallback(() => {
    setDraft(createBlankDraft());
    setLoadedEventId(null);
  }, []);

  // 直接以一個 draft 覆寫（用於載入既有草稿、undo/redo 等）。
  const replaceDraft = useCallback((nextDraft, eventId = null) => {
    setDraft(nextDraft);
    setLoadedEventId(eventId);
  }, []);

  // 從後端 event payload 載入。
  const loadFromPayload = useCallback((payload, eventId = null) => {
    const loaded = createDraftFromEventPayload(payload);
    setDraft(loaded);
    setLoadedEventId(eventId);
    return loaded;
  }, []);

  // 更新一個方框元素（含其元資料）。
  const updateElement = useCallback(
    (elementId, patch) => {
      setDraft((prev) => {
        const element = elementsById[elementId];
        if (!element) return prev;
        const nextCanvas = updatePath(prev.overWriteCanvas, element.path, (current) => ({
          ...(current && typeof current === 'object' ? current : {}),
          ...patch
        }));
        return { ...prev, overWriteCanvas: nextCanvas };
      });
    },
    [elementsById]
  );

  // 更新 overWriteCanvas 底層欄位（如 canvas.*、upload.*、fontColor、baseImagePath）。
  const updateMeta = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      overWriteCanvas: {
        ...prev.overWriteCanvas,
        ...patch
      }
    }));
  }, []);

  // 設定草稿的起始日期（draft.startDate）。
  const setStartDate = useCallback((date) => {
    setDraft((prev) => ({
      ...prev,
      startDate: date || ''
    }));
  }, []);

  // 更新 canvas 尺寸等巢狀設定（path 為 'canvas.width' 形式）。
  const updateNestedMeta = useCallback((pathStr, patch) => {
    setDraft((prev) => {
      const path = pathStr.split('.');
      const cloneRoot = clone(prev);
      const parent = ensurePath(cloneRoot.overWriteCanvas, path);
      const key = path[path.length - 1];
      parent[key] = { ...(parent[key] || {}), ...patch };
      return cloneRoot;
    });
  }, []);

  // 調整畫布尺寸，並按比例縮放所有元素的方框座標與大小。
  const resizeCanvas = useCallback((newWidth, newHeight) => {
    setDraft((prev) => {
      const canvas = prev.overWriteCanvas.canvas || {};
      const oldWidth = canvas.width || 1220;
      const oldHeight = canvas.height || 700;
      const scaleX = newWidth / oldWidth;
      const scaleY = newHeight / oldHeight;
      const next = clone(prev);
      next.overWriteCanvas.canvas = {
        ...next.overWriteCanvas.canvas,
        width: newWidth,
        height: newHeight,
        downloadWidth: newWidth,
        downloadHeight: newHeight
      };
      next.overWriteCanvas = scaleOverWriteCanvas(next.overWriteCanvas, scaleX, scaleY);
      return next;
    });
  }, []);

  // 新增一個元素。回傳新元素的 id（若無法新增則回傳 null）。
  // spec: { type: 'imageSlot' }
  //        { type: 'titleImage' }
  //        { type: 'textPosition', field: 'nickname' | 'category' | 'message' }
  //        { type: 'categorySelection', name: string }
  const addElement = useCallback((spec) => {
    const { type } = spec || {};
    let createdId = null;
    setDraft((prev) => {
      const next = { ...prev };
      const canvas = ensureContainers(next.overWriteCanvas);
      next.overWriteCanvas = canvas;

      if (type === 'imageSlot') {
        const index = canvas.imageSlots.length;
        const key = `d${index + 1}`;
        const slot = {
          key,
          label: `第${index + 1}天`,
          x: 50 + (index % 5) * 20,
          y: 80,
          width: 400,
          height: Math.round(canvas.canvas?.height * 0.76) || 500,
          dateRole: {
            ...buildBlankBox('textPositions', 'message'),
            x: 50,
            y: 90,
            width: 400,
            height: 60,
            fontSize: 26
          }
        };
        canvas.imageSlots.push(slot);
        createdId = `imageSlots.${index}`;
      } else if (type === 'titleImage') {
        if (!canvas.titleImage || typeof canvas.titleImage !== 'object') {
          canvas.titleImage = buildBlankBox('titleImage');
        }
        createdId = 'titleImage';
      } else if (type === 'textPosition') {
        const { field } = spec;
        if (TEXT_POSITION_FIELDS.includes(field)) {
          if (!canvas.textPositions[field] || typeof canvas.textPositions[field] !== 'object') {
            canvas.textPositions[field] = buildBlankBox('textPositions', field);
          }
          createdId = `textPositions.${field}`;
        }
      } else if (type === 'categorySelection') {
        const { name } = spec;
        if (name && !canvas.categorySelection?.[name]) {
          if (!canvas.categorySelection || typeof canvas.categorySelection !== 'object') {
            canvas.categorySelection = {};
          }
          canvas.categorySelection[name] = createCategoryBox();
          createdId = `categorySelection.${name}`;
        } else if (name) {
          createdId = `categorySelection.${name}`;
        }
      }
      return next;
    });
    return createdId;
  }, []);

  // 新增一個身分圈選框（相容舊介面）。
  const addCategorySelection = useCallback(
    (name, { onCreated } = {}) => {
      const id = addElement({ type: 'categorySelection', name });
      if (onCreated && id) onCreated(id);
    },
    [addElement]
  );

  // 重新命名身分圈選框的 key。
  const renameCategory = useCallback((oldName, newName) => {
    setDraft((prev) => {
      const selection = prev.overWriteCanvas.categorySelection || {};
      if (oldName === newName || selection[newName] || !selection[oldName]) {
        return prev;
      }
      const nextSelection = { ...selection };
      nextSelection[newName] = nextSelection[oldName];
      delete nextSelection[oldName];
      return {
        ...prev,
        overWriteCanvas: { ...prev.overWriteCanvas, categorySelection: nextSelection }
      };
    });
  }, []);

  // 刪除可刪除的元素（單一元素也可刪，之後可再以 addElement 重建）。
  const removeElement = useCallback(
    (elementId) => {
      const element = elementsById[elementId];
      if (!element) return;
      setDraft((prev) => {
        const canvas = ensureContainers(prev.overWriteCanvas);
        const { group } = element;
        if (group === 'categorySelection') {
          const selection = { ...(canvas.categorySelection || {}) };
          delete selection[elementId.slice('categorySelection.'.length)];
          if (Object.keys(selection).length === 0) canvas.categorySelection = null;
          else canvas.categorySelection = selection;
        } else if (group === 'titleImage') {
          canvas.titleImage = undefined; // 連 key 一起移除，允許重新新增
          delete canvas.titleImage;
        } else if (group === 'textPositions') {
          const field = elementId.slice('textPositions.'.length);
          if (canvas.textPositions) {
            const next = { ...canvas.textPositions };
            delete next[field];
            canvas.textPositions = next;
          }
        } else if (group === 'imageSlots') {
          const index = element.path?.[1];
          if (typeof index === 'number') {
            canvas.imageSlots.splice(index, 1);
          }
        }
        return { ...prev, overWriteCanvas: canvas };
      });
    },
    [elementsById]
  );

  // 複製一個元素（陣列元素拷貝一份；單一元素回傳 null）。
  const duplicateElement = useCallback(
    (elementId) => {
      const element = elementsById[elementId];
      if (!element) return null;
      if (element.group === 'imageSlots') {
        const index = element.path?.[1];
        let newId = null;
        setDraft((prev) => {
          const canvas = ensureContainers(prev.overWriteCanvas);
          if (typeof index === 'number' && canvas.imageSlots[index]) {
            const copy = clone(canvas.imageSlots[index]);
            copy.key = `d${Date.now()}`;
            copy.label = `${copy.label || '天'} 副本`;
            canvas.imageSlots.push(copy);
            newId = `imageSlots.${canvas.imageSlots.length - 1}`;
          }
          return { ...prev, overWriteCanvas: canvas };
        });
        return newId;
      }
      return null;
    },
    [elementsById]
  );

  // 檢查某個單一元素是否存在。
  const hasElement = useCallback(
    (elementId) => !!elementsById[elementId] || elementsById[elementId] !== undefined,
    [elementsById]
  );

  // 直接設定圖片槽數量（用於工具列的「＋/－」或直接輸入數字）。
  const setSlotCount = useCallback((nextCount) => {
    const clamped = Math.max(0, Math.floor(Number(nextCount) || 0));
    setDraft((prev) => {
      const canvas = ensureContainers(prev.overWriteCanvas);
      const current = canvas.imageSlots.length;
      if (clamped === current) return prev;
      const next = { ...prev, overWriteCanvas: canvas };

      if (clamped > current) {
        // 補齊到目標數量
        while (next.overWriteCanvas.imageSlots.length < clamped) {
          const index = next.overWriteCanvas.imageSlots.length;
          next.overWriteCanvas.imageSlots.push({
            key: `d${index + 1}`,
            label: `第${index + 1}天`,
            x: 50 + (index % 5) * 20,
            y: 80,
            width: 400,
            height: Math.round((next.overWriteCanvas.canvas?.height || 700) * 0.76),
            dateRole: {
              ...buildBlankBox('textPositions', 'message'),
              x: 50,
              y: 90,
              width: 400,
              height: 60,
              fontSize: 26
            }
          });
        }
      } else {
        next.overWriteCanvas.imageSlots = next.overWriteCanvas.imageSlots.slice(0, clamped);
      }
      return next;
    });
  }, []);

  return {
    draft,
    elements,
    elementsById,
    loadedEventId,
    resetFromTemplate,
    clearAll,
    replaceDraft,
    loadFromPayload,
    updateElement,
    updateMeta,
    updateNestedMeta,
    resizeCanvas,
    setStartDate,
    addElement,
    addCategorySelection,
    renameCategory,
    removeElement,
    duplicateElement,
    setSlotCount,
    hasElement
  };
}

export { EMPTY_FN };
