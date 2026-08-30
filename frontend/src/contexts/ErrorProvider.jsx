import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ErrorContext } from './ErrorContext';
import { subscribeError } from '../services/errorBus';

// 全域錯誤彈窗：監聽 errorBus，收到錯誤後以瀏覽器彈窗（modal）顯示代碼與資訊。
const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  useEffect(() => subscribeError(setError), []);

  const closeError = () => setError(null);

  const value = useMemo(
    () => ({ error, closeError }),
    [error]
  );

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {error && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          data-testid="error-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeError}
            data-testid="error-modal-backdrop"
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={closeError}
              aria-label="關閉錯誤視窗"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h2
                  id="error-modal-title"
                  className="text-lg font-semibold text-red-600"
                  data-testid="error-modal-code"
                >
                  {error.code}: {error.title}
                </h2>
                {error.message && (
                  <p className="mt-3 text-sm text-gray-700 break-words" data-testid="error-modal-message">
                    {error.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeError}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;
