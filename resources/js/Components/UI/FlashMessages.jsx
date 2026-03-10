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
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {arrFlash.error}
        </div>
      )}

      {arrFlash.success && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {arrFlash.success}
        </div>
      )}

      {arrFlash.info && (
        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {arrFlash.info}
        </div>
      )}
    </div>
  );
}
