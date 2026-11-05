import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] shadow-lg border text-[0.875rem] font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-[#15803D] text-white border-[#166534]'
              : toast.type === 'error'
              ? 'bg-[#DC2626] text-white border-[#B91C1C]'
              : 'bg-[#0F172A] text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-white/80 hover:text-white rounded-[4px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
