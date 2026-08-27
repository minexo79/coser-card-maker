import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FolderOpen, Loader2, Pencil, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { resolveAssetUrl } from '../../services/api.js';
import * as api from '../../services/api.js';
import { copyToClipboard } from '../../utils/clipboard.js';

const TemplateListPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleEdit = (id) => {
    navigate(`/admin?tab=templates&event=${encodeURIComponent(id)}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`確定要刪除活動模板「${id}」嗎？此操作無法復原。`)) return;
    setBusyId(id);
    try {
      await api.deleteEventTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e?.message || '刪除失敗');
    } finally {
      setBusyId(null);
    }
  };

  const handleShare = async (id) => {
    const shareUrl = `${window.location.origin}/${id}`;
    try {
      const copied = await copyToClipboard(shareUrl);
      setToastMessage(copied ? `分享連結已複製：${shareUrl}` : `請手動複製：${shareUrl}`);
    } catch {
      setToastMessage(`請手動複製：${shareUrl}`);
    }
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg text-gray-800 mb-4">已儲存的模板</h2>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重新整理
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Share2 className="h-4 w-4 shrink-0" />
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          載入中…
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm text-gray-400">目前沒有任何已儲存的模板</p>
          <p className="mt-1 text-xs text-gray-300">請先前往「模板編輯器」建立並儲存模板</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {templates.map((template) => (
            <li key={template.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:flex-nowrap">
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
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate font-medium text-gray-800">{template.id}</p>
                  {template.createdBy ? (
                    <span className="shrink-0 max-w-24 truncate rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-500" title={`建立者：${template.createdBy}`}>
                      {template.createdBy}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-normal text-emerald-600" title="舊模板，所有人皆可編輯">
                      共用模板
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {template.dayCount ?? 0} 天
                  {template.startDate ? `・${template.startDate}` : ''}
                </p>
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(template.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 md:flex-none md:py-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  編輯
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(template.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 md:flex-none md:py-1.5"
                  title="複製分享連結"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  分享
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(template.id)}
                  disabled={busyId === template.id}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 md:py-1.5"
                >
                  {busyId === template.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TemplateListPage;
