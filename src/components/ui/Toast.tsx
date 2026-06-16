import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type TToastVariant = 'sucesso' | 'erro' | 'info' | 'alerta';

export interface IToast {
  id: string;
  mensagem: string;
  variante: TToastVariant;
  duracao?: number;
}

interface ToastItemProps {
  toast: IToast;
  onRemove: (id: string) => void;
}

const variantConfig: Record<
  TToastVariant,
  { bg: string; icon: React.ReactNode; border: string; text: string }
> = {
  sucesso: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />,
  },
  erro: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info size={18} className="text-blue-500 flex-shrink-0" />,
  },
  alerta: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
  },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { bg, border, text, icon } = variantConfig[toast.variante];

  useEffect(() => {
    const timer = setTimeout(
      () => onRemove(toast.id),
      toast.duracao ?? 4000
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.duracao, onRemove]);

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
        'animate-slideInRight min-w-[280px] max-w-sm',
        bg,
        border,
      ].join(' ')}
    >
      {icon}
      <p className={['text-sm font-medium flex-1', text].join(' ')}>
        {toast.mensagem}
      </p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: IToast[];
  onRemove: (id: string) => void;
}

/**
 * Container que renderiza todos os toasts ativos no canto inferior direito.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
