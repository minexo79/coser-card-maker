// 純函式的幾何與數字工具，供畫布拖曳／縮放／屬性面板共用，方便單元測試。

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// 四捨五入到指定位小數（預設整數），避免小數浮點誤差。
export const round = (value, digits = 0) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const toInt = (value) => {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? Math.round(num) : 0;
};

// 將方框限制在畫布邊界內，並維持最小尺寸，避免拖出畫布造成不可見。
export function clampBox(box, bounds, options = {}) {
  const minSize = options.minSize ?? 1;
  const width = clamp(toInt(box.width), minSize, bounds.width);
  const height = clamp(toInt(box.height), minSize, bounds.height);
  return {
    x: clamp(toInt(box.x), 0, Math.max(0, bounds.width - width)),
    y: clamp(toInt(box.y), 0, Math.max(0, bounds.height - height)),
    width,
    height
  };
}

// 依照給定的縮放句柄（n/s/e/w 組合）套用新的矩形，處理負數寬高等情況。
// 回傳正規化後的 { rect, flipped: {x:boolean, y:boolean} }，呼叫端應以此更新值。
export function normalizeRect(rect, minSize = 10) {
  let { x = 0, y = 0, width = 0, height = 0 } = rect || {};
  let flippedX = false;
  let flippedY = false;

  if (width < 0) {
    x += width;
    width = Math.abs(width);
    flippedX = true;
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
    flippedY = true;
  }

  width = Math.max(width, minSize);
  height = Math.max(height, minSize);

  return { rect: { x, y, width, height }, flipped: { x: flippedX, y: flippedY } };
}

// 根據邊界與最少尺寸，將方框限制於邊界內（不縮放，只夾擠座標）。
export function keepInBounds(box, bounds) {
  const width = Math.min(box.width, bounds.width);
  const height = Math.min(box.height, bounds.height);
  return {
    x: clamp(box.x, 0, Math.max(0, bounds.width - width)),
    y: clamp(box.y, 0, Math.max(0, bounds.height - height)),
    width,
    height
  };
}
