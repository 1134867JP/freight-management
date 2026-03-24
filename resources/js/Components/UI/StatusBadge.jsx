import React from 'react';

const arrToneClasses = {
  neutral: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:ring-gray-600',
  info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
  success: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-800',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
};

const arrDotClasses = {
  neutral: 'bg-gray-400 dark:bg-gray-500',
  info: 'bg-blue-500 dark:bg-blue-400',
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-500 dark:bg-red-400',
};

export default function StatusBadge({ label, tone = 'neutral', className = '' }) {
  const vlClassTone = arrToneClasses[tone] || arrToneClasses.neutral;
  const vlDotClass = arrDotClasses[tone] || arrDotClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${vlClassTone} ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${vlDotClass}`} />
      {label}
    </span>
  );
}
