import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Componente Button reutilizável com variantes de layout.
 */
export const Button: React.FC<IButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon,
  className,
  disabled,
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-[#1A56A0] hover:bg-[#144580] text-white shadow-sm border border-transparent focus:ring-[#1A56A0]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent focus:ring-red-500',
    ghost: 'hover:bg-slate-100 text-slate-600 border border-transparent focus:ring-slate-500',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />}
      {!loading && icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
