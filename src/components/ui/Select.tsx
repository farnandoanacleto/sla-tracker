import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  id,
  className = '',
  ...props
}) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition',
          'appearance-none cursor-pointer',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
            : 'border-gray-300 focus:border-blue-500',
          props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '36px',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
