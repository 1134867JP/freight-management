import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import StatStrip from '@/Components/UI/StatStrip';
import IconTile from '@/Components/UI/IconTile';
import Button from '@/Components/UI/Button';
import QuotaUsageBar from '@/Features/Quota/QuotaUsageBar';
import { formatPeriod, plural } from '@/Features/Quota/format';
import { Head, Link, router, usePage } from '@inertiajs/react';

const FILTERS = [
  { key: 'active', label: 'Vigentes' },
  { key: 'finished', label: 'Encerradas' },
  { key: 'all', label: 'Todas' },
];

function Chevron() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-areia-400 transition group-hover:translate-x-0.5 group-hover:text-areia-700 dark:group-hover:text-areia-200"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m8 5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function rowTone(quota) {
  const key = quota.lifecycle?.key;
  if (key === 'open') return 'success';
  if (key === 'scheduled') return 'violet';
  return 'neutral';
}

function QuotaRow({ quota }) {
  const usage = quota.usage || {};
  const open = () => router.visit(route('admin.quotas.show', quota.id));
  const total = Number(usage.total ?? 0);
  const reservedPct =
    total > 0
      ? Math.round(
          ((Number(usage.booked ?? 0) +
            Number(usage.in_operation ?? 0) +
            Number(usage.completed ?? 0)) /
            total) *
            100,
        )
      : 0;

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
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 md:grid-cols-[auto_minmax(0,2.2fr)_auto_minmax(0,1.6fr)_auto] md:items-center md:gap-x-5">
        <IconTile tone={rowTone(quota)} size="md">
          {(quota.product_name ?? '?').charAt(0).toUpperCase()}
        </IconTile>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3 md:block">
            <p className="min-w-0 text-[17px] font-semibold leading-snug text-areia-900 dark:text-white">
              {quota.product_name}{' '}
              <span className="text-areia-400" aria-hidden="true">
                →
              </span>{' '}
              {quota.destination}
            </p>
            <span className="shrink-0 md:hidden">
              <StatusBadge label={quota.lifecycle?.label} tone={quota.lifecycle?.tone} />
            </span>
          </div>
          <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">
            <span className="font-mono text-[13px] font-semibold text-pinho-800 dark:text-pinho-300">
              {quota.code}
            </span>
            {' · '}
            {quota.operation_label} · {formatPeriod(quota.starts_on, quota.ends_on)} ·{' '}
            {plural(quota.hours?.length ?? 0, 'horário', 'horários')}
          </p>
        </div>

        <div className="hidden md:block">
          <StatusBadge label={quota.lifecycle?.label} tone={quota.lifecycle?.tone} />
        </div>

        <div className="col-span-2 min-w-0 md:col-span-1">
          <QuotaUsageBar usage={usage} />
          <p className="mt-1.5 flex items-baseline justify-between gap-2 text-[13px] text-areia-600 dark:text-areia-400">
            <span>
              <span className="font-semibold tabular-nums text-areia-900 dark:text-areia-100">
                {usage.available ?? 0}
              </span>{' '}
              de <span className="tabular-nums">{usage.total ?? 0}</span> disponíveis
            </span>
            <span className="tabular-nums">{reservedPct}% reservado</span>
          </p>
        </div>

        <div className="hidden md:block">
          <Link
            href={route('admin.quotas.show', quota.id)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Abrir cota ${quota.code}`}
            className="inline-flex min-h-9 items-center rounded-lg px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400"
          >
            <Chevron />
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
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Publicar cotas
      </Button>
    </Link>
  ) : null;

  const changeFilter = (next) => {
    if (next === filter) return;
    router.get(
      route('admin.quotas.index'),
      { filter: next },
      { preserveState: true, preserveScroll: true },
    );
  };

  const stats = [
    { label: 'Disponíveis', tone: 'success', value: totals?.available ?? 0 },
    { label: 'Reservadas', tone: 'warning', value: totals?.booked ?? 0 },
    { label: 'Em operação', tone: 'info', value: totals?.in_operation ?? 0 },
    { label: 'Utilizadas', tone: 'success', value: totals?.completed ?? 0 },
    { label: 'Não utilizadas', tone: 'danger', value: totals?.expired ?? 0 },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Cotas" />
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <PageHeader
          title="Cotas"
          subtitle="Publique cotas e acompanhe quem reservou cada uma."
          actions={publishButton}
        />

        <StatStrip items={stats} />

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filtrar cotas"
              className="inline-flex rounded-xl bg-areia-200/60 p-1 dark:bg-areia-800/60"
            >
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
                      'min-h-10 rounded-lg px-4 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                      active
                        ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-700 dark:text-white'
                        : 'text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-white',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-areia-600 dark:text-areia-400">
              {plural(quotas.length, 'cota', 'cotas')}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-areia-200 bg-white shadow-[0_1px_2px_rgba(37,35,32,0.04),0_8px_24px_-16px_rgba(37,35,32,0.12)] dark:border-areia-800 dark:bg-areia-900">
            {quotas.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                    <path d="M3 7v10l9 4 9-4V7" />
                    <path d="M12 11v10" />
                  </svg>
                }
                title={filter === 'finished' ? 'Nenhuma cota encerrada' : 'Nenhuma cota publicada'}
                description={
                  filter === 'finished'
                    ? 'Cotas encerradas ou com período vencido aparecem aqui.'
                    : 'Publique a primeira cota para que os clientes possam agendar sozinhos.'
                }
                action={filter !== 'finished' ? publishButton : null}
              />
            ) : (
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {quotas.map((quota) => (
                  <QuotaRow key={quota.id} quota={quota} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
