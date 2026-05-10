import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

function Alert({ type, message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <div className={`mb-3 flex items-start justify-between gap-3 rounded border p-3 text-sm ${styles[type]}`}>
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="mt-0.5 shrink-0 opacity-60 hover:opacity-100 transition"
        aria-label="Fechar mensagem"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default function FlashMessages({ flash = null, className = 'mb-4' }) {
  const { flash: pageFlash = {} } = usePage().props;
  const f = flash || pageFlash;

  if (!f?.success && !f?.error && !f?.info) return null;

  return (
    <div className={className}>
      {f.error && <Alert type="error" message={f.error} />}
      {f.success && <Alert type="success" message={f.success} />}
      {f.info && <Alert type="info" message={f.info} />}
    </div>
  );
}
