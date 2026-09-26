import React from 'react';

/* Marcador de cor ao lado do rótulo: indica o estado sem depender só da cor do número. */
const TONES = {
  neutral: 'bg-areia-400',
  brand: 'bg-pinho-600',
  success: 'bg-pinho-500',
  warning: 'bg-ocre-400',
  danger: 'bg-tijolo-500',
  violet: 'bg-couro-500',
  info: 'bg-aco-500',
};

export default function MetricCard({ label, value, icon, tone = 'neutral', detail = null }) {
  return (
    <div className="rounded-xl border border-areia-200 bg-white p-5 shadow-sm dark:border-areia-800 dark:bg-areia-900">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-areia-700 dark:text-areia-300">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${TONES[tone] ?? TONES.neutral}`} aria-hidden="true" />
          {label}
        </p>
        {icon && <span className="shrink-0 text-areia-400 dark:text-areia-500">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-4xl font-bold leading-none tabular-nums text-areia-900 dark:text-white">{value}</p>
      {detail && <p className="mt-2 text-sm text-areia-600 dark:text-areia-400">{detail}</p>}
    </div>
  );
}
