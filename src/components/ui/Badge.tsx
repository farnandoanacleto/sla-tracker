import React from 'react';
import { cn } from '@/lib/utils';

export type TBadgeVariant = 'verde' | 'vermelho' | 'amarelo' | 'cinza' | 'azul';

interface IBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TBadgeVariant;
  children: React.ReactNode;
}

/**
 * Componente Badge para rotular status e conformidade com o SLA.
 */
export const Badge: React.FC<IBadgeProps> = ({ 
  variant = 'cinza', 
  className, 
  children, 
  ...props 
}) => {
  const variantClasses = {
    verde: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    vermelho: 'bg-red-50 text-red-700 border-red-200',
    amarelo: 'bg-amber-50 text-amber-700 border-amber-200',
    cinza: 'bg-slate-100 text-slate-600 border-slate-200',
    azul: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
