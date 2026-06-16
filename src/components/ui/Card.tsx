import React from 'react';
import { cn } from '@/lib/utils';

interface ICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerAction?: React.ReactNode;
}

/**
 * Componente Card básico do Design System.
 * Estilo base: bg-white, shadow-sm, rounded-lg, p-6
 */
export const Card: React.FC<ICardProps> = ({
  title,
  headerAction,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white shadow-sm rounded-lg p-6 border border-slate-100",
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
          {title && (
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
              {title}
            </h3>
          )}
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
