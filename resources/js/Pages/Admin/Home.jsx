import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import Button from '@/Components/UI/Button';
import { Head, Link, router, usePage } from '@inertiajs/react';
import QuotaUsageBar from '@/Features/Quota/QuotaUsageBar';
import { formatClock, formatPeriod } from '@/Features/Quota/format';
import { formatPlate } from '@/utils/formatters';

const TONE_DOT = {
  neutral: 'bg-areia-400 dark:bg-areia-500',
  info: 'bg-aco-500 dark:bg-aco-300',
  success: 'bg-pinho-600 dark:bg-pinho-300',
  warning: 'bg-ocre-500 dark:bg-ocre-300',
  danger: 'bg-tijolo-600 dark:bg-tijolo-300',
};

const TONE_COUNT = {
  neutral: 'text-areia-700 dark:text-areia-200',
  info: 'text-aco-700 dark:text-aco-200',
  success: 'text-pinho-700 dark:text-pinho-300',
  warning: 'text-ocre-700 dark:text-ocre-200',
  danger: 'text-tijolo-700 dark:text-tijolo-300',
};

const TONE_BAR = {
  neutral: 'border-l-areia-400 dark:border-l-areia-500',
  info: 'border-l-aco-500 dark:border-l-aco-300',
  success: 'border-l-pinho-600 dark:border-l-pinho-300',
  warning: 'border-l-ocre-500 dark:border-l-ocre-300',
  danger: 'border-l-tijolo-600 dark:border-l-tijolo-300',
};

