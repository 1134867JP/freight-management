import React from 'react';

export default function BrandLogo({ compact = false, inverse = false, className = '' }) {
  const primaryText = inverse ? 'text-white' : 'text-slate-950 dark:text-white';
  const secondaryText = inverse ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-950/20">
        <span className="absolute -right-2 -top-3 h-7 w-7 rounded-full bg-white/20 blur-sm" />
        <svg className="relative h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7.5h10.5v7H3v-7Zm10.5 2h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 4.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".65" />
        </svg>
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className={`block text-lg font-extrabold leading-none tracking-[-0.035em] ${primaryText}`}>
            Cargo<span className="text-blue-500">Hub</span>
          </span>
          <span className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.28em] ${secondaryText}`}>
            Yard Management
          </span>
        </span>
      )}
    </div>
  );
}
