import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Floating Container */}
      <div
        className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100%-2rem)]"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 p-3 rounded-xl border shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                isSuccess
                  ? 'bg-white border-emerald-200 text-emerald-900 shadow-emerald-500/5'
                  : isError
                  ? 'bg-white border-red-200 text-red-900 shadow-red-500/5'
                  : isWarning
                  ? 'bg-white border-amber-200 text-amber-900 shadow-amber-500/5'
                  : 'bg-white border-blue-200 text-blue-900 shadow-blue-500/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                  isSuccess
                    ? 'bg-emerald-500'
                    : isError
                    ? 'bg-red-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              >
                {isSuccess && <Check className="w-4 h-4 stroke-[2.5]" />}
                {isError && <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
                {isInfo && <Info className="w-4 h-4 stroke-[2.5]" />}
              </div>

              <div className="flex-1 text-xs font-semibold leading-snug">
                {t.message}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
