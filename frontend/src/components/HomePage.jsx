import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2, PenLine, Sparkles, AlertTriangle } from 'lucide-react';
import * as api from '../services/api.js';
import { resolveAssetUrl } from '../services/api.js';
import { filterThisWeek, formatEventDateRange } from '../utils/eventCalendar.js';

const HomePage = () => {
  const navigate = useNavigate();
  const [rawTemplates, setRawTemplates] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getEventTemplates({ silent: true })
      .then((data) => {
        if (!cancelled) {
          const entries = Object.entries(data || {}).map(([id, value]) => ({ id, ...(value || {}) }));
          setRawTemplates(entries);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || '載入場次失敗');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const weekEvents = useMemo(() => {
    const filtered = filterThisWeek(rawTemplates || []);
    return [...filtered].sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  }, [rawTemplates]);

  const loading = rawTemplates === null && !error;

  return (
    <div className="container mx-auto p-4">
      {/* <div className="rounded-2xl bg-white p-6 shadow-xl card-shadow"> */}
      <div className="rounded-2xl p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl text-gray-800 mb-1 flex items-center justify-center gap-2">
            <CalendarDays className="w-6 h-6 text-orange-600" />
            本週場次
          </h1>
          <p className="text-sm text-gray-500">挑選一個場次，開始製作你的預訂</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            載入中…
          </div>
        ) : weekEvents.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-gray-500" />
            <p className="text-sm text-gray-400">本週暫無場次</p>
            <p className="mt-1 text-xs text-gray-500">可以換個時間再來看看，或自己動手做</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weekEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-36 w-full overflow-hidden rounded-t-xl bg-gray-100">
                  {event.overWriteCanvas?.baseImagePath ? (
                    <img
                      src={resolveAssetUrl(event.overWriteCanvas.baseImagePath)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
                      無底圖
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="truncate font-medium text-gray-800">{event.id}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatEventDateRange(event)}
                    {event.dayCount ? `・${event.dayCount} 天` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/${encodeURIComponent(event.id)}`)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                  >
                    <PenLine className="h-4 w-4" />
                    製作預訂
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 想要自己來? */}
        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <p className="mb-3 text-sm text-gray-500">上面都沒有嗎？</p>
          <button
            type="button"
            onClick={() => navigate('/make')}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-orange-600 px-5 py-2.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
          >
            <Sparkles className="h-4 w-4" />
            我想要自己來!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
