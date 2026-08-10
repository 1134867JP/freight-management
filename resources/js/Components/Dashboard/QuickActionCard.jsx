import React from 'react';
import { Link } from '@inertiajs/react';

const TONES = {
  brand: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
  success: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  warning: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  violet: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function QuickActionCard({ href, title, description, icon, tone = 'brand', badge = null }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:border-slate-300 hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/40"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${TONES[tone] ?? TONES.brand}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          {badge && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <svg className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-600 dark:text-slate-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
