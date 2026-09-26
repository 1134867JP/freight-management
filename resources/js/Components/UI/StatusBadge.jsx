import React from 'react';

/*
 * Cada tom tem um significado fixo em todo o app:
 * neutral = agendado/inativo, info = em operação, success = livre/concluído,
 * warning = aguardando/atenção, danger = atrasado/cancelado.
 */
const arrToneClasses = {
  neutral: 'bg-areia-100 text-areia-700 ring-areia-200 dark:bg-areia-800 dark:text-areia-200 dark:ring-areia-700',
  info: 'bg-aco-100 text-aco-800 ring-aco-200 dark:bg-aco-900/60 dark:text-aco-200 dark:ring-aco-800',
  success: 'bg-pinho-100 text-pinho-800 ring-pinho-200 dark:bg-pinho-900/60 dark:text-pinho-200 dark:ring-pinho-800',
  warning: 'bg-ocre-100 text-ocre-800 ring-ocre-200 dark:bg-ocre-900/50 dark:text-ocre-200 dark:ring-ocre-800',
  danger: 'bg-tijolo-100 text-tijolo-800 ring-tijolo-200 dark:bg-tijolo-900/50 dark:text-tijolo-200 dark:ring-tijolo-800',
  violet: 'bg-couro-100 text-couro-800 ring-couro-200 dark:bg-couro-900/50 dark:text-couro-200 dark:ring-couro-800',
  brand: 'bg-pinho-700 text-white ring-pinho-700 dark:bg-pinho-400 dark:text-areia-950 dark:ring-pinho-400',
};

const arrDotClasses = {
  neutral: 'bg-areia-500',
  info: 'bg-aco-600 dark:bg-aco-300',
  success: 'bg-pinho-600 dark:bg-pinho-300',
  warning: 'bg-ocre-500 dark:bg-ocre-300',
  danger: 'bg-tijolo-600 dark:bg-tijolo-300',
  violet: 'bg-couro-600 dark:bg-couro-300',
  brand: 'bg-ocre-300',
};

export default function StatusBadge({ label, tone = 'neutral', className = '' }) {
  const vlClassTone = arrToneClasses[tone] || arrToneClasses.neutral;
  const vlDotClass = arrDotClasses[tone] || arrDotClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-semibold ring-1 ring-inset ${vlClassTone} ${className}`.trim()}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${vlDotClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}
