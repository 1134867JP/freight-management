import React from 'react';
import { router } from '@inertiajs/react';

function formatLinkLabel(label) {
  return String(label)
    .replace(/&laquo;\s*Previous/i, 'Anterior')
    .replace(/Previous/i, 'Anterior')
    .replace(/Next\s*&raquo;/i, 'Próximo')
    .replace(/Next/i, 'Próximo')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Paginação para os links no formato padrão do paginator do Laravel.
 */
export default function Pagination({
  links,
  currentPage,
  lastPage,
  preserveScroll = true,
  className = '',
}) {
  if (!links?.length || (lastPage != null && lastPage <= 1)) return null;

  return (
    <nav
      aria-label="Paginação"
      className={[
        'flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between dark:text-gray-400',
        className,
      ].filter(Boolean).join(' ')}
    >
      {currentPage != null && lastPage != null && (
        <span>Página {currentPage} de {lastPage}</span>
      )}
      <div className="flex flex-wrap gap-1">
        {links.map((link, index) => (
          <button
            key={`${link.label}-${index}`}
            type="button"
            disabled={!link.url}
            onClick={() => link.url && router.get(link.url, {}, { preserveScroll })}
            aria-current={link.active ? 'page' : undefined}
            className={[
              'min-w-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              link.active
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
              'disabled:cursor-not-allowed disabled:opacity-40',
            ].join(' ')}
          >
            {formatLinkLabel(link.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}
