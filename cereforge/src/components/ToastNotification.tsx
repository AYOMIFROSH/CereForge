import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hook';
import { selectToasts, removeToast } from '../store/slices/uiSlice';

/**
 * ✅ Toast Notifications Component
 * Displays inline error messages with dismiss
 */
export function ToastNotifications() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectToasts);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch(removeToast(toast.id))}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  onDismiss: () => void;
}

function Toast({ toast, onDismiss }: ToastProps) {

  // Auto-dismiss after duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, onDismiss]);

  // Get icon and colors based on type
  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`${config.bgColor} border-2 rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300 flex items-start space-x-3`}
      role="alert"
    >
      <div className={config.iconColor}>
        {config.icon}
      </div>
      
      <div className="flex-1">
        <p className={`${config.textColor} text-sm font-medium`}>
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={onDismiss}
        className={`${config.textColor} hover:opacity-70 transition-opacity`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}