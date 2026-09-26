import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

function Alert({ type, message }) {
  const [visible, setVisible] = useState(true);

  // Erros ficam na tela até a pessoa fechar: sumir sozinho faz perder a mensagem.
  useEffect(() => {
    if (type === 'error') return undefined;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [type]);

  if (!visible) return null;

  const styles = {
    error: 'border-tijolo-200 border-l-tijolo-600 bg-tijolo-50 text-tijolo-800 dark:border-tijolo-900 dark:border-l-tijolo-400 dark:bg-tijolo-950/40 dark:text-tijolo-200',
    success: 'border-pinho-200 border-l-pinho-600 bg-pinho-50 text-pinho-800 dark:border-pinho-900 dark:border-l-pinho-400 dark:bg-pinho-950/40 dark:text-pinho-200',
    info: 'border-aco-200 border-l-aco-600 bg-aco-50 text-aco-800 dark:border-aco-900 dark:border-l-aco-400 dark:bg-aco-950/40 dark:text-aco-200',
  };

  const icons = {
    error: 'M6 6l8 8m0-8-8 8',
    success: 'm5 10 3 3 7-7',
    info: 'M10 9v5m0-8h.01',
  };

  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`mb-3 flex items-start justify-between gap-3 rounded-lg border border-l-4 p-3.5 text-[15px] font-medium ${styles[type]}`}>
      <span className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={icons[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span>{message}</span>
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100"
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
