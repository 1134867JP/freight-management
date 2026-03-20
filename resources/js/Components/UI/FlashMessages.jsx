import React from 'react';
import { usePage } from '@inertiajs/react';

export default function FlashMessages({ flash = null, className = 'mb-4' }) {
  const { flash: arrPageFlash = {} } = usePage().props;
  const arrFlash = flash || arrPageFlash;

  if (!arrFlash?.success && !arrFlash?.error && !arrFlash?.info) {
    return null;
  }

  return (
    <div className={className}>
      {arrFlash.error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {arrFlash.error}
        </div>
      )}

      {arrFlash.success && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {arrFlash.success}
        </div>
      )}

      {arrFlash.info && (
        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          {arrFlash.info}
        </div>
      )}
    </div>
  );
}
