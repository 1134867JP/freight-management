import React from 'react';

export default function SectionHeading({ title, description = null, action = null }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2.5 text-lg font-bold uppercase tracking-[0.06em] text-ink dark:text-white">
          <span className="hazard h-3.5 w-6 shrink-0" aria-hidden="true" />
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-concrete-600 dark:text-concrete-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
