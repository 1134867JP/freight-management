import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  actions = null,
  icon = null,
  eyebrow = null,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        {icon ? (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-brand-300">
            {icon}
          </div>
        ) : (
          <div className="mt-1 h-8 w-0.5 shrink-0 rounded-full bg-brand-700 dark:bg-brand-400" />
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-slate-950 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
