import React, { useEffect, useRef } from 'react';

export default function ModalShell({
  show,
  title,
  onClose,
  children,
  footer = null,
  maxWidthClass = 'max-w-md',
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ESC key: usa ref para não reregistrar a cada render
  useEffect(() => {
    if (!show) return;
    const onEsc = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [show]);

  // Foco inicial: só quando o modal abre
  useEffect(() => {
    if (!show) return;
    const firstFocusable = panelRef.current?.querySelector(
      'input, textarea, select, button:not([disabled])'
    );
    firstFocusable?.focus();
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className={`flex max-h-[90vh] w-full flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800 ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-700">{footer}</div>}
      </div>
    </div>
  );
}
