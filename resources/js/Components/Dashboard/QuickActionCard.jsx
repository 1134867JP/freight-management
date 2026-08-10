import React from 'react';
import { Link } from '@inertiajs/react';

const TONES = {
  brand: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function QuickActionCard({ href, title, description, icon, tone = 'brand', badge = null }) {
  return (
    <Link
      href={href}
      className="group flex min-h-40 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[tone] ?? TONES.brand}`}>
          {icon}
        </span>
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          <svg className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  );
}
