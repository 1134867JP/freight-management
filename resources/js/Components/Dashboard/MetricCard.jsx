import React from 'react';

/* Faixa lateral colorida por tom, como a marcação de piso de uma doca. */
const TONES = {
  neutral: { bar: 'bg-concrete-400 dark:bg-concrete-500', icon: 'text-concrete-500 dark:text-concrete-400' },
  brand: { bar: 'bg-signal-400', icon: 'text-signal-600 dark:text-signal-400' },
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bar: 'bg-amber-500', icon: 'text-amber-600 dark:text-amber-400' },
  danger: { bar: 'bg-rose-600', icon: 'text-rose-600 dark:text-rose-400' },
  violet: { bar: 'bg-violet-500', icon: 'text-violet-600 dark:text-violet-400' },
};

export default function MetricCard({ label, value, icon, tone = 'neutral', detail = null }) {
  const colors = TONES[tone] ?? TONES.neutral;

  return (
    <div className="relative overflow-hidden rounded-sm border border-concrete-300 bg-white py-4 pl-5 pr-4 dark:border-concrete-800 dark:bg-concrete-900">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${colors.bar}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="stencil text-xs text-concrete-600 dark:text-concrete-400">{label}</p>
          <p className="mt-1 font-display text-5xl font-bold leading-none tabular-nums text-ink dark:text-white">{value}</p>
          {detail && <p className="mt-2 text-xs text-concrete-500 dark:text-concrete-400">{detail}</p>}
        </div>
        {icon && <span className={`shrink-0 ${colors.icon}`}>{icon}</span>}
      </div>
    </div>
  );
}