function Chevron() {
  return (
    <svg className="h-5 w-5 shrink-0 text-areia-400 transition group-hover:translate-x-0.5 group-hover:text-areia-700 dark:group-hover:text-areia-200" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionLabel({ children, aside = null }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-areia-500 dark:text-areia-400">{children}</h2>
      {aside}
    </div>
  );
}

function Panel({ children, className = '' }) {
  return (
    <section className={`rounded-xl border border-areia-200 bg-white shadow-sm dark:border-areia-800 dark:bg-areia-900 ${className}`}>
      {children}
    </section>
  );
}

function AttentionPanel({ attention }) {
  if (attention.length === 0) {
    return (
      <Panel className="border-pinho-200 bg-pinho-50 dark:border-pinho-900 dark:bg-pinho-950/40">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pinho-100 text-pinho-700 dark:bg-pinho-900/60 dark:text-pinho-200" aria-hidden="true">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none"><path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <p className="text-base font-semibold text-pinho-800 dark:text-pinho-200">
            Nenhuma pendência agora. A operação está em dia.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <ul className="divide-y divide-areia-200 dark:divide-areia-800">
        {attention.map((item) => {
          const tone = TONE_DOT[item.tone] ? item.tone : 'neutral';
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`group flex min-h-[64px] items-center gap-4 border-l-4 px-5 py-3.5 transition hover:bg-areia-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400 dark:hover:bg-areia-800/60 ${TONE_BAR[tone]}`}
              >
                <span className={`min-w-[2.25rem] text-right text-[32px] font-bold leading-none tabular-nums ${TONE_COUNT[tone]}`}>
                  {item.count}
                </span>
                <span className="min-w-0 flex-1 text-base font-medium leading-snug text-areia-900 dark:text-areia-100">
                  {item.title}
                </span>
                <Chevron />
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

const TOTAL_LABELS = [
  ['published', 'Publicadas'],
  ['available', 'Disponíveis'],
  ['booked', 'Reservadas'],
  ['in_operation', 'Em operação'],
  ['completed', 'Utilizadas'],
  ['not_used', 'Não utilizadas'],
];

function QuotasPanel({ totals, activeQuotas }) {
  return (
    <Panel>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-t-xl bg-areia-200 dark:bg-areia-800 sm:grid-cols-6">
        {TOTAL_LABELS.map(([key, label]) => (
          <div key={key} className="bg-white px-4 py-3 dark:bg-areia-900">
            <dt className="truncate text-[13px] text-areia-500 dark:text-areia-400">{label}</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums text-areia-900 dark:text-white">{totals?.[key] ?? 0}</dd>
          </div>
        ))}
      </dl>

      {activeQuotas.length === 0 ? (
        <p className="px-5 py-6 text-[15px] text-areia-600 dark:text-areia-400">Nenhuma cota aberta para reservas no momento.</p>
      ) : (
        <ul className="divide-y divide-areia-200 border-t border-areia-200 dark:divide-areia-800 dark:border-areia-800">
          {activeQuotas.slice(0, 5).map((quota) => (
            <li key={quota.id}>
              <Link
                href={route('admin.quotas.show', quota.id)}
                className="group grid min-h-[64px] grid-cols-1 items-center gap-x-4 gap-y-2 px-5 py-3 transition hover:bg-areia-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400 dark:hover:bg-areia-800/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                    {quota.product_name} → {quota.destination}
                  </p>
                  <p className="text-[13px] text-areia-500 dark:text-areia-400">
                    {quota.code} · {formatPeriod(quota.starts_on, quota.ends_on)}
                  </p>
                </div>
                <QuotaUsageBar usage={quota.usage} size="sm" />
                <div className="flex items-center gap-2 md:justify-end">
                  <span className="text-sm font-semibold tabular-nums text-areia-800 dark:text-areia-200">
                    {quota.usage?.available ?? 0} {(quota.usage?.available ?? 0) === 1 ? 'disponível' : 'disponíveis'}
                  </span>
                  <Chevron />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-areia-200 px-5 py-3 dark:border-areia-800">
        <Link href={route('admin.quotas.index')} className="text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
          Todas as cotas
        </Link>
      </div>
    </Panel>
  );
}

function InsightsPanel({ insights }) {
  return (
    <section>
      <SectionLabel aside={<span className="text-[13px] text-areia-500 dark:text-areia-400">Calculado a partir do histórico de agendamentos</span>}>
        Sinais da operação
      </SectionLabel>
      <Panel>
        <ul className="divide-y divide-areia-200 dark:divide-areia-800">
          {insights.map((insight) => {
            const tone = TONE_DOT[insight.tone] ? insight.tone : 'neutral';
            return (
              <li key={insight.key} className="flex items-start gap-3 px-5 py-4">
                <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug text-areia-900 dark:text-areia-100">{insight.title}</p>
                  {insight.detail && (
                    <p className="mt-0.5 text-sm leading-relaxed text-areia-500 dark:text-areia-400">{insight.detail}</p>
                  )}
                </div>
                {insight.action && (
                  <Link href={insight.action.href} className="shrink-0 text-sm font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
                    {insight.action.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}

function TodayPanel({ today }) {
  const bookings = today?.bookings ?? [];

  return (
    <section>
      <SectionLabel>Hoje</SectionLabel>
      <Panel>
        <div className="border-b border-areia-200 px-5 py-3 text-[15px] text-areia-700 dark:border-areia-800 dark:text-areia-300">
          <span className="font-semibold tabular-nums text-areia-900 dark:text-white">{today?.total ?? 0}</span> agendamentos
          <span className="mx-1.5 text-areia-400">·</span>
          <span className="font-semibold tabular-nums text-areia-900 dark:text-white">{today?.arrived ?? 0}</span> chegaram
          <span className="mx-1.5 text-areia-400">·</span>
          <span className="font-semibold tabular-nums text-areia-900 dark:text-white">{today?.completed ?? 0}</span> concluídos
        </div>

        {bookings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-base font-semibold text-areia-900 dark:text-white">Nenhum agendamento para hoje.</p>
            <p className="mt-1 text-[15px] text-areia-600 dark:text-areia-400">Quando os clientes reservarem horários, a fila do dia aparece aqui.</p>
          </div>
        ) : (
          <ul className="divide-y divide-areia-200 dark:divide-areia-800">
            {bookings.map((booking) => {
              const docsComplete = booking.documents_received >= booking.documents_required;
              return (
                <li key={booking.id}>
                  <Link
                    href={route('admin.bookings.show', booking.id)}
                    className="group flex min-h-[64px] items-center gap-4 px-5 py-3 transition hover:bg-areia-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400 dark:hover:bg-areia-800/60"
                  >
                    <span className="w-14 shrink-0 text-lg font-bold tabular-nums text-areia-900 dark:text-white">
                      {formatClock(booking.scheduled_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                        {booking.client?.name ?? 'Cliente'}
                        <span className="ml-2 font-normal text-areia-600 dark:text-areia-400">
                          {booking.vehicle?.plate ? formatPlate(booking.vehicle.plate) : <span className="text-ocre-700 dark:text-ocre-300">Veículo a informar</span>}
                        </span>
                      </p>
                      <p className="truncate text-[13px] text-areia-500 dark:text-areia-400">
                        {booking.product_name} → {booking.destination}
                        <span className="mx-1.5">·</span>
                        <span className={docsComplete ? '' : 'font-semibold text-ocre-700 dark:text-ocre-300'}>
                          docs {booking.documents_received}/{booking.documents_required}
                        </span>
                      </p>
                    </div>
                    <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
                    <Chevron />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </section>
  );
}

export default function Home({
  canPublish = false,
  attention = [],
  totals = {},
  today = { total: 0, arrived: 0, completed: 0, bookings: [] },
  activeQuotas = [],
  insights = [],
}) {
  const { auth } = usePage().props;
  const rawDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <AuthenticatedLayout>
      <Head title="Central da operação" />
      <div className="py-6">
        <div className="mx-auto max-w-[1100px] space-y-8 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <header>
            {auth?.company?.name && (
              <p className="mb-1 text-[15px] font-semibold text-pinho-700 dark:text-pinho-300">{auth.company.name}</p>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-[28px] font-bold leading-tight text-areia-900 dark:text-white">Central da operação</h1>
              <p className="text-[15px] text-areia-600 dark:text-areia-400">{dateLabel}</p>
            </div>
          </header>

          <section aria-labelledby="atencao">
            <SectionLabel>
              <span id="atencao">Atenção</span>
            </SectionLabel>
            <AttentionPanel attention={attention} />
          </section>

          <section aria-label="Ações">
            <SectionLabel>Ações</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => router.visit(route('admin.bookings.index', { filter: 'documents' }))}>
                Resolver pendências
              </Button>
              <Button size="lg" variant="secondary" onClick={() => router.visit(route('admin.bookings.index'))}>
                Ver agendamentos
              </Button>
              {canPublish && (
                <Button size="lg" variant="secondary" onClick={() => router.visit(route('admin.quotas.create'))}>
                  Publicar cotas
                </Button>
              )}
              <Button size="lg" variant="secondary" onClick={() => router.visit(route('admin.agenda'))}>
                Ver operação
              </Button>
            </div>
          </section>

          <section>
            <SectionLabel>Cotas</SectionLabel>
            <QuotasPanel totals={totals} activeQuotas={activeQuotas} />
          </section>

          {insights.length > 0 && <InsightsPanel insights={insights} />}

          <TodayPanel today={today} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
