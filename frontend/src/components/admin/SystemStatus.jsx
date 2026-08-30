import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { getSystemStatus } from '../../services/auth';

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

  if (loading) return <p className="text-sm text-gray-500">載入中...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const envEntries = data.environment ? Object.entries(data.environment) : [];

  return (
    <div className="mb-6">
      <h2 className="text-lg text-gray-800 mb-4">系統狀態</h2>

      {/* 版本標示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Info className="w-4 h-4" />
            前端版本
          </div>
          <p className="text-xl font-semibold text-gray-800">{data.frontendVersion || '-'}</p>
          <p className="mt-2 text-xs text-gray-400">
            Node.js <span className="text-gray-700">{data.frontendNodeVersion || '-'}</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Info className="w-4 h-4" />
            後端版本
          </div>
          <p className="text-xl font-semibold text-gray-800">{data.backendVersion || '-'}</p>
          <p className="mt-2 text-xs text-gray-400">
            Python <span className="text-gray-700">{data.backendPythonVersion || '-'}</span>
          </p>
        </div>
      </div>

      {/* 環境變數 */}
      <h3 className="text-sm text-gray-500 mb-2">系統環境變數</h3>
      {envEntries.length === 0 ? (
        <p className="text-sm text-gray-500">暫無資料</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-2 md:hidden">
            {envEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-400">{key}</div>
                <div className="text-sm text-gray-700 break-all">{value || '-'}</div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="py-2 pr-4">變數</th>
                  <th className="py-2 pr-4">值</th>
                </tr>
              </thead>
              <tbody>
                {envEntries.map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">{key}</td>
                    <td className="py-2 pr-4 text-gray-600 break-all">{value || '-'}</td>
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
