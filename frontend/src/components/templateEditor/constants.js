// 編輯器的靜態設定與樣式對照，集中管理便於調整。

// 每個編輯元素群組的中文標籤。
export const GROUP_LABELS = {
  titleImage: '標題圖',
  imageSlots: '圖片槽',
  dateRole: '出角列',
  textPositions: '文字位置',
  categorySelection: '身分圈選'
};

// 畫布元素繪製時的外框配色（不含選取態）。
export const GROUP_COLORS = {
  titleImage: '#8b5cf6',
  imageSlots: '#f97316',
  dateRole: '#ec4899',
  textPositions: '#10b981',
  categorySelection: '#ef4444',
  default: '#9ca3af'
};

// 用於資料夾資訊流中安全取得顏色。
export function groupColor(group) {
  return GROUP_COLORS[group] || GROUP_COLORS.default;
}

// 各群組在版面樹中的顯示順序。
export const GROUP_ORDER = [
  'titleImage',
  'imageSlots',
  'dateRole',
  'textPositions',
  'categorySelection'
];

// 可透過屬性面板調整的數字欄位（依類型區分，避免全部一起出現在所有元素）。
export const BOX_NUMERIC_FIELDS = ['x', 'y', 'width', 'height'];
export const OPTIONAL_NUMERIC_FIELDS = ['fontSize', 'lineHeight', 'radius'];

// 數字欄位對應中文標籤。
export const FIELD_LABELS = {
  x: 'X',
  y: 'Y',
  width: '寬',
  height: '高',
  fontSize: '字級',
  lineHeight: '行高',
  radius: '圓角'
};

// 身分圈選的候選身分清單（於編輯器建立新圈選框時使用）。
export const DEFAULT_CATEGORIES = ['COSER', '攝影', '路人'];
