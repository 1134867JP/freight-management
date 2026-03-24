import React from 'react';

export default function PageHeader({ title, subtitle = null, actions = null }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-teal-500" />
        <div>
          <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
