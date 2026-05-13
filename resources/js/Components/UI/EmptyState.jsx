import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
