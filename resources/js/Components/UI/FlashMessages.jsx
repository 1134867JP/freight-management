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
    error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  };

  const icons = {
    error: 'M6 6l8 8m0-8-8 8',
    success: 'm5 10 3 3 7-7',
    info: 'M10 9v5m0-8h.01',
  };

  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`mb-3 flex items-start justify-between gap-3 rounded-xl border p-3.5 text-sm font-medium shadow-sm ${styles[type]}`}>
      <span className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={icons[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span>{message}</span>
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="mt-0.5 shrink-0 rounded-md p-1 opacity-60 transition hover:bg-current/10 hover:opacity-100"
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
