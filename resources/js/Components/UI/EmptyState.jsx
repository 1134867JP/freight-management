import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
