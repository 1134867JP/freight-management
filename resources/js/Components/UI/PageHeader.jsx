import React from 'react';

export default function PageHeader({
  title,
  subtitle = null,
  actions = null,
  icon = null,
  eyebrow = null,
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 shrink-0 text-pinho-700 dark:text-pinho-300">{icon}</div>}
        <div>
          {eyebrow && (
            <p className="mb-1 text-[15px] font-semibold text-pinho-700 dark:text-pinho-300">{eyebrow}</p>
          )}
          <h1 className="text-[28px] font-bold leading-tight text-areia-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-areia-600 dark:text-areia-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
