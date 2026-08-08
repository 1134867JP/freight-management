import React from 'react';

/**
 * Agrupa ações finais de formulários e mantém o empilhamento responsivo.
 * Os botões continuam sendo compostos pelo chamador.
 */
export default function FormActions({ children, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
