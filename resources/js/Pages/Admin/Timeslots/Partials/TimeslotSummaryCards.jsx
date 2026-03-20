import React from 'react';

const arrCardsConfig = [
  {
    key: 'total',
    label: 'Total de horários',
    tone: 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-200',
  },
  {
    key: 'available',
    label: 'Disponíveis',
    tone: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  {
    key: 'full',
    label: 'Lotados',
    tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  },
  {
    key: 'closed',
    label: 'Fechados',
    tone: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  {
    key: 'public',
    label: 'Públicos',
    tone: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  {
    key: 'restricted',
    label: 'Restritos',
    tone: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
];

export default function TimeslotSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {arrCardsConfig.map((objCard) => (
        <div key={objCard.key} className={`rounded-lg border p-3 ${objCard.tone}`}>
          <p className="text-xs uppercase tracking-wide">{objCard.label}</p>
          <p className="mt-1 text-2xl font-semibold">{summary[objCard.key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
