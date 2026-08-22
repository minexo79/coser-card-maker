import { useEffect, useState } from 'react';
import { AlertTriangle, FolderOpen, Loader2, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import { resolveAssetUrl } from '../../services/api.js';
import * as api from '../../services/api.js';

const TemplateListModal = ({ onClose, onLoad, onDelete }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleReload = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getEventTemplates()
      .then((data) => {
        if (cancelled) return;
        const entries = Object.entries(data || {}).map(([id, value]) => ({
          id,
          ...(value || {})
        }));
        entries.sort((a, b) => b.id.localeCompare(a.id));
        setTemplates(entries);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || '載入模板清單失敗');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleLoadClick = async (id) => {
    setBusyId(id);
    try {
      await onLoad?.(id);
      onClose?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm(`確定要刪除活動模板「${id}」嗎？此操作無法復原。`)) return;
    try {
      await onDelete?.(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e?.message || '刪除失敗');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">已儲存的模板</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReload}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="重新整理"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 清單 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              載入中…
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="mx-auto mb-3 h-12 w-12 text-gray-200" />
              <p className="text-sm text-gray-400">目前沒有任何已儲存的模板</p>
              <p className="mt-1 text-xs text-gray-300">請先在上方輸入活動 ID 並點擊「儲存」</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {templates.map((template) => (
                <li key={template.id} className="flex items-center gap-4 py-3">
                  {/* 底圖縮圖 */}
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                    {template.overWriteCanvas?.baseImagePath ? (
                      <img
                        src={resolveAssetUrl(template.overWriteCanvas.baseImagePath)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] text-gray-300">
                        無底圖
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{template.id}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {template.dayCount ?? 0} 天
                      {template.startDate ? `・${template.startDate}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadClick(template.id)}
                    disabled={busyId === template.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busyId === template.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(template.id)}
                    disabled={busyId === template.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateListModal;
