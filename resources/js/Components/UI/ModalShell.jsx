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

  useEffect(() => {
    if (!show) return;
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    const firstFocusable = panelRef.current?.querySelector(
      'input, textarea, select, button:not([disabled])'
    );
    firstFocusable?.focus();
    return () => document.removeEventListener('keydown', onEsc);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className={`w-full rounded-lg bg-white shadow-xl ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
