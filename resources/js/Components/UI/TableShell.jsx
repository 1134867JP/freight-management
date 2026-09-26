import React from 'react';

/**
 * Casca visual para tabelas responsivas. O conteúdo da tabela continua
 * explícito na página/feature para não esconder regras de domínio.
 */
export default function TableShell({ children, className = '' }) {
  return (
    <div
      className={[
        'table-shell overflow-x-auto rounded-sm border border-concrete-300 bg-white',
        'dark:border-concrete-800 dark:bg-concrete-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
