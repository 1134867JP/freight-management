import React from 'react';

/**
 * Casca visual para tabelas responsivas. O conteúdo da tabela continua
 * explícito na página/feature para não esconder regras de domínio.
 */
export default function TableShell({ children, className = '' }) {
  return (
    <div
      className={[
        'table-shell overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
