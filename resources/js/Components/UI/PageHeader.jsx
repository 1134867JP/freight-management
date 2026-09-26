import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  actions = null,
  icon = null,
  eyebrow = null,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b-2 border-ink pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-concrete-700">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-signal-400 text-ink">
            {icon}
          </div>
        ) : (
          <div className="hazard mt-1 h-10 w-2.5 shrink-0" aria-hidden="true" />
        )}
        <div>
          {eyebrow && (
            <p className="stencil mb-0.5 text-xs text-concrete-600 dark:text-concrete-400">{eyebrow}</p>
          )}
          <h1 className="text-4xl font-bold leading-none text-ink dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-concrete-600 dark:text-concrete-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
