import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', title: '' });
  const resolveRef = useRef(null);

  const confirm = useCallback((message, title = 'Confirmar ação') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message, title });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-areia-950/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div className="glass-strong w-full max-w-sm rounded-xl p-6">
            <h3 className="text-lg font-semibold text-areia-900 dark:text-white">{state.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">{state.message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-11 rounded-lg border border-areia-300 bg-white px-4 py-2 text-[15px] font-semibold text-areia-800 transition hover:bg-white/50 dark:border-areia-700 dark:bg-areia-800 dark:text-areia-100 dark:hover:bg-areia-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="min-h-11 rounded-lg bg-tijolo-600 px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-tijolo-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return ctx;
}
