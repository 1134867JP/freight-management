import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import Button from '@/Components/UI/Button';
import QuotaUsageBar from '@/Features/Quota/QuotaUsageBar';
import { formatPeriod, plural } from '@/Features/Quota/format';
import { Head, Link, router, usePage } from '@inertiajs/react';

const FILTERS = [
  { key: 'active', label: 'Vigentes' },
  { key: 'finished', label: 'Encerradas' },
  { key: 'all', label: 'Todas' },
];

const COUNTERS = [
  { key: 'available', label: 'Disponíveis', accent: 'text-pinho-700 dark:text-pinho-300' },
  { key: 'booked', label: 'Reservadas', accent: 'text-ocre-700 dark:text-ocre-300' },
  { key: 'in_operation', label: 'Em operação', accent: 'text-aco-700 dark:text-aco-300' },
  { key: 'completed', label: 'Utilizadas', accent: 'text-areia-900 dark:text-white' },
  { key: 'expired', label: 'Não utilizadas', accent: 'text-areia-500 dark:text-areia-400' },
];

function TotalsStrip({ totals }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-areia-200 bg-areia-200 shadow-sm dark:border-areia-800 dark:bg-areia-800 sm:grid-cols-5">
      {COUNTERS.map((counter, index) => (
        <div
          key={counter.key}
          className={`bg-white px-5 py-4 dark:bg-areia-900 ${index === COUNTERS.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}
        >
          <dt className="text-[13px] font-medium text-areia-600 dark:text-areia-400">{counter.label}</dt>
          <dd className={`mt-0.5 text-[28px] font-bold leading-none tabular-nums ${counter.accent}`}>
            {Number(totals?.[counter.key] ?? 0).toLocaleString('pt-BR')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function QuotaRow({ quota }) {
  const usage = quota.usage || {};
  const open = () => router.visit(route('admin.quotas.show', quota.id));

  return (
    <li
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) open();
      }}
      className="group cursor-pointer px-4 py-4 transition hover:bg-areia-50 focus:outline-none focus-visible:bg-areia-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400 dark:hover:bg-areia-800/50 dark:focus-visible:bg-areia-800/50 sm:px-6"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_auto] md:items-center md:gap-6">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3 md:block">
            <p className="min-w-0 text-[17px] font-semibold leading-snug text-areia-900 dark:text-white">
              <span className="mr-2 text-[13px] font-semibold tabular-nums text-areia-500 dark:text-areia-400">{quota.code}</span>
              {quota.product_name} <span className="text-areia-400" aria-hidden="true">→</span> {quota.destination}
            </p>
            <span className="shrink-0 md:hidden">
              <StatusBadge label={quota.lifecycle?.label} tone={quota.lifecycle?.tone} />
            </span>
          </div>
          <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">
            {quota.operation_label} · {formatPeriod(quota.starts_on, quota.ends_on)} · {plural(quota.hours?.length ?? 0, 'horário', 'horários')}
          </p>
        </div>

        <div className="hidden md:block">
          <StatusBadge label={quota.lifecycle?.label} tone={quota.lifecycle?.tone} />
        </div>

        <div className="min-w-0">
          <QuotaUsageBar usage={usage} size="sm" />
          <p className="mt-1.5 text-[13px] text-areia-600 dark:text-areia-400">
            <span className="font-semibold tabular-nums text-areia-900 dark:text-areia-100">{usage.available ?? 0}</span>
            {' '}de{' '}
            <span className="tabular-nums">{usage.total ?? 0}</span> disponíveis
          </p>
        </div>

        <div className="hidden md:block">
          <Link
            href={route('admin.quotas.show', quota.id)}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-pinho-700 transition hover:bg-pinho-50 dark:text-pinho-300 dark:hover:bg-pinho-950/60"
          >
            Abrir <span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function Index({ quotas = [], totals = {}, filter = 'active' }) {
  const { auth } = usePage().props;
  const isCompanyAdmin = auth?.user?.role === 'company_admin';

  const publishButton = isCompanyAdmin ? (
    <Link href={route('admin.quotas.create')}>
      <Button size="lg">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Publicar cotas
      </Button>
    </Link>
  ) : null;

  const changeFilter = (next) => {
    if (next === filter) return;
    router.get(route('admin.quotas.index'), { filter: next }, { preserveState: true, preserveScroll: true });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Cotas" />
      <div className="py-6">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <PageHeader
            eyebrow="Operação"
            title="Cotas"
            subtitle="Publique cotas e acompanhe quem reservou cada uma."
            actions={publishButton}
          />

          <TotalsStrip totals={totals} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filtrar cotas" className="inline-flex rounded-lg bg-areia-100 p-1 dark:bg-areia-800">
              {FILTERS.map((item) => {
                const active = item.key === filter;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => changeFilter(item.key)}
                    className={[
                      'min-h-10 rounded-md px-4 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                      active
                        ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-900 dark:text-white'
                        : 'text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-white',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-areia-600 dark:text-areia-400">{plural(quotas.length, 'cota', 'cotas')}</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-areia-200 bg-white shadow-sm dark:border-areia-800 dark:bg-areia-900">
            {quotas.length === 0 ? (
              <EmptyState
                icon={(
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                    <path d="M3 7v10l9 4 9-4V7" />
                    <path d="M12 11v10" />
                  </svg>
                )}
                title={filter === 'finished' ? 'Nenhuma cota encerrada' : 'Nenhuma cota publicada'}
                description={
                  filter === 'finished'
                    ? 'Cotas encerradas ou com período vencido aparecem aqui.'
                    : 'Publique a primeira cota para que os clientes possam agendar sozinhos.'
                }
                action={filter !== 'finished' ? publishButton : null}
              />
            ) : (
              <>
                <div className="hidden border-b border-areia-200 bg-areia-50 px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-areia-500 dark:border-areia-800 dark:bg-areia-950/40 dark:text-areia-400 md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_auto] md:gap-6">
                  <span>Cota</span>
                  <span>Situação</span>
                  <span>Disponibilidade</span>
                  <span className="w-[72px]" aria-hidden="true" />
                </div>
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {quotas.map((quota) => (
                    <QuotaRow key={quota.id} quota={quota} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
