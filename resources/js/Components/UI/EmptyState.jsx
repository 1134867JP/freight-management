import React from 'react';

export default function EmptyState({ title, description = null, action = null, className = '' }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600 dark:border-gray-700 dark:bg-gray-700/30 dark:text-gray-400 ${className}`.trim()}
    >
      <p className="font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
