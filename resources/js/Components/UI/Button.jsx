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
    'border-pinho-700 bg-pinho-700 text-white shadow-sm hover:border-pinho-800 hover:bg-pinho-800 focus-visible:ring-ocre-400 dark:border-pinho-400 dark:bg-pinho-400 dark:text-areia-950 dark:hover:bg-pinho-300',
  secondary:
    'border-areia-300 bg-white text-areia-800 shadow-sm hover:border-areia-400 hover:bg-areia-50 focus-visible:ring-ocre-400 dark:border-areia-700 dark:bg-areia-800 dark:text-areia-100 dark:hover:bg-areia-700',
  danger:
    'border-tijolo-600 bg-tijolo-600 text-white shadow-sm hover:border-tijolo-700 hover:bg-tijolo-700 focus-visible:ring-tijolo-300',
  // Para ações destrutivas repetidas em listas: visível, mas sem competir com a ação principal.
  'danger-subtle':
    'border-tijolo-200 bg-white text-tijolo-700 hover:border-tijolo-300 hover:bg-tijolo-50 focus-visible:ring-tijolo-300 dark:border-tijolo-900 dark:bg-transparent dark:text-tijolo-300 dark:hover:bg-tijolo-950/40',
  ghost:
    'border-transparent bg-transparent text-areia-700 hover:bg-areia-200/60 hover:text-areia-900 focus-visible:ring-ocre-400 dark:text-areia-300 dark:hover:bg-areia-800 dark:hover:text-white',
  // Sobre fundos escuros de destaque (verde da marca).
  accent:
    'border-ocre-400 bg-ocre-400 text-pinho-950 shadow-sm hover:border-ocre-300 hover:bg-ocre-300 focus-visible:ring-ocre-300 focus-visible:ring-offset-[#10241B]',
  inverse:
    'border-transparent bg-white/10 text-white hover:bg-white/15 focus-visible:ring-ocre-300 focus-visible:ring-offset-[#10241B]',
  'inverse-danger':
    'border-transparent bg-white/10 text-tijolo-200 hover:bg-white/15 focus-visible:ring-ocre-300 focus-visible:ring-offset-[#10241B]',
  soft:
    'border-pinho-100 bg-pinho-50 text-pinho-800 hover:bg-pinho-100 focus-visible:ring-ocre-400 dark:border-pinho-900 dark:bg-pinho-950/60 dark:text-pinho-200 dark:hover:bg-pinho-900',
};

/* Alturas mínimas de 36/44/52px: alvos confortáveis para toque na portaria. */
const SIZE_CLASSES = {
  sm: 'min-h-9 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-11 px-4 py-2 text-[15px] gap-2',
  lg: 'min-h-[52px] px-6 py-3 text-base gap-2',
};

/** Classes do botão para usar em links (`<Link className={buttonClassName(...)}>`). */
export function buttonClassName({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [
    'inline-flex items-center justify-center rounded-lg border font-semibold',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

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
      className={buttonClassName({ variant, size, className })}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
