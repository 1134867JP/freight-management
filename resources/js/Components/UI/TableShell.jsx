import React from 'react';

/**
 * Casca visual para tabelas responsivas. O conteúdo da tabela continua
 * explícito na página/feature para não esconder regras de domínio.
 */
export default function TableShell({ children, className = '' }) {
  return (
    <div
      className={[
        'table-shell overflow-x-auto rounded-xl border border-areia-200 bg-white shadow-sm',
        'dark:border-areia-800 dark:bg-areia-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
