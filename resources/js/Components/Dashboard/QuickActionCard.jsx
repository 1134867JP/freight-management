import React from 'react';
import { Link } from '@inertiajs/react';

export default function QuickActionCard({ href, title, description, icon, badge = null }) {
  return (
    <Link
      href={href}
      className="group flex min-h-[88px] items-start gap-4 rounded-xl border border-areia-200 bg-white p-5 shadow-sm transition hover:border-pinho-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400 focus-visible:ring-offset-2 dark:border-areia-800 dark:bg-areia-900 dark:hover:border-pinho-700"
    >
      <span className="mt-0.5 shrink-0 text-pinho-700 dark:text-pinho-300">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-areia-900 dark:text-white">{title}</h3>
          {badge && (
            <span className="rounded-md bg-areia-100 px-2 py-0.5 text-xs font-semibold text-areia-700 dark:bg-areia-800 dark:text-areia-300">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-[15px] leading-snug text-areia-600 dark:text-areia-400">{description}</p>
      </div>
      <svg className="mt-1 h-5 w-5 shrink-0 text-areia-400 transition group-hover:translate-x-0.5 group-hover:text-pinho-700 dark:group-hover:text-pinho-300" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
