import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  actions = null,
  icon = null,
  eyebrow = null,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            {icon}
          </div>
        ) : (
          <div className="h-9 w-1 shrink-0 rounded-full bg-teal-500" />
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
