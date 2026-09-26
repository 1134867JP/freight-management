import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-dashed border-concrete-400 text-concrete-500 dark:border-concrete-600 dark:text-concrete-400">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold uppercase tracking-[0.06em] text-ink dark:text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
