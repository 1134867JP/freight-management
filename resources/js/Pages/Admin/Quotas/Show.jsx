import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import StatStrip from '@/Components/UI/StatStrip';
import IconTile from '@/Components/UI/IconTile';
import SectionTitle from '@/Components/UI/SectionTitle';
import Button from '@/Components/UI/Button';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import QuotaUsageBar from '@/Features/Quota/QuotaUsageBar';
import {
  formatPeriod,
  formatSchedule,
  formatShortDate,
  formatTons,
  formatWeekdayDate,
  plural,
} from '@/Features/Quota/format';
import { formatDateTime, formatPlate } from '@/utils/formatters';
import { Head, Link, router, usePage } from '@inertiajs/react';

const BOOKING_FILTERS = [
  { key: 'all', label: 'Todos', match: () => true },
  {
    key: 'docs_pending',
    label: 'Documentação pendente',
    match: (b) => b.stage?.key === 'docs_pending',
  },
  { key: 'late', label: 'Atrasados', match: (b) => b.late || b.stage?.key === 'late' },
  {
    key: 'yard',
    label: 'No pátio / Em operação',
    match: (b) => ['in_yard', 'in_operation'].includes(b.stage?.key),
  },
  { key: 'completed', label: 'Concluídos', match: (b) => b.stage?.key === 'completed' },
  {
    key: 'cancelled',
    label: 'Cancelados / Não compareceu',
    match: (b) => ['cancelled', 'no_show'].includes(b.stage?.key),
  },
];

const STRIPES = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(120,113,108,0.28) 4px, rgba(120,113,108,0.28) 6px)',
};

