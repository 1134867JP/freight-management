import React from 'react';

/* Título de seção dentro da página: rótulo discreto + ação opcional à direita. */
export default function SectionTitle({ children, aside = null, id, className = '' }) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}>
      <h2 id={id} className="text-[13px] font-bold uppercase tracking-[0.08em] text-areia-600 dark:text-areia-400">{children}</h2>
      {aside && <div className="text-[15px] font-semibold text-pinho-700 dark:text-pinho-300">{aside}</div>}
    </div>
  );
}
