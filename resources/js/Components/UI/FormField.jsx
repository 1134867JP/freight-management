import React from 'react';

function FormField({ id, label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[15px] font-semibold text-areia-800 dark:text-areia-200">
          {label}
          {required && <span className="ml-1 text-tijolo-600" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <div role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-tijolo-700 dark:text-tijolo-300">
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
        <p className="mt-1.5 text-sm leading-relaxed text-areia-600 dark:text-areia-400">{hint}</p>
      ) : null}
    </div>
  );
}

FormField.inputClass = function inputClass(error, extra = '') {
  const state = error
    ? 'border-tijolo-500 bg-tijolo-50 focus:border-tijolo-600 focus:ring-tijolo-200 dark:border-tijolo-500 dark:bg-tijolo-950/30 dark:text-areia-100'
    : 'border-areia-400/70 bg-white text-areia-900 placeholder:text-areia-400 hover:border-areia-500 focus:border-pinho-600 focus:ring-ocre-300/60 dark:border-areia-600 dark:bg-areia-900 dark:text-areia-100 dark:placeholder:text-areia-500 dark:hover:border-areia-500 dark:focus:border-pinho-400';
  return [
    'min-h-11 rounded-lg border px-3 py-2 text-[15px] transition focus:outline-none focus:ring-[3px]',
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
