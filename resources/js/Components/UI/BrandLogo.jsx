import React from 'react';

export default function BrandLogo({ compact = false, inverse = false, className = '' }) {
  const primaryText = inverse ? 'text-white' : 'text-slate-950 dark:text-white';
  const secondaryText = inverse ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-700 text-white shadow-sm">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7.5h10.5v7H3v-7Zm10.5 2h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 4.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".65" />
        </svg>
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className={`block text-lg font-bold leading-none tracking-[-0.025em] ${primaryText}`}>
            Cargo<span className="text-blue-500">Hub</span>
          </span>
          <span className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] ${secondaryText}`}>
            Yard Management
          </span>
        </span>
      )}
    </div>
  );
}
