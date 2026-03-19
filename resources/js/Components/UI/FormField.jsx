import React from 'react';

function FormField({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <div role="alert" className="mt-1 flex items-center gap-1 text-sm text-red-600">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

FormField.inputClass = function inputClass(error, extra = '') {
  const state = error
    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';
  return ['rounded-md transition-colors', state, extra].filter(Boolean).join(' ');
};

FormField.Input = function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`mt-1 block w-full ${FormField.inputClass(error, className)}`}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
};

FormField.Select = function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`mt-1 block w-full ${FormField.inputClass(error, className)}`}
      aria-invalid={Boolean(error)}
      {...props}
    >
      {children}
    </select>
  );
};

export default FormField;
