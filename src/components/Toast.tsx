import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-notifications-container"
      className="fixed top-16 left-0 right-0 z-50 pointer-events-none px-4 flex flex-col items-center gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#5E5365] dark:text-[#CC8B79] shrink-0" />
  };

  const bgStyles = {
    success: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200',
    error: 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200',
    warning: 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200',
    info: 'border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79]'
  };

  return (
    <div
      id={`toast-item-${toast.id}`}
      className={`pointer-events-auto max-w-sm w-full p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all animate-bounce-subtle ${bgStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">{toast.title}</h4>}
        <p className="text-xs sm:text-sm font-medium leading-snug break-words">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
