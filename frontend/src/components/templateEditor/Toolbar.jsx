import { useState } from 'react';
import {
  Calendar,
  Eye,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  MessageSquareText,
  Minus,
  Palette,
  Plus,
  RefreshCw,
  Save,
  StickyNote,
  Tags,
  Type
} from 'lucide-react';

const styles = {
  btn: 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
  icon: 'h-4 w-4'
};

const menuCls =
  'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

const normalizeHex = (color) =>
  typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : null;

const Toolbar = ({
  onBaseImageClick,
  onAddTitleImage,
  onAddTextPosition,
  onReset,
  fontColor = null,
  onFontColorChange,
  showLabels,
  onToggleLabels,
  onSave,
  saving = false,
  dayCount = 0,
  onDayChange,
  dayCountDisabled = false,
  eventId = '',
  onEventIdChange,
  onLoadEvent,
  onNewCategory,
  startDate = '',
  onStartDateChange,
  onShowTemplateList
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const addMenuItem = (label, handler, key = label, testId) => (
    <button
      key={key}
      type="button"
      data-testid={testId}
      className={menuCls}
      onClick={() => {
        setMenuOpen(false);
        handler?.();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onShowTemplateList}
        className={`${styles.btn} ${styles.secondary}`}
        title="檢視與編輯已儲存的模板"
      >
        <FolderOpen className={styles.icon} />
        模板清單
      </button>

      <button
        type="button"
        onClick={onBaseImageClick}
        className={`${styles.btn} ${styles.secondary}`}
        title="上傳活動底圖"
      >
        <ImagePlus className={styles.icon} />
        上傳底圖
      </button>

      {/* 新增元素主力按鈕 + 下拉選單 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`${styles.btn} ${styles.secondary}`}
        >
          <Plus className={styles.icon} />
          新增元素
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
              <div className="border-b border-gray-100 px-3 py-1 text-xs font-medium text-gray-400">
                新增到版面
              </div>
              {addMenuItem(
                <><ImageIcon className="h-4 w-4" /> 圖片槽（每天一張）</>,
                () => onDayChange?.((dayCount || 0) + 1),
                'image-slot',
                'add-menu-image-slot'
              )}
              {addMenuItem(
                <><StickyNote className="h-4 w-4" /> 標題圖</>,
                onAddTitleImage,
                'title-image'
              )}
              {addMenuItem(
                <><Type className="h-4 w-4" /> 暱稱（單一）</>,
                () => onAddTextPosition?.('nickname'),
                'text-nickname'
              )}
              {addMenuItem(
                <><MessageSquareText className="h-4 w-4" /> 留言（單一）</>,
                () => onAddTextPosition?.('message'),
                'text-message'
              )}
              {addMenuItem(
                <><Tags className="h-4 w-4" /> 身分圈選</>,
                onNewCategory,
                'category'
              )}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onReset}
        className={`${styles.btn} ${styles.secondary}`}
        title="清空目前所有編輯內容"
      >
        <RefreshCw className={styles.icon} />
        清空
      </button>

      <button type="button" onClick={onToggleLabels} className={`${styles.btn} ${styles.secondary}`}>
        {showLabels ? <Eye className={styles.icon} /> : <EyeOff className={styles.icon} />}
        {showLabels ? '隱藏標籤' : '顯示標籤'}
      </button>

      <div className="mx-1 h-8 w-px bg-gray-200" />

      {/* TODO: 有BUG 先註解掉不用 */}
      {/* <label className="flex flex-col">
        <span className="text-[11px] text-gray-500">圖片槽數</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={dayCountDisabled}
            onClick={() => {
              if (dayCount > 1) onDayChange?.(dayCount - 1);
              else onDayChange?.(0);
            }}
            className="inline-flex h-8 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            title="移除最後一個圖片槽"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            data-testid="template-day-count"
            type="number"
            min="0"
            max="30"
            value={dayCount}
            disabled={dayCountDisabled}
            onChange={(e) => onDayChange?.(Number(e.target.value))}
            className="w-14 rounded-md border border-gray-300 px-1 py-1 text-center text-sm"
          />
          <button
            type="button"
            disabled={dayCountDisabled}
            onClick={() => onDayChange?.((dayCount || 0) + 1)}
            className="inline-flex h-8 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            title="新增一個圖片槽"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </label> */}

      <button type="button" onClick={onToggleLabels} className="hidden" />

      <label className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" title="文字顏色（儲存後由製卡端使用）">
        <Palette className="h-4 w-4 text-gray-500" />
        <input
          data-testid="template-font-color"
          type="color"
          value={normalizeHex(fontColor) || '#303030'}
          onChange={(e) => onFontColorChange?.(e.target.value)}
          className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>

      <div className="ml-auto flex items-end gap-2">
        <span className="text-[11px] text-gray-500">起始日期</span>
        <label className="flex flex-col">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              data-testid="template-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="w-50 rounded-md border border-gray-300 px-2 py-1 pl-7"
              title="活動起始日期"
            />
          </div>
        </label>
        <span className="text-[11px] text-gray-500">活動 ID</span>
        <label className="flex flex-col">
          <input
            data-testid="template-event-id"
            type="text"
            value={eventId}
            onChange={(e) => onEventIdChange(e.target.value)}
            onBlur={onLoadEvent}
            placeholder="event-name"
            maxLength={64}
            className="w-32 rounded-md border border-gray-300 px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`${styles.btn} ${styles.primary}`}
        >
          {saving ? <Loader2 className={`${styles.icon} animate-spin`} /> : <Save className={styles.icon} />}
          {saving ? '儲存中…' : '儲存'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
