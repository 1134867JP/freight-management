import React from 'react';
import { Link } from '@inertiajs/react';

export default function QuickActionCard({ href, title, description, icon, badge = null }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-sm border border-concrete-300 bg-white p-4 transition-colors hover:border-ink hover:bg-signal-50 focus:outline-none focus:ring-2 focus:ring-signal-400 focus:ring-offset-2 dark:border-concrete-800 dark:bg-concrete-900 dark:hover:border-signal-400 dark:hover:bg-concrete-800"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-signal-400 transition-colors group-hover:bg-signal-400 group-hover:text-ink dark:bg-concrete-800">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold uppercase leading-tight tracking-[0.04em] text-ink dark:text-white">{title}</h3>
          {badge && (
            <span className="stencil bg-concrete-200 px-2 py-0.5 text-[10px] text-concrete-700 dark:bg-concrete-800 dark:text-concrete-300">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-5 text-concrete-600 dark:text-concrete-400">{description}</p>
      </div>
      <svg className="mt-1 h-5 w-5 shrink-0 text-concrete-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink dark:group-hover:text-signal-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </Link>
  );
}
