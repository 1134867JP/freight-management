import React from 'react';

/*
 * Marca: caminhão creme sobre pinho, com a faixa ocre do batente de doca.
 * `inverse` é usado sobre fundos escuros (modo escuro).
 */
export default function BrandLogo({ compact = false, inverse = false, className = '' }) {
  const primaryText = inverse ? 'text-white' : 'text-areia-900 dark:text-white';
  const secondaryText = inverse ? 'text-areia-300' : 'text-areia-600 dark:text-areia-400';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pinho-700 text-areia-50">
        <svg className="-mt-1 h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7.5h10.5v7H3v-7Zm10.5 2h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-ocre-400" aria-hidden="true" />
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className={`block font-display text-xl font-bold leading-none tracking-[-0.015em] ${primaryText}`}>
            CargoHub
          </span>
          <span className={`mt-1 block text-[13px] font-medium leading-none ${secondaryText}`}>
            Gestão de pátio
          </span>
        </span>
      )}
    </div>
  );
}
