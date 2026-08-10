import React from 'react';

const TONES = {
  neutral: {
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    bar: 'bg-slate-300 dark:bg-slate-600',
  },
  brand: {
    icon: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  danger: {
    icon: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
};

export default function MetricCard({ label, value, icon, tone = 'neutral', detail = null }) {
  const colors = TONES[tone] ?? TONES.neutral;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${colors.bar}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{detail}</p>}
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${colors.icon}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
