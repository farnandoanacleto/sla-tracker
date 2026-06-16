import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition',
          'placeholder:text-gray-400',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
            : 'border-gray-300 focus:border-blue-500',
          props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
