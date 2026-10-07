import React from 'react';

/* Bloco de ícone/inicial para dar âncora visual a itens de lista. */
const TONES = {
  brand: 'bg-pinho-100 text-pinho-800 dark:bg-pinho-900/60 dark:text-pinho-200',
  success: 'bg-pinho-100 text-pinho-800 dark:bg-pinho-900/60 dark:text-pinho-200',
  warning: 'bg-ocre-100 text-ocre-800 dark:bg-ocre-900/50 dark:text-ocre-200',
  info: 'bg-aco-100 text-aco-800 dark:bg-aco-900/60 dark:text-aco-200',
  danger: 'bg-tijolo-100 text-tijolo-800 dark:bg-tijolo-900/50 dark:text-tijolo-200',
  neutral: 'bg-areia-100 text-areia-700 dark:bg-areia-800 dark:text-areia-200',
  violet: 'bg-couro-100 text-couro-800 dark:bg-couro-900/50 dark:text-couro-200',
};

const SIZES = { sm: 'h-9 w-9 rounded-lg text-sm', md: 'h-11 w-11 rounded-xl text-base', lg: 'h-14 w-14 rounded-2xl text-xl' };

export default function IconTile({ children, tone = 'brand', size = 'md', className = '' }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center font-display font-bold ${TONES[tone] ?? TONES.brand} ${SIZES[size] ?? SIZES.md} ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}