function SectionHeading({ title, aside = null }) {
  return (
    <SectionTitle
      aside={
        aside && (
          <span className="text-[13px] font-normal text-areia-600 dark:text-areia-400">
            {aside}
          </span>
        )
      }
    >
      {title}
    </SectionTitle>
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

function Meta({ children }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

function OccupancyCell({ slot }) {
  if (!slot) {
    return <td className="px-1 py-1 text-center text-areia-300 dark:text-areia-700">·</td>;
  }

  const full = slot.capacity > 0 && slot.occupied >= slot.capacity;
  const partial = !full && slot.occupied > 0;
  const ratio = slot.capacity > 0 ? slot.occupied / slot.capacity : 0;

  let tone = 'bg-areia-100 text-areia-500 dark:bg-areia-800 dark:text-areia-400';
  if (slot.closed) tone = 'bg-areia-200 text-areia-600 dark:bg-areia-700 dark:text-areia-300';
  else if (full) tone = 'bg-ocre-200 text-ocre-900 dark:bg-ocre-800/70 dark:text-ocre-100';
  else if (partial && ratio >= 0.5)
    tone = 'bg-pinho-200 text-pinho-900 dark:bg-pinho-800/70 dark:text-pinho-100';
  else if (partial) tone = 'bg-pinho-100 text-pinho-800 dark:bg-pinho-900/60 dark:text-pinho-200';

  return (
    <td className="px-1 py-1 text-center">
      <span
        className={`flex h-10 min-w-[56px] items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums ${tone}`}
        style={slot.closed ? STRIPES : undefined}
        title={slot.closed ? 'Horário fechado' : `${slot.occupied} de ${slot.capacity} ocupados`}
      >
        {slot.occupied}/{slot.capacity}
      </span>
    </td>
  );
}

function OccupancyGrid({ grid }) {
  const times = useMemo(
    () => Array.from(new Set(grid.flatMap((day) => day.slots.map((slot) => slot.time)))).sort(),
    [grid],
  );

  if (grid.length === 0) {
    return (
      <Panel>
        <p className="px-5 py-8 text-center text-sm text-areia-600 dark:text-areia-400">
          Nenhum horário gerado para esta cota.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-[13px] font-semibold text-areia-600 dark:bg-areia-900 dark:text-areia-400">
                Dia
              </th>
              {times.map((time) => (
                <th
                  key={time}
                  className="px-1 py-3 text-center text-[13px] font-semibold tabular-nums text-areia-600 dark:text-areia-400"
                >
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((day) => {
              const byTime = Object.fromEntries(day.slots.map((slot) => [slot.time, slot]));
              return (
                <tr key={day.date}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap border-t border-areia-100 bg-white px-4 py-1 text-left text-[15px] font-semibold capitalize text-areia-800 dark:border-areia-800 dark:bg-areia-900 dark:text-areia-100"
                  >
                    {formatWeekdayDate(day.date)}
                  </th>
                  {times.map((time) => (
                    <OccupancyCell key={time} slot={byTime[time]} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-areia-200 bg-areia-50/60 px-4 py-3 text-[13px] text-areia-600 dark:border-areia-800 dark:bg-areia-950/30 dark:text-areia-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-areia-100 ring-1 ring-areia-300 dark:bg-areia-800 dark:ring-areia-600" />
          Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-pinho-100 ring-1 ring-pinho-200 dark:bg-pinho-900/60 dark:ring-pinho-800" />
          Até metade
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-pinho-200 dark:bg-pinho-800/70" />
          Mais da metade
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-ocre-200 dark:bg-ocre-800/70" />
          Lotado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-areia-200 dark:bg-areia-700" style={STRIPES} />
          Fechado
        </span>
        <span className="sm:ml-auto">ocupados/capacidade</span>
      </div>
    </Panel>
  );
}

function DocsIndicator({ booking }) {
  const required = booking.documents_required ?? 0;
  const received = booking.documents_received ?? 0;
  if (required === 0) return <span className="text-areia-400">—</span>;
  const done = received >= required;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${done ? 'text-pinho-700 dark:text-pinho-300' : 'text-ocre-700 dark:text-ocre-300'}`}
    >
      {done ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <span className="h-2 w-2 rounded-full bg-ocre-500" aria-hidden="true" />
      )}
      {received}/{required}
      <span className="sr-only">{done ? 'documentos completos' : 'documentos pendentes'}</span>
    </span>
  );
}

function BookingRow({ booking }) {
  const plate = booking.vehicle?.plate;
  return (
    <li>
      <Link
        href={route('admin.bookings.show', booking.id)}
        className="block px-4 py-4 transition hover:bg-white/50 focus:outline-none focus-visible:bg-areia-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocre-400 dark:hover:bg-areia-800/50 sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:grid md:grid-cols-[110px_130px_minmax(0,1.6fr)_minmax(0,1.2fr)_90px_70px_70px_auto] md:gap-x-5">
          <span className="order-1 font-mono text-[15px] font-semibold text-pinho-800 dark:text-pinho-300 md:order-none">
            {booking.code}
          </span>
          <span className="order-4 text-sm tabular-nums text-areia-700 dark:text-areia-300 md:order-none">
            {formatSchedule(booking.scheduled_at)}
          </span>
          <span className="order-3 w-full min-w-0 truncate text-[15px] font-medium text-areia-900 dark:text-areia-100 md:order-none md:w-auto">
            {booking.client?.name ?? '—'}
          </span>
          <span className="order-4 min-w-0 truncate text-sm md:order-none">
            {plate ? (
              <span className="plate text-[12px]">{formatPlate(plate)}</span>
            ) : (
              <span className="text-areia-600 dark:text-areia-400">Veículo a informar</span>
            )}
          </span>
          <span className="order-4 text-sm tabular-nums text-areia-700 dark:text-areia-300 md:order-none">
            <span className="text-areia-500 dark:text-areia-400 md:hidden">NF </span>
            {booking.invoice_number || '—'}
          </span>
          <span className="order-4 text-sm tabular-nums text-areia-700 dark:text-areia-300 md:order-none">
            {formatTons(booking.weight ?? booking.net_weight)}
          </span>
          <span className="order-4 md:order-none">
            <DocsIndicator booking={booking} />
          </span>
          <span className="order-2 ml-auto md:order-none md:ml-0 md:justify-self-end">
            <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function Show({ quota, clients = [], bookings = [], grid = [] }) {
  const { auth } = usePage().props;
  const confirm = useConfirm();
  const isCompanyAdmin = auth?.user?.role === 'company_admin';
  const [bookingFilter, setBookingFilter] = useState('all');
  const [busy, setBusy] = useState(null);

  const usage = quota.usage || {};
  const lifecycleKey = quota.lifecycle?.key;
  const canNotify = ['open', 'scheduled'].includes(lifecycleKey);
  const hours = quota.hours ?? [];

  const counts = useMemo(
    () => Object.fromEntries(BOOKING_FILTERS.map((f) => [f.key, bookings.filter(f.match).length])),
    [bookings],
  );
  const visibleBookings = useMemo(() => {
    const current = BOOKING_FILTERS.find((f) => f.key === bookingFilter) ?? BOOKING_FILTERS[0];
    return bookings.filter(current.match);
  }, [bookings, bookingFilter]);

  const run = (key, method, url) => {
    setBusy(key);
    router[method](url, {}, { preserveScroll: true, onFinish: () => setBusy(null) });
  };

  const notify = () => run('notify', 'post', route('admin.quotas.notify', quota.id));
  const reopen = () => run('reopen', 'patch', route('admin.quotas.reopen', quota.id));
  const close = async () => {
    const ok = await confirm(
      'Os clientes não poderão fazer novos agendamentos nesta cota. Agendamentos existentes são mantidos.',
      `Encerrar ${quota.code}?`,
    );
    if (ok) run('close', 'patch', route('admin.quotas.close', quota.id));
  };

  const documentsRequired = [
    quota.requires_invoice ? 'Nota fiscal' : null,
    quota.requires_weight_ticket ? 'Comprovante de peso' : null,
  ].filter(Boolean);

  return (
    <AuthenticatedLayout>
      <Head title={quota.code} />
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        {/* Cabeçalho */}
        <div>
          <Link
            href={route('admin.quotas.index')}
            className="mb-3 inline-flex items-center gap-1 text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
          >
            <span aria-hidden="true">←</span> Cotas
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="mb-1.5 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-pinho-700 dark:text-pinho-300">
                {quota.code}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-areia-900 dark:text-white">
                  {quota.product_name}{' '}
                  <span className="text-areia-400" aria-hidden="true">
                    →
                  </span>{' '}
                  {quota.destination}
                </h1>
                <StatusBadge label={quota.lifecycle?.label} tone={quota.lifecycle?.tone} />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-base text-areia-600 dark:text-areia-400">
                <Meta>{quota.operation_label}</Meta>
                <span aria-hidden="true">·</span>
                <Meta>{formatPeriod(quota.starts_on, quota.ends_on)}</Meta>
                <span aria-hidden="true">·</span>
                <Meta>
                  {plural(hours.length, 'horário', 'horários')} (
                  {hours.length > 0 ? `${hours[0]}–${hours[hours.length - 1]}` : '—'})
                </Meta>
                <span aria-hidden="true">·</span>
                <Meta>
                  {quota.is_restricted
                    ? plural(quota.audience_count, 'cliente selecionado', 'clientes selecionados')
                    : 'Todos os clientes'}
                </Meta>
              </p>
            </div>

            <div className="flex flex-col gap-2 lg:items-end">
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button
                  variant="soft"
                  onClick={notify}
                  disabled={!canNotify}
                  loading={busy === 'notify'}
                >
                  Avisar clientes no WhatsApp
                </Button>
                {isCompanyAdmin && (
                  <Link href={route('admin.quotas.edit', quota.id)}>
                    <Button variant="secondary">Editar</Button>
                  </Link>
                )}
                {quota.status === 'published' && (
                  <Button variant="danger-subtle" onClick={close} loading={busy === 'close'}>
                    Encerrar
                  </Button>
                )}
                {quota.status === 'closed' && (
                  <Button variant="secondary" onClick={reopen} loading={busy === 'reopen'}>
                    Reabrir
                  </Button>
                )}
              </div>
              {quota.notified_at && (
                <p className="text-[13px] text-areia-600 dark:text-areia-400">
                  Último aviso: {formatDateTime(quota.notified_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Uso */}
        <Panel>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-[56px] font-bold leading-none tracking-[-0.02em] tabular-nums text-pinho-700 dark:text-pinho-300">
                  {usage.available ?? 0}
                </span>
                <span className="text-lg text-areia-700 dark:text-areia-300">
                  {(usage.available ?? 0) === 1 ? 'disponível' : 'disponíveis'} de{' '}
                  <span className="font-semibold tabular-nums">{usage.total ?? 0}</span>
                </span>
              </div>
            </div>
            <QuotaUsageBar usage={usage} showLegend className="mt-5" />
            <StatStrip
              className="mt-5 !shadow-none sm:grid-cols-3 lg:grid-flow-row lg:grid-cols-3"
              items={[
                { label: 'Não compareceram', tone: 'danger', value: usage.no_show ?? 0 },
                { label: 'Canceladas', tone: 'neutral', value: usage.cancelled ?? 0 },
                { label: 'Não utilizadas', tone: 'warning', value: usage.expired ?? 0 },
              ]}
            />
          </div>
          {(quota.rules ||
            documentsRequired.length > 0 ||
            quota.expected_weight_kg ||
            quota.max_per_client) && (
            <dl className="grid gap-x-8 gap-y-3 border-t border-areia-200 bg-areia-50/60 px-5 py-4 text-[15px] dark:border-areia-800 dark:bg-areia-950/30 sm:grid-cols-2 sm:px-7">
              {documentsRequired.length > 0 && (
                <div>
                  <dt className="text-[13px] font-semibold text-areia-600 dark:text-areia-400">
                    Documentos exigidos
                  </dt>
                  <dd className="text-areia-800 dark:text-areia-200">
                    {documentsRequired.join(' e ')}
                  </dd>
                </div>
              )}
              {(quota.expected_weight_kg || quota.max_per_client) && (
                <div>
                  <dt className="text-[13px] font-semibold text-areia-600 dark:text-areia-400">
                    Por carga
                  </dt>
                  <dd className="text-areia-800 dark:text-areia-200">
                    {[
                      quota.expected_weight_kg
                        ? `${formatTons(quota.expected_weight_kg)} esperadas`
                        : null,
                      quota.max_per_client
                        ? `máx. ${plural(quota.max_per_client, 'carga', 'cargas')} por cliente`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </dd>
                </div>
              )}
              {quota.rules && (
                <div className="sm:col-span-2">
                  <dt className="text-[13px] font-semibold text-areia-600 dark:text-areia-400">
                    Regras
                  </dt>
                  <dd className="whitespace-pre-line text-areia-800 dark:text-areia-200">
                    {quota.rules}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Panel>

        {/* Quem reservou */}
        <section>
          <SectionHeading
            title="Quem reservou"
            aside={plural(clients.length, 'cliente', 'clientes')}
          />
          <Panel>
            {clients.length === 0 ? (
              <EmptyState
                title="Ninguém reservou ainda"
                description="Avise os clientes no WhatsApp para começarem a agendar."
                className="py-10"
              />
            ) : (
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {clients.map((client) => (
                  <li key={client.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
                    <IconTile tone="brand" size="md">
                      {(client.name ?? '?').charAt(0).toUpperCase()}
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-white">
                        {client.name}
                      </p>
                      <p className="text-[13px] text-areia-600 dark:text-areia-400">
                        Saldo alocado:{' '}
                        <span className="font-semibold tabular-nums text-areia-800 dark:text-areia-200">
                          {client.allocated === null || client.allocated === undefined
                            ? 'Livre'
                            : client.allocated}
                        </span>
                        <span className="mx-1.5">·</span>
                        Usadas:{' '}
                        <span className="font-semibold tabular-nums text-areia-800 dark:text-areia-200">
                          {client.used}
                        </span>
                      </p>
                    </div>
                    <StatusBadge
                      label={client.has_whatsapp ? 'WhatsApp: sim' : 'WhatsApp: não'}
                      tone={client.has_whatsapp ? 'success' : 'warning'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        {/* Ocupação */}
        <section>
          <SectionHeading title="Ocupação por horário" />
          <OccupancyGrid grid={grid} />
        </section>

        {/* Agendamentos */}
        <section>
          <SectionHeading
            title="Agendamentos"
            aside={plural(bookings.length, 'agendamento', 'agendamentos')}
          />
          {bookings.length > 0 && (
            <div
              className="mb-3 flex max-w-full overflow-x-auto"
              role="group"
              aria-label="Filtrar agendamentos"
            >
              <div className="inline-flex gap-1 rounded-xl bg-areia-200/60 p-1 dark:bg-areia-800/60">
                {BOOKING_FILTERS.map((filter) => {
                  const active = filter.key === bookingFilter;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setBookingFilter(filter.key)}
                      className={[
                        'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                        active
                          ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-700 dark:text-white'
                          : 'text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-white',
                      ].join(' ')}
                    >
                      {filter.label}{' '}
                      <span className="tabular-nums text-areia-500 dark:text-areia-400">
                        {counts[filter.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Panel>
            {bookings.length === 0 ? (
              <EmptyState
                title="Nenhum agendamento"
                description={`Os agendamentos feitos pelos clientes em ${formatShortDate(quota.starts_on)} a ${formatShortDate(quota.ends_on)} aparecem aqui.`}
                className="py-10"
              />
            ) : visibleBookings.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-areia-600 dark:text-areia-400">
                Nenhum agendamento nesta situação.
              </p>
            ) : (
              <>
                <div className="hidden grid-cols-[110px_130px_minmax(0,1.6fr)_minmax(0,1.2fr)_90px_70px_70px_auto] gap-x-5 border-b border-areia-200 bg-areia-50 px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-areia-500 dark:border-areia-800 dark:bg-areia-950/40 dark:text-areia-400 md:grid">
                  <span>Código</span>
                  <span>Horário</span>
                  <span>Cliente</span>
                  <span>Veículo</span>
                  <span>NF</span>
                  <span>Peso</span>
                  <span>Docs</span>
                  <span className="justify-self-end">Etapa</span>
                </div>
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {visibleBookings.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
