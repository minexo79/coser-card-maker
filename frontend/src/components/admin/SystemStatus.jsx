import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { getSystemStatus } from '../../services/auth';
import Loader from '../Loader';

const SystemStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSystemStatus()
      .then(setData)
      .catch((err) => setError(err.detail || '載入失敗'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader className="py-10" />;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  const envEntries = data.environment ? Object.entries(data.environment) : [];

  return (
    <div className="mb-6">
      <h2 className="text-xl text-fg mb-4">系統狀態</h2>

      {/* 版本標示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-subtle mb-1">
            <Info className="w-4 h-4" />
            前端版本
          </div>
          <p className="text-xl font-semibold text-fg">{data.frontendVersion || '-'}</p>
          <p className="mt-2 text-xs text-subtle">
            Node.js <span className="text-fg-soft">{data.frontendNodeVersion || '-'}</span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-xs text-subtle mb-1">
            <Info className="w-4 h-4" />
            後端版本
          </div>
          <p className="text-xl font-semibold text-fg">{data.backendVersion || '-'}</p>
          <p className="mt-2 text-xs text-subtle">
            Python <span className="text-fg-soft">{data.backendPythonVersion || '-'}</span>
          </p>
        </div>
      </div>

      {/* 環境變數 */}
      <h3 className="text-sm text-muted mb-2">系統環境變數</h3>
      {envEntries.length === 0 ? (
        <p className="text-sm text-muted">暫無資料</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-2 md:hidden">
            {envEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-line bg-surface p-3">
                <div className="text-xs font-medium text-subtle">{key}</div>
                <div className="text-sm text-fg-soft break-all">{value || '-'}</div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted border-b">
                <tr>
                  <th className="py-2 pr-4">變數</th>
                  <th className="py-2 pr-4">值</th>
                </tr>
              </thead>
              <tbody>
                {envEntries.map(([key, value]) => (
                  <tr key={key} className="border-b border-line">
                    <td className="py-2 pr-4 font-medium text-fg-soft whitespace-nowrap">{key}</td>
                    <td className="py-2 pr-4 text-fg-soft break-all">{value || '-'}</td>
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

export default SystemStatus;
