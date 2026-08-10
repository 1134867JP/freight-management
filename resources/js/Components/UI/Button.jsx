import React from 'react';

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const VARIANT_CLASSES = {
  primary:
    'border-transparent bg-brand-600 text-white shadow-[0_1px_2px_rgba(30,64,175,0.25),0_6px_16px_rgba(37,99,235,0.16)] hover:bg-brand-700 hover:shadow-md focus:ring-brand-500',
  secondary:
    'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  danger:
    'border-transparent bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus:ring-rose-500',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-brand-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  soft:
    'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 focus:ring-brand-500 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-900/60',
};

const SIZE_CLASSES = {
  sm: 'min-h-8 px-3 py-1.5 text-xs gap-1.5',
  md: 'min-h-10 px-4 py-2 text-sm gap-2',
  lg: 'min-h-11 px-5 py-2.5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center rounded-xl border font-semibold',
        'transition-all duration-150 active:translate-y-px',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0',
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
