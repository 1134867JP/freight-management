import React from 'react';

const VARIANT_CLASSES = {
  ghost:
    'border-transparent bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-brand-400 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
  secondary:
    'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 focus:ring-brand-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100',
  danger:
    'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 focus:ring-red-400 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40',
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

/**
 * Botão quadrado para ações representadas apenas por ícone.
 *
 * `label` é obrigatório para leitores de tela e também é usado como tooltip
 * nativo quando `title` não for informado.
 */
export default function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  title,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-md border transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.ghost,
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon}
    </button>
  );
}
