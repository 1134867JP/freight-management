import React from 'react';
import Button from '@/Components/UI/Button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import StatStrip from '@/Components/UI/StatStrip';
import IconTile from '@/Components/UI/IconTile';
import SectionTitle from '@/Components/UI/SectionTitle';
import { Head, Link, router, usePage } from '@inertiajs/react';
import QuotaUsageBar from '@/Features/Quota/QuotaUsageBar';
import { formatClock, formatPeriod } from '@/Features/Quota/format';
import { formatPlate } from '@/utils/formatters';

const ICON_PROPS = {
  className: 'h-5 w-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICONS = {
  document: (
    <svg {...ICON_PROPS}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  ),
  clock: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  hourglass: (
    <svg {...ICON_PROPS}>
      <path d="M7 3h10M7 21h10M8 3v3.5a4 4 0 0 0 1.6 3.2L12 12l2.4-2.3A4 4 0 0 0 16 6.5V3M8 21v-3.5a4 4 0 0 1 1.6-3.2L12 12l2.4 2.3A4 4 0 0 1 16 17.5V21" />
    </svg>
  ),
  calendar: (
    <svg {...ICON_PROPS}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  question: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
    </svg>
  ),
  lightbulb: (
    <svg {...ICON_PROPS}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
    </svg>
  ),
  trend: (
    <svg {...ICON_PROPS}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  check: (
    <svg {...ICON_PROPS}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
};

const ATTENTION_ICON = {
  documents: 'document',
  late: 'clock',
  expiring: 'hourglass',
  open_hours: 'calendar',
  unresolved: 'question',
};

const TONE_COUNT = {
  neutral: 'text-areia-700 dark:text-areia-200',
  info: 'text-aco-700 dark:text-aco-200',
  success: 'text-pinho-700 dark:text-pinho-300',
  warning: 'text-ocre-700 dark:text-ocre-200',
  danger: 'text-tijolo-700 dark:text-tijolo-300',
};

const ROW_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400';

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

function Panel({ children, className = '' }) {
  return (
    <div
      className={`glass overflow-hidden rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}


function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function statusSentence(attention, today) {
  const points = attention.length;
  const total = today?.total ?? 0;
  const first =
    points === 0 ? 'Nenhuma pendência' : plural(points, 'ponto de atenção', 'pontos de atenção');
  const second =
    total === 0
      ? 'nenhum agendamento hoje'
      : plural(total, 'agendamento hoje', 'agendamentos hoje');
  return `${first} · ${second}`;
}

function Hero({ companyName, dateLabel, attention, today, canPublish }) {
  return (
    <section className="glass-dark relative overflow-hidden rounded-3xl p-6 text-white sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-pinho-700/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-ocre-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          {companyName && (
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ocre-300">
              {companyName}
            </p>
          )}
          <p className="text-[15px] text-white/70 sm:ml-auto">{dateLabel}</p>
        </div>
        <h1 className="mt-2 font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
          Central da operação
        </h1>
        <p className="mt-2 text-base text-white/80">{statusSentence(attention, today)}</p>

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Ações">
          <Button
            variant="accent"
            onClick={() => router.visit(route('admin.bookings.index', { filter: 'documents' }))}
          >
            Resolver pendências
          </Button>
          <Button variant="inverse" onClick={() => router.visit(route('admin.bookings.index'))}>
            Ver agendamentos
          </Button>
          {canPublish && (
            <Button variant="inverse" onClick={() => router.visit(route('admin.quotas.create'))}>
              Publicar cotas
            </Button>
          )}
          <Button variant="inverse" onClick={() => router.visit(route('admin.agenda'))}>Ver operação</Button>
        </div>
      </div>
    </section>
  );
}

function AttentionPanel({ attention }) {
  if (attention.length === 0) {
    return (
      <Panel className="border-pinho-200 bg-pinho-50 dark:border-pinho-900 dark:bg-pinho-950/40">
        <div className="flex items-center gap-4 px-5 py-5">
          <IconTile tone="success" size="md">
            {ICONS.check}
          </IconTile>
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
          const tone = TONE_COUNT[item.tone] ? item.tone : 'neutral';
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`group flex min-h-[72px] items-center gap-4 px-5 py-3.5 transition hover:bg-white/50 dark:hover:bg-areia-800/60 ${ROW_FOCUS}`}
              >
                <IconTile tone={tone} size="md">
                  {ICONS[ATTENTION_ICON[item.key]] ?? ICONS.question}
                </IconTile>
                <span
                  className={`min-w-[2.5rem] text-right font-display text-[32px] font-bold leading-none tabular-nums ${TONE_COUNT[tone]}`}
                >
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

const TOTAL_ITEMS = [
  ['published', 'Publicadas', 'neutral'],
  ['available', 'Disponíveis', 'success'],
  ['booked', 'Reservadas', 'warning'],
  ['in_operation', 'Em operação', 'info'],
  ['completed', 'Utilizadas', 'success'],
  ['not_used', 'Não utilizadas', 'danger'],
];

function QuotasPanel({ totals, activeQuotas }) {
  const items = TOTAL_ITEMS.map(([key, label, tone]) => ({
    label,
    tone,
    value: totals?.[key] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <StatStrip items={items} />

      {activeQuotas.length === 0 ? (
        <Panel>
          <p className="px-5 py-6 text-[15px] text-areia-600 dark:text-areia-400">
            Nenhuma cota aberta para reservas no momento.
          </p>
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-areia-200 dark:divide-areia-800">
            {activeQuotas.slice(0, 5).map((quota) => {
              const available = quota.usage?.available ?? 0;
              return (
                <li key={quota.id}>
                  <Link
                    href={route('admin.quotas.show', quota.id)}
                    className={`group grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-5 py-3.5 transition hover:bg-white/50 dark:hover:bg-areia-800/60 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] ${ROW_FOCUS}`}
                  >
                    <IconTile tone="brand" size="md">
                      {(quota.product_name ?? '?').charAt(0).toUpperCase()}
                    </IconTile>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                        {quota.product_name} → {quota.destination}
                      </p>
                      <p className="text-[13px] text-areia-600 dark:text-areia-400">
                        <span className="font-mono">{quota.code}</span> ·{' '}
                        {formatPeriod(quota.starts_on, quota.ends_on)}
                      </p>
                    </div>
                    <QuotaUsageBar
                      usage={quota.usage}
                      size="sm"
                      className="col-span-2 md:col-span-1"
                    />
                    <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:justify-end">
                      <span className="text-sm font-semibold tabular-nums text-areia-800 dark:text-areia-200">
                        {available} {available === 1 ? 'disponível' : 'disponíveis'}
                      </span>
                      <Chevron />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <div className="px-1">
        <Link
          href={route('admin.quotas.index')}
          className="text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
        >
          Todas as cotas
        </Link>
      </div>
    </div>
  );
}

function InsightsPanel({ insights }) {
  return (
    <section>
      <SectionTitle
        aside={
          <span className="text-[13px] font-normal text-areia-600 dark:text-areia-400">
            Calculado a partir do histórico de agendamentos
          </span>
        }
      >
        Sinais da operação
      </SectionTitle>
      <Panel>
        <ul className="divide-y divide-areia-200 dark:divide-areia-800">
          {insights.map((insight) => {
            const tone = TONE_COUNT[insight.tone] ? insight.tone : 'neutral';
            const icon = tone === 'success' || tone === 'info' ? ICONS.trend : ICONS.lightbulb;
            return (
              <li key={insight.key} className="flex items-start gap-3 px-5 py-4">
                <IconTile tone={tone} size="sm">
                  {icon}
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug text-areia-900 dark:text-areia-100">
                    {insight.title}
                  </p>
                  {insight.detail && (
                    <p className="mt-0.5 text-sm leading-relaxed text-areia-600 dark:text-areia-400">
                      {insight.detail}
                    </p>
                  )}
                </div>
                {insight.action && (
                  <Link
                    href={insight.action.href}
                    className="shrink-0 text-sm font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
                  >
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
      <SectionTitle>Hoje</SectionTitle>
      <Panel>
        <div className="border-b border-areia-200 bg-areia-50/60 px-5 py-3 text-[15px] text-areia-700 dark:border-areia-800 dark:bg-areia-800/30 dark:text-areia-300">
          <span className="font-display font-bold tabular-nums text-areia-900 dark:text-white">
            {today?.total ?? 0}
          </span>{' '}
          agendamentos
          <span className="mx-1.5 text-areia-400">·</span>
          <span className="font-display font-bold tabular-nums text-areia-900 dark:text-white">
            {today?.arrived ?? 0}
          </span>{' '}
          chegaram
          <span className="mx-1.5 text-areia-400">·</span>
          <span className="font-display font-bold tabular-nums text-areia-900 dark:text-white">
            {today?.completed ?? 0}
          </span>{' '}
          concluídos
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <IconTile tone="neutral" size="md" className="mb-3">
              {ICONS.calendar}
            </IconTile>
            <p className="text-base font-semibold text-areia-900 dark:text-white">
              Nenhum agendamento para hoje.
            </p>
            <p className="mt-1 text-[15px] text-areia-600 dark:text-areia-400">
              Quando os clientes reservarem horários, a fila do dia aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-areia-200 dark:divide-areia-800">
            {bookings.map((booking) => {
              const docsComplete = booking.documents_received >= booking.documents_required;
              return (
                <li key={booking.id}>
                  <Link
                    href={route('admin.bookings.show', booking.id)}
                    className={`group flex min-h-[72px] items-center gap-4 px-5 py-3 transition hover:bg-white/50 dark:hover:bg-areia-800/60 ${ROW_FOCUS}`}
                  >
                    <span className="w-14 shrink-0 font-mono text-lg font-semibold tabular-nums text-pinho-800 dark:text-pinho-200">
                      {formatClock(booking.scheduled_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                        <span className="truncate">{booking.client?.name ?? 'Cliente'}</span>
                        {booking.vehicle?.plate ? (
                          <span className="plate text-[12px]">
                            {formatPlate(booking.vehicle.plate)}
                          </span>
                        ) : (
                          <span className="text-[13px] font-normal text-ocre-700 dark:text-ocre-300">
                            Veículo a informar
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[13px] text-areia-600 dark:text-areia-400">
                        {booking.product_name} → {booking.destination}
                        <span className="mx-1.5">·</span>
                        <span
                          className={
                            docsComplete ? '' : 'font-semibold text-ocre-700 dark:text-ocre-300'
                          }
                        >
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
  const rawDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <AuthenticatedLayout>
      <Head title="Central da operação" />
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <Hero
          companyName={auth?.company?.name}
          dateLabel={dateLabel}
          attention={attention}
          today={today}
          canPublish={canPublish}
        />

        <section aria-labelledby="atencao">
          <SectionTitle id="atencao">Atenção</SectionTitle>
          <AttentionPanel attention={attention} />
        </section>

        <section>
          <SectionTitle>Cotas</SectionTitle>
          <QuotasPanel totals={totals} activeQuotas={activeQuotas} />
        </section>

        {insights.length > 0 && <InsightsPanel insights={insights} />}

        <TodayPanel today={today} />
      </div>
    </AuthenticatedLayout>
  );
}
