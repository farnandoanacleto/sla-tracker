import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Placeholder animado para loading states.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
}) => {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={['animate-pulse bg-gray-200', roundedClass, className].join(' ')}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      aria-hidden="true"
    />
  );
};

/** Esqueleto de uma linha de texto */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={['flex flex-col gap-2', className].join(' ')}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-4"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

/** Esqueleto de um card completo */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={['bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-4', className].join(' ')}>
    <Skeleton className="h-5 w-1/3" />
    <SkeletonText lines={3} />
  </div>
);

/** Esqueleto de uma linha de tabela */
export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4" width={i === 0 ? '80%' : '60%'} />
      </td>
    ))}
  </tr>
);

export default Skeleton;
