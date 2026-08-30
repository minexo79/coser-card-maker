import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../../services/api.js';
import { serializeDraft } from '../../utils/templateDraft.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import { useTemplateDraft } from './useTemplateDraft.js';
import TemplateCanvas from './TemplateCanvas.jsx';
import ElementList from './ElementList.jsx';
import PropertyPanel from './PropertyPanel.jsx';
import Toolbar from './Toolbar.jsx';

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
        const payload = await api.getEventTemplate(trimmed, { silent: true });
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

  useEffect(() => {
    if (queryEvent && queryEvent !== loadedEventId) {
      loadTemplateById(queryEvent); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [queryEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadEvent = useCallback(() => {
    return loadTemplateById(eventId);
  }, [eventId, loadTemplateById]);

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

  // const handleSelectSlotImage = useCallback(
  //   (elementId) => (event) => {
  //     const file = event.target.files?.[0];
  //     if (file) {
  //       const url = URL.createObjectURL(file);
  //       setSlotImageURLs((prev) => ({ ...prev, [elementId]: url }));
  //     }
  //     event.target.value = '';
  //   },
  //   []
  // );

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

  return (
    <div className="min-h-screen">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl text-gray-800">模板編輯器</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isLoadedTemplate ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isLoadedTemplate ? `已載入：${loadedEventId}` : '使用「＋新增」加入元素'}
          </span>
        </div>
      </div>

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
        onNewCategory={handleAddCategory}
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
          <p className="mt-2 text-[11px] text-gray-500">
            提示：按著方框拖曳可移動，拖曳四角可縮放；於下方「每日照片預覽」上傳照片可預覽照片顯示效果。
          </p>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm text-gray-700">活動資訊</h3>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-500">活動 ID</span>
                <input
                  data-testid="template-event-id"
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  onBlur={handleLoadEvent}
                  placeholder="event-name"
                  maxLength={64}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-500">起始日期</span>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    data-testid="template-start-date"
                    type="date"
                    min="2001-01-01"
                    max="2099-12-31"
                    value={draft?.startDate || ''}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 pl-7 text-sm"
                    style={{ WebkitAppearance: 'none', appearance: 'none', color: '#000', backgroundColor: '#fff', colorScheme: 'light' }}
                    title="活動起始日期"
                  />
                </div>
              </label>
            </div>
          </div>

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

      {toast && <Toast type={toast.type} message={toast.message} />}
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

export default TemplateEditor;
