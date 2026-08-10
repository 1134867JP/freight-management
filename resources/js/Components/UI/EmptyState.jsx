import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 text-slate-400 ring-1 ring-slate-100 dark:from-slate-800 dark:to-blue-950/40 dark:text-slate-500 dark:ring-slate-700">
          {icon}
        </div>
      )}
      <p className="text-base font-bold text-slate-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
