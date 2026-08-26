import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderOpen, ImagePlus, Share2, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../../services/api.js';
import { serializeDraft } from '../../utils/templateDraft.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import { useTemplateDraft } from './useTemplateDraft.js';
import TemplateCanvas from './TemplateCanvas.jsx';
import ElementList from './ElementList.jsx';
import PropertyPanel from './PropertyPanel.jsx';
import Toolbar from './Toolbar.jsx';
import TemplateListModal from './TemplateListModal.jsx';

const SAVED_EVENT_KEY = 'ccm_template_editor_last_event';
const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const isValidEventId = (id) => EVENT_ID_PATTERN.test(id || '');

const Toast = ({ type, message }) => {
  const isError = type === 'error';
  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
        isError ? 'bg-red-600' : 'bg-green-600'
      }`}
      role="alert"
    >
      {isError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
};

const TemplateEditor = () => {
  const [searchParams] = useSearchParams();
  const queryEvent = searchParams.get('event');
  // P1：將 /upload 的上傳功能整併為編輯器的「上傳資產」分頁
  const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'upload' ? 'assets' : 'layout'));

  const {
    draft,
    elements,
    elementsById,
    loadedEventId,
    updateElement,
    updateMeta,
    setStartDate,
    addElement,
    removeElement,
    loadFromPayload,
    clearAll,
    setSlotCount,
    resizeCanvas
  } = useTemplateDraft();

  const [selectedId, setSelectedId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [eventId, setEventId] = useState(() => {
    if (queryEvent) return queryEvent;
    try {
      return localStorage.getItem(SAVED_EVENT_KEY) || '';
    } catch {
      return '';
    }
  });
  const [slotImageURLs, setSlotImageURLs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const canvas = draft?.overWriteCanvas;
  // 圖片槽數即為天數（從 0 開始）
  const dayCount = Array.isArray(canvas?.imageSlots) ? canvas.imageSlots.length : 0;

  const loadTemplateById = useCallback(
    async (id) => {
      const trimmed = (id || '').trim();
      if (!isValidEventId(trimmed)) {
        showToast('無效的活動 ID', 'error');
        return false;
      }
      setIsLoading(true);
      try {
        const payload = await api.getEventTemplate(trimmed);
        loadFromPayload(payload, trimmed);
        setSelectedId(null);
        setSlotImageURLs({});
        setEventId(trimmed);
        showToast(`已載入活動「${trimmed}」`);
        return true;
      } catch (error) {
        console.error(error);
        showToast(
          error?.status === 404 ? `找不到活動「${trimmed}」` : '載入活動失敗，請檢查網路或 ID',
          'error'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadFromPayload, showToast]
  );

  const handleLoadEvent = useCallback(() => {
    return loadTemplateById(eventId);
  }, [eventId, loadTemplateById]);

  // 從「已儲存的模板」清單載入
  const handleLoadFromList = useCallback(
    async (id) => {
      await loadTemplateById(id);
    },
    [loadTemplateById]
  );

  // 從「已儲存的模板」清單刪除
  const handleDeleteFromList = useCallback(
    async (id) => {
      const trimmed = (id || '').trim();
      if (!trimmed) return;
      await api.deleteEventTemplate(trimmed);
      if ((eventId || '').trim() === trimmed) {
        setEventId('');
      }
    },
    [eventId]
  );

  // 從 0 開始：直接設定圖片槽數量（天數連動）
  const handleSlotCountChange = useCallback(
    (count) => {
      setSlotCount(count);
    },
    [setSlotCount]
  );

  // 重設為空白
  const handleClearAll = useCallback(() => {
    if (!window.confirm('確定要清空目前所有編輯內容嗎？此操作無法復原。')) return;
    clearAll();
    setSelectedId(null);
    setSlotImageURLs({});
  }, [clearAll]);

  // 移除單一元素（供 PropertyPanel 刪除用）
  const handleRemoveElement = useCallback(
    (elementId) => {
      if (!elementId) return;
      if (window.confirm(`確定刪除「${elementsById[elementId]?.label || elementId}」？`)) {
        removeElement(elementId);
        setSelectedId((prev) => (prev === elementId ? null : prev));
      }
    },
    [elementsById, removeElement]
  );

  const handleToggleLabels = useCallback(() => setShowLabels((v) => !v), []);

  const handleAddCategory = useCallback(() => {
    const name = window.prompt('請輸入身分名稱（例如 COSER、攝影、路人）：');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('身分名稱不可為空', 'error');
      return;
    }
    addElement({ type: 'categorySelection', name: trimmed });
  }, [addElement, showToast]);

  const handleFileChangeForBase = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        event.target.value = '';
        return;
      }
      const url = URL.createObjectURL(file);
      updateMeta({ baseImagePath: url });
      const img = new Image();
      img.onload = () => {
        const newWidth = 1220;
        const newHeight = Math.round(newWidth * (img.naturalHeight / img.naturalWidth));
        resizeCanvas(newWidth, newHeight);
      };
      img.src = url;
      event.target.value = '';
    },
    [updateMeta, resizeCanvas]
  );

  const handleSelectSlotImage = useCallback(
    (elementId) => (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setSlotImageURLs((prev) => ({ ...prev, [elementId]: url }));
      }
      event.target.value = '';
    },
    []
  );

  const handleFontColorChange = useCallback(
    (color) => {
      updateMeta({ fontColor: color });
    },
    [updateMeta]
  );

  const handleSave = useCallback(async () => {
    let payload;
    try {
      payload = serializeDraft(draft);
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }

    const id = (eventId || '').trim();
    if (!isValidEventId(id)) {
      showToast('請先輸入有效的活動 ID（僅限英數、-、_，1~64 字元）', 'error');
      return;
    }

    setSaving(true);
    try {
      const overWriteCanvas = { ...payload.overWriteCanvas };
      const baseImagePath = overWriteCanvas.baseImagePath;
      // 若底圖是 blob:，先上傳取得伺服器 URL
      if (baseImagePath && baseImagePath.startsWith('blob:')) {
        const file = await blobUrlToFile(baseImagePath);
        const uploadedUrl = await api.uploadImage(file);
        overWriteCanvas.baseImagePath = uploadedUrl;
      }
      const finalPayload = {
        dayCount: payload.dayCount,
        startDate: payload.startDate,
        overWriteCanvas
      };
      await api.saveEventTemplate(id, finalPayload);
      localStorage.setItem(SAVED_EVENT_KEY, id);
      setEventId(id);
      const shareUrl = `${window.location.origin}/${id}`;
      console.log('分享連結：', shareUrl);
      try {
        const copied = await copyToClipboard(shareUrl);
        showToast(
          copied
            ? `儲存成功：${id}，分享連結已複製到剪貼簿`
            : `儲存成功：${id}（請手動複製：${shareUrl}）`
        );
      } catch {
        showToast(`儲存成功：${id}（請手動複製：${shareUrl}）`);
      }
    } catch (error) {
      console.error('儲存失敗：', error);
      showToast(error?.message || '儲存失敗，請檢查 token 後重試', 'error');
    } finally {
      setSaving(false);
    }
  }, [draft, eventId, showToast]);

  // 清空 blob URL（元件卸載時）
  useEffect(() => {
    return () => {
      setSlotImageURLs((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return prev;
      });
    };
  }, []);

  const selectedElement = selectedId ? elementsById[selectedId] : null;

  const baseImageSrc = useMemo(
    () => (canvas?.baseImagePath ? canvas.baseImagePath : ''),
    [canvas?.baseImagePath]
  );

  const isLoadedTemplate = !!loadedEventId;

  const tabs = [
    { key: 'layout', label: '版面編輯' },
    { key: 'assets', label: '底圖與資產' }
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1700px] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl text-gray-800">卡片版面編輯器</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                isLoadedTemplate ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isLoadedTemplate ? `已載入：${loadedEventId}` : '從空白開始（使用「＋新增」加入元素）'}
            </span>
          </div>
        </div>

        {/* 分頁列 */}
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'assets' ? (
        <AssetsPanel
          baseImagePath={canvas?.baseImagePath || ''}
          onBaseImageChange={(path) => {
            updateMeta({ baseImagePath: path });
            const img = new Image();
            img.onload = () => {
              const newWidth = 1220;
              const newHeight = Math.round(newWidth * (img.naturalHeight / img.naturalWidth));
              resizeCanvas(newWidth, newHeight);
            };
            img.src = path;
          }}
            elements={elements}
            slotImageURLs={slotImageURLs}
            onSlotImageSelect={handleSelectSlotImage}
          />
        ) : (
          <>
        <Toolbar
          onBaseImageClick={() => fileInputRef.current?.click()}
          onAddTitleImage={() => addElement({ type: 'titleImage' })}
          onAddTextPosition={(field) => addElement({ type: 'textPosition', field })}
          onReset={handleClearAll}
          fontColor={canvas?.fontColor ?? null}
          onFontColorChange={handleFontColorChange}
          showLabels={showLabels}
          onToggleLabels={handleToggleLabels}
          onSave={handleSave}
          saving={saving || isLoading}
          dayCount={dayCount}
          onDayChange={handleSlotCountChange}
          dayCountDisabled={isLoadedTemplate}
          eventId={eventId}
          onEventIdChange={setEventId}
          onLoadEvent={handleLoadEvent}
          onNewCategory={handleAddCategory}
          startDate={draft?.startDate || ''}
          onStartDateChange={setStartDate}
          onShowTemplateList={() => setShowList(true)}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChangeForBase}
        />

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="sticky top-2">
              <TemplateCanvas
                width={canvas?.canvas?.width || 1220}
                height={canvas?.canvas?.height || 700}
                elements={elements}
                selectedId={selectedId}
                baseImagePath={baseImageSrc}
                slotImages={slotImageURLs}
                onSelect={setSelectedId}
                onElementChange={(id, box) => updateElement(id, box)}
                onElementChangeEnd={() => {}}
                showLabels={showLabels}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              提示：按著方框拖曳可移動，拖曳四角可縮放；於下方「每日照片預覽」上傳照片可預覽照片顯示效果。
            </p>
          </div>

          <div className="w-full shrink-0 space-y-4 lg:w-80">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <ElementList
                elements={elements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveElement}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <PropertyPanel
                element={selectedElement}
                onUpdate={(patch) => selectedId && updateElement(selectedId, patch)}
                onRemove={() => selectedId && handleRemoveElement(selectedId)}
              />
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} />}

      {showList && (
        <TemplateListModal
          onClose={() => setShowList(false)}
          onLoad={handleLoadFromList}
          onDelete={handleDeleteFromList}
        />
      )}
    </div>
  );
};

async function blobUrlToFile(src) {
  const response = await fetch(src);
  const blob = await response.blob();
  const ext = (blob.type?.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const extMap = { jpeg: 'jpg' };
  return new File([blob], `base-${Date.now()}.${extMap[ext] || ext}`, {
    type: blob.type || 'image/png'
  });
}

// P1：整合舊 /upload 的活動底圖＋每日照片上傳（不依賴 useCardMaker，直接操作 overWriteCanvas）
const AssetsPanel = ({ baseImagePath, onBaseImageChange, elements, slotImageURLs, onSlotImageSelect }) => {
  const baseInputRef = useRef(null);

  return (
    <div className="space-y-6">
      {/* 活動底圖 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-gray-800">活動底圖</h3>
        <p className="mb-4 text-sm text-gray-500">
          上傳後會作為卡片的背景底圖。此為模板的唯一底圖，所有天共用。
        </p>
        <div className="flex items-start gap-6">
          <input
            ref={baseInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onBaseImageChange(URL.createObjectURL(file));
            }}
          />
          <button
            type="button"
            onClick={() => baseInputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            <UploadCloud className="h-4 w-4" />
            {baseImagePath ? '更換底圖' : '選擇底圖上傳'}
          </button>
          {baseImagePath && (
            <div className="w-48 overflow-hidden rounded-lg border border-gray-200">
              <img src={baseImagePath} alt="目前底圖" className="aspect-video w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* 每日照片預覽上傳 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-gray-800">每日照片預覽</h3>
        <p className="mb-4 text-sm text-gray-500">
          上傳測試照片，可即時預覽照片在各天版面中的顯示效果（不會寫入模板，僅供設計時確認）。
        </p>
        {elements.length === 0 ? (
          <p className="text-sm text-gray-400">目前尚無圖片槽，請先回「版面編輯」分頁新增圖片槽。</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {elements
              .filter((element) => element.group === 'imageSlots')
              .map((element) => (
                <label
                  key={element.id}
                  className="flex w-40 cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {slotImageURLs[element.id] ? (
                    <img
                      src={slotImageURLs[element.id]}
                      alt=""
                      className="h-16 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center rounded bg-gray-100 text-gray-400">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                  <span>{slotImageURLs[element.id] ? '更換' : '上傳'} {element.label}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSlotImageSelect(element.id)}
                  />
                </label>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;
