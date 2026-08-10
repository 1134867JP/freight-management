import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  actions = null,
  icon = null,
  eyebrow = null,
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-blue-100 text-brand-600 ring-1 ring-brand-100 dark:from-brand-950/60 dark:to-slate-900 dark:text-brand-300 dark:ring-brand-900">
            {icon}
          </div>
        ) : (
          <div className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-400 to-brand-700" />
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
