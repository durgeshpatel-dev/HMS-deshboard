/**
 * Toast Notification Component
 * Lightweight, accessible toast system for HMS Dashboard
 */

import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-500 shrink-0" />,
  info:    <Info       size={18} className="text-blue-500 shrink-0" />,
};

const BG = {
  success: 'bg-white border-green-400',
  error:   'bg-white border-red-400',
  warning: 'bg-white border-yellow-400',
  info:    'bg-white border-blue-400',
};

/**
 * Single Toast item
 */
const ToastItem = ({ id, type = 'info', message, onDismiss, duration = 4000 }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => onDismiss(id), duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[260px] max-w-sm
        animate-slide-in ${BG[type]}`}
    >
      {ICONS[type]}
      <p className="text-sm text-gray-800 flex-1 leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1 shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * Toast Container – renders all active toasts
 * Place once in your root layout or page.
 */
const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
