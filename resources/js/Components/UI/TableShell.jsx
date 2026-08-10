import React from 'react';

/**
 * Casca visual para tabelas responsivas. O conteúdo da tabela continua
 * explícito na página/feature para não esconder regras de domínio.
 */
export default function TableShell({ children, className = '' }) {
  return (
    <div
      className={[
        'table-shell overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
