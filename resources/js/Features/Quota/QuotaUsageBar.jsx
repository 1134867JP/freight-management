import React from 'react';

/*
 * Barra empilhada do ciclo da cota: concluídas → em operação → agendadas → disponíveis.
 * Usa os mesmos tons do StatusBadge para que a leitura seja imediata.
 */
const SEGMENTS = [
  { key: 'completed', label: 'Concluídas', className: 'bg-pinho-600 dark:bg-pinho-400' },
  { key: 'in_operation', label: 'Em operação', className: 'bg-aco-500 dark:bg-aco-300' },
  { key: 'booked', label: 'Agendadas', className: 'bg-ocre-400 dark:bg-ocre-300' },
  { key: 'available', label: 'Disponíveis', className: 'bg-areia-200 dark:bg-areia-700' },
];

export default function QuotaUsageBar({ usage, showLegend = false, size = 'md', className = '' }) {
  const total = Math.max(Number(usage?.total ?? 0), 1);
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={className}>
      <div
        className={`flex w-full overflow-hidden rounded-full bg-areia-100 dark:bg-areia-800 ${height}`}
        role="img"
        aria-label={SEGMENTS.map((s) => `${s.label}: ${usage?.[s.key] ?? 0}`).join(', ')}
      >
        {SEGMENTS.map((segment) => {
          const value = Number(usage?.[segment.key] ?? 0);
          if (value <= 0) return null;
          return (
            <span
              key={segment.key}
              className={segment.className}
              style={{ width: `${Math.min((value / total) * 100, 100)}%` }}
            />
          );
        })}
      </div>
      {showLegend && (
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-areia-600 dark:text-areia-400">
          {SEGMENTS.map((segment) => (
            <div key={segment.key} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${segment.className}`} aria-hidden="true" />
              <dt>{segment.label}</dt>
              <dd className="font-semibold tabular-nums text-areia-900 dark:text-areia-100">{usage?.[segment.key] ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
