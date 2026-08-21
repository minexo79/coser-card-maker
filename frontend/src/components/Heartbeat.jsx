import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { ping } from '../services/api';

const POLL_INTERVAL_MS = 5000;

const Heartbeat = () => {
  const [status, setStatus] = useState('checking');
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const startedAt = performance.now();

      try {
        const data = await ping();
        if (cancelled) return;

        if (data?.status === 'ok') {
          setStatus('online');
          setLatencyMs(Math.max(Math.round(performance.now() - startedAt), 0));
        } else {
          setStatus('offline');
          setLatencyMs(null);
        }
        setLastCheckedAt(new Date());
      } catch (error) {
        if (cancelled) return;
        console.error('> Heartbeat check failed:', error);
        setStatus('offline');
        setLatencyMs(null);
        setLastCheckedAt(new Date());
      } finally {
        if (!cancelled) {
          timerRef.current = setTimeout(check, POLL_INTERVAL_MS);
        }
      }
    };

    check();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, []);

  const dotColorClass =
    status === 'online'
      ? 'bg-green-500 animate-pulse'
      : status === 'offline'
        ? 'bg-red-500'
        : 'bg-gray-400 animate-pulse';

  const statusText =
    status === 'online' ? '後端上線' : status === 'offline' ? '後端離線' : '檢查中…';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl card-shadow p-10 w-full max-w-sm text-center">
        <h1 className="text-xl text-gray-800 mb-8 flex items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          後端伺服器狀態
        </h1>

        <div className="flex flex-col items-center gap-4">
          <div
            data-testid="heartbeat-dot"
            className={`w-16 h-16 rounded-full ${dotColorClass} transition-colors duration-300`}
          />
          <p className="text-lg font-medium text-gray-800">{statusText}</p>
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

export default Heartbeat;
