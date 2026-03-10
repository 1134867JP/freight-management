import React from 'react';
import { router } from '@inertiajs/react';

function formatLinkLabel(label) {
  return label
    .replace('&laquo; Previous', 'Anterior')
    .replace('Previous', 'Anterior')
    .replace('Next &raquo;', 'Próximo')
    .replace('Next', 'Próximo');
}

export default function TimeslotsPagination({ links }) {
  if (!links || links.length <= 3) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
      {links.map((objLink, index) => (
        <button
          key={`${objLink.label}-${index}`}
          type="button"
          disabled={!objLink.url}
          onClick={() => objLink.url && router.visit(objLink.url)}
          className={`min-w-[38px] rounded-md border px-3 py-2 text-sm font-medium transition ${
            objLink.active
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          dangerouslySetInnerHTML={{ __html: formatLinkLabel(objLink.label) }}
        />
      ))}
    </div>
  );
}
