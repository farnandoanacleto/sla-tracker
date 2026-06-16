import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TToastType = 'success' | 'error' | 'info';

export interface IToast {
  id: string;
  message: string;
  type: TToastType;
}

interface IToastContext {
  showToast: (message: string, type?: TToastType) => void;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const showToast = useCallback((message: string, type: TToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remover após 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Container de Toasts flutuantes no topo direito */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
          
          if (toast.type === 'success') {
            Icon = CheckCircle;
            colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'bg-red-50 text-red-800 border-red-200';
          }

          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-start space-x-3 p-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-300 animate-slide-in",
                colorClass
              )}
              role="alert"
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
