import React from 'react';

/**
 * Casca visual para tabelas responsivas. O conteúdo da tabela continua
 * explícito na página/feature para não esconder regras de domínio.
 */
export default function TableShell({ children, className = '' }) {
  return (
    <div
      className={[
        'overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
