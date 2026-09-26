import React from 'react';

const arrToneClasses = {
  neutral: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:ring-gray-600',
  info: 'bg-sky-50 text-sky-800 ring-sky-300 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800',
  brand: 'bg-signal-400 text-ink ring-ink dark:bg-signal-400 dark:text-ink dark:ring-signal-500',
};

const arrDotClasses = {
  neutral: 'bg-gray-400 dark:bg-gray-500',
  info: 'bg-sky-600 dark:bg-sky-400',
  success: 'bg-emerald-500 dark:bg-emerald-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-500 dark:bg-red-400',
  violet: 'bg-violet-500 dark:bg-violet-400',
  brand: 'bg-ink',
};

export default function StatusBadge({ label, tone = 'neutral', className = '' }) {
  const vlClassTone = arrToneClasses[tone] || arrToneClasses.neutral;
  const vlDotClass = arrDotClasses[tone] || arrDotClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-display text-[13px] font-semibold uppercase tracking-[0.06em] ring-1 ring-inset ${vlClassTone} ${className}`.trim()}
    >
      <span className={`h-2 w-2 shrink-0 ${vlDotClass}`} />
      {label}
    </span>
  );
}
