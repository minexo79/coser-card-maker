import { useState, useEffect } from 'react';
import { listAuditLogs } from '../../services/auth';

const EVENT_LABELS = {
  login_success: '登入成功',
  login_failure: '登入失敗',
  password_change: '密碼變更',
  password_reset: '密碼重設',
  user_create: '使用者建立',
  user_delete: '使用者刪除',
  template_upsert: '模板更新',
  template_delete: '模板刪除',
};

const badgeClass = (event) => {
  if (event.includes('failure') || event.includes('delete') || event.includes('reset')) {
    return 'bg-red-100 text-red-700';
  }
  if (event.includes('success') || event.includes('create')) {
    return 'bg-green-100 text-green-700';
  }
  return 'bg-gray-100 text-gray-700';
};

const AuditLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listAuditLogs(100)
      .then(setLogs)
      .catch((err) => setError(err.detail || '載入失敗'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">載入中...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="mb-6">
      <h2 className="text-lg text-gray-800 mb-4">審計日誌</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">暫無記錄</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {logs.map((log, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass(log.event)}`}>
                    {EVENT_LABELS[log.event] || log.event}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <dl className="mt-2.5 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-12 shrink-0 text-gray-400">操作者</dt>
                    <dd className="min-w-0 break-all text-gray-700">{log.actor || '-'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-12 shrink-0 text-gray-400">目標</dt>
                    <dd className="min-w-0 break-all text-gray-700">{log.target || '-'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-12 shrink-0 text-gray-400">IP</dt>
                    <dd className="min-w-0 break-all text-gray-500">{log.ip || '-'}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="py-2 pr-4">時間</th>
                  <th className="py-2 pr-4">事件</th>
                  <th className="py-2 pr-4">操作者</th>
                  <th className="py-2 pr-4">目標</th>
                  <th className="py-2 pr-4">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass(log.event)}`}>
                        {EVENT_LABELS[log.event] || log.event}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{log.actor || '-'}</td>
                    <td className="py-2 pr-4 text-gray-700">{log.target || '-'}</td>
                    <td className="py-2 pr-4 text-gray-500">{log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogList;
