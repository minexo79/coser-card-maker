import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, Sparkles, AlertTriangle, FaceSlightlyFrowning } from 'lucide-react';
import { Skeleton } from './Loader';
import * as api from '../services/api.js';
import { resolveAssetUrl } from '../services/api.js';
import { filterThisWeek, formatEventDateRange } from '../utils/eventCalendar.js';
import { getEventDisplayName } from '../utils/eventDisplay.js';

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
    <div className="container mx-auto px-4 pb-4 pt-10 md:pt-16">
      <div>
        <header className="mb-10 animate-fade-up">
          <h1 className="border-l-4 border-accent pl-4 text-4xl leading-tight text-fg md:text-5xl">本週場次</h1>
          <p className="mt-3 pl-5 text-muted">挑選一個場次，開始製作你的預定</p>
        </header>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          // 骨架屏：版面與實際場次卡片一致，載入完成時不會跳動
          <div role="status" aria-label="載入中" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                  <Skeleton className="mt-4 h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : weekEvents.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border border-dashed border-line py-16 text-center">
            <FaceSlightlyFrowning className="mx-auto mb-3 h-12 w-12 text-subtle" />
            <p className="text-sm text-fg-soft">本週暫無場次</p>
            <p className="mt-1 text-xs text-muted">可以換個時間再來看看</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weekEvents.map((event, index) => (
              <div
                key={event.id}
                className="flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-200 hover:border-accent"
                style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
              >
                <div className="h-36 w-full overflow-hidden bg-line">
                  {event.overWriteCanvas?.baseImagePath ? (
                    <img
                      src={resolveAssetUrl(event.overWriteCanvas.baseImagePath)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-subtle">
                      無底圖
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {/* 顯示活動名稱；導向路由仍使用 event.id（活動代號） */}
                  <p className="truncate font-medium text-fg">{getEventDisplayName(event)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatEventDateRange(event)}
                    {event.dayCount ? `・${event.dayCount} 天` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/${encodeURIComponent(event.id)}`)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-fg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-white"
                  >
                    <PenLine className="h-4 w-4" />
                    製作預定
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 想要自己來? */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-line pt-8">
          <p className="text-sm text-muted">上面都沒有嗎？</p>
          <button
            type="button"
            onClick={() => navigate('/make')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <Sparkles className="h-4 w-4" />
            我要自己來!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
