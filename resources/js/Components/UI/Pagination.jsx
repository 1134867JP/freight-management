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
        'flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400',
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
              'min-h-9 min-w-9 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
              link.active
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
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
