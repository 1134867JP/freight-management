import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-areia-100 text-areia-600 dark:bg-areia-800 dark:text-areia-300">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-areia-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-areia-600 dark:text-areia-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
