import React from 'react';
import { Link } from '@inertiajs/react';

/*
 * Faixa compacta de indicadores. Zeros ficam discretos para que só os
 * números que importam chamem atenção; o tom só aparece quando há valor.
 */
const TONE_VALUE = {
  neutral: 'text-areia-900 dark:text-white',
  success: 'text-pinho-700 dark:text-pinho-300',
  warning: 'text-ocre-700 dark:text-ocre-300',
  info: 'text-aco-700 dark:text-aco-300',
  danger: 'text-tijolo-700 dark:text-tijolo-300',
};

const TONE_DOT = {
  neutral: 'bg-areia-400',
  success: 'bg-pinho-500',
  warning: 'bg-ocre-400',
  info: 'bg-aco-500',
  danger: 'bg-tijolo-500',
};

export default function StatStrip({ items = [], className = '' }) {
  return (
    <dl className={`glass grid grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none ${className}`}>
      {items.map((item, index) => {
        const value = Number(item.value ?? 0);
        const tone = item.tone ?? 'neutral';
        const body = (
          <>
            <dt className="flex items-center gap-1.5 text-[13px] font-medium text-areia-600 dark:text-areia-400">
              <span className={`h-1.5 w-1.5 rounded-full ${value > 0 ? TONE_DOT[tone] : 'bg-areia-300 dark:bg-areia-700'}`} aria-hidden="true" />
              {item.label}
            </dt>
            <dd className={`mt-1 font-display text-[28px] font-bold leading-none tabular-nums ${value > 0 ? TONE_VALUE[tone] : 'text-areia-300 dark:text-areia-600'}`}>
              {item.display ?? value.toLocaleString('pt-BR')}
            </dd>
            {item.hint && <p className="mt-1 text-[13px] text-areia-500 dark:text-areia-400">{item.hint}</p>}
          </>
        );
        const cell = `px-5 py-4 ${index > 0 ? 'border-t border-areia-200 sm:border-t-0 lg:border-l dark:border-areia-800' : ''}`;

        return item.href ? (
          <Link key={item.label} href={item.href} className={`${cell} block transition-colors hover:bg-white/50 dark:hover:bg-areia-800/50`}>{body}</Link>
        ) : (
          <div key={item.label} className={cell}>{body}</div>
        );
      })}
    </dl>
  );
}
