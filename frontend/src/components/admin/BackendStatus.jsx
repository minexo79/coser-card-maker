import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { ping } from '../../services/api';

const POLL_INTERVAL_MS = 5000;

// 後端運行狀態（位於管理頁，一般使用者與管理員皆可見）。
// 定期 ping 後端 /api/ping；背景輪詢設為靜默，連不上時不觸發全域錯誤彈窗，
// 僅在此處以紅燈／狀態文字呈現。
const BackendStatus = ({ pollIntervalMs = POLL_INTERVAL_MS } = {}) => {
  const [status, setStatus] = useState('checking');
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const startedAt = performance.now();

      try {
        const data = await ping({ silent: true });
        if (cancelled) return;
        if (data?.status === 'ok') {
          setStatus('online');
          setLatencyMs(Math.max(Math.round(performance.now() - startedAt), 0));
        } else {
          setStatus('offline');
          setLatencyMs(null);
        }
        setLastCheckedAt(new Date());
      } catch {
        if (cancelled) return;
        setStatus('offline');
        setLatencyMs(null);
        setLastCheckedAt(new Date());
      } finally {
        if (!cancelled) {
          timerRef.current = setTimeout(check, pollIntervalMs);
        }
      }
    };

    check();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [pollIntervalMs]);

  const dotColorClass =
    status === 'online'
      ? 'bg-green-500 animate-pulse'
      : status === 'offline'
        ? 'bg-red-500'
        : 'bg-gray-400 animate-pulse';

  const statusText =
    status === 'online' ? '後端上線' : status === 'offline' ? '後端離線' : '檢查中…';

  return (
    <div className="mb-6">
      <h2 className="text-lg text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-600" />
        後端運行狀態
      </h2>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div
            data-testid="backend-status-dot"
            className={`w-16 h-16 rounded-full ${dotColorClass} transition-colors duration-300`}
          />
          <p className="text-lg font-medium text-gray-800" data-testid="backend-status-text">
            {statusText}
          </p>
          {lastCheckedAt && (
            <p className="text-xs text-gray-500">
              最後檢查：{lastCheckedAt.toLocaleTimeString()}
              {latencyMs !== null && `（${latencyMs} ms）`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendStatus;
