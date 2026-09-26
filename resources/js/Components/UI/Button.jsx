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
    'border-ink bg-ink text-white hover:bg-black focus:ring-signal-400 dark:border-signal-400 dark:bg-signal-400 dark:text-ink dark:hover:bg-signal-300',
  signal:
    'border-ink bg-signal-400 text-ink hover:bg-signal-300 focus:ring-ink dark:border-signal-400',
  secondary:
    'border-ink bg-white text-ink hover:bg-concrete-100 focus:ring-signal-400 dark:border-concrete-500 dark:bg-transparent dark:text-concrete-100 dark:hover:bg-concrete-800',
  danger:
    'border-rose-700 bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-brand-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  soft:
    'border-signal-400 bg-signal-50 text-ink hover:bg-signal-100 focus:ring-signal-400 dark:border-signal-700 dark:bg-signal-950/60 dark:text-signal-300 dark:hover:bg-signal-900/60',
};

const SIZE_CLASSES = {
  sm: 'min-h-8 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-10 px-4 py-2 text-base gap-2',
  lg: 'min-h-12 px-5 py-2.5 text-lg gap-2',
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
        'inline-flex items-center justify-center rounded-sm border-2 font-display font-semibold uppercase tracking-[0.06em]',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
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
