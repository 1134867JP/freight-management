import React from 'react';

export default function BrandLogo({ compact = false, inverse = false, className = '' }) {
  const primaryText = inverse ? 'text-white' : 'text-ink dark:text-white';
  const secondaryText = inverse ? 'text-concrete-400' : 'text-concrete-600 dark:text-concrete-400';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-signal-400 text-ink">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7.5h10.5v7H3v-7Zm10.5 2h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
          <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="2" />
          <path d="M4.5 4.5h7" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className={`block font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] ${primaryText}`}>
            Cargo<span className={inverse ? 'text-signal-400' : 'text-signal-600 dark:text-signal-400'}>Hub</span>
          </span>
          <span className={`mt-1 block font-display text-[10px] font-semibold uppercase tracking-[0.28em] ${secondaryText}`}>
            Yard Management
          </span>
        </span>
      )}
    </div>
  );
}
