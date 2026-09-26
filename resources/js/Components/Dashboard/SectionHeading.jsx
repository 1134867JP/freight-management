import React from 'react';

export default function SectionHeading({ title, description = null, action = null }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-areia-900 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-[15px] text-areia-600 dark:text-areia-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
