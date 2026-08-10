import React from 'react';

function FormField({ id, label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <div role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
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
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

FormField.inputClass = function inputClass(error, extra = '') {
  const state = error
    ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-700 dark:bg-rose-950/20 dark:text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-brand-400';
  return [
    'min-h-10 rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2',
    state,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
};

FormField.Input = React.forwardRef(function FormFieldInput(
  { error, className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`mt-1 block w-full ${FormField.inputClass(error, className)}`}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
});

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
