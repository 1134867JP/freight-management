import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import EmptyState from '@/Components/UI/EmptyState';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
import IconTile from '@/Components/UI/IconTile';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, Link, router } from '@inertiajs/react';
import { formatSchedule, formatTons } from '@/Features/Quota/format';
import { formatPlate } from '@/utils/formatters';

const TABS = [
  { key: 'today', label: 'Hoje' },
  { key: 'late', label: 'Atrasados' },
  { key: 'documents', label: 'Documentação pendente' },
  { key: 'unresolved', label: 'Sem baixa' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'all', label: 'Todos' },
];

const EMPTY = {
  today: ['Nenhum agendamento para hoje', 'Quando houver reservas para hoje, elas aparecem aqui.'],
  late: [
    'Nenhum veículo atrasado',
    'Todos os veículos de hoje chegaram ou ainda estão dentro da tolerância.',
  ],
  documents: [
    'Nenhuma documentação pendente',
    'Todos os agendamentos em aberto estão com os documentos em dia.',
  ],
  unresolved: [
    'Nada sem baixa',
    'Todos os agendamentos de dias anteriores já têm o registro de chegada ou de não comparecimento.',
  ],
  upcoming: ['Nenhum agendamento futuro', 'Reservas de dias seguintes aparecem aqui.'],
  all: [
    'Nenhum agendamento encontrado',
    'Quando os clientes reservarem cotas, os agendamentos aparecem aqui.',
  ],
};

function docsClass(booking) {
  return booking.documents_received < booking.documents_required
    ? 'font-semibold text-ocre-700 dark:text-ocre-300'
    : 'text-areia-700 dark:text-areia-300';
}

function DocsProgress({ booking }) {
  const required = Number(booking.documents_required ?? 0);
  const received = Number(booking.documents_received ?? 0);
  const dots = Math.min(required, 6);
  const pending = received < required;

  return (
    <span className={`inline-flex items-center gap-2 tabular-nums ${docsClass(booking)}`}>
      {booking.documents_received}/{booking.documents_required}
      {dots > 0 && (
        <span className="inline-flex gap-0.5" aria-hidden="true">
          {Array.from({ length: dots }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${
                index < received
                  ? 'bg-pinho-600 dark:bg-pinho-300'
                  : pending
                    ? 'bg-ocre-300 dark:bg-ocre-700'
                    : 'bg-areia-300 dark:bg-areia-600'
              }`}
            />
          ))}
        </span>
      )}
    </span>
  );
}

function Plate({ plate }) {
  return <span className="plate text-[12px]">{formatPlate(plate)}</span>;
}

function Vehicle({ vehicle }) {
  if (!vehicle?.plate && !vehicle?.driver_name) {
    return <span className="font-medium text-ocre-700 dark:text-ocre-300">A informar</span>;
  }
  return (
    <>
      {vehicle.plate ? (
        <Plate plate={vehicle.plate} />
      ) : (
        <span className="font-medium text-ocre-700 dark:text-ocre-300">Placa a informar</span>
      )}
      {vehicle.driver_name && (
        <span className="mt-1 block text-[13px] text-areia-600 dark:text-areia-400">
          {vehicle.driver_name}
        </span>
      )}
    </>
  );
}

function quotaLine(booking) {
  const code = booking.quota?.code;
  const route_ = `${booking.product_name ?? ''} → ${booking.destination ?? ''}`;
  return code ? `${code} · ${route_}` : route_;
}

export default function BookingsIndex({
  filter = 'today',
  search = '',
  bookings = [],
  counts = {},
}) {
  const confirm = useConfirm();
  const [query, setQuery] = useState(search);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const firstRender = useRef(true);

  const canSelect = filter === 'unresolved';

  useEffect(() => {
    setSelected([]);
  }, [filter, bookings]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (query.trim() === search) return undefined;
    const timer = setTimeout(() => {
      router.get(
        route('admin.bookings.index'),
        { filter, search: query.trim() || undefined },
        { preserveState: true, preserveScroll: true, replace: true },
      );
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const goToFilter = (key) => {
    router.get(
      route('admin.bookings.index'),
      { filter: key, search: query.trim() || undefined },
      { preserveState: true, preserveScroll: true },
    );
  };

  const allSelected = bookings.length > 0 && selected.length === bookings.length;
  const toggleAll = () => setSelected(allSelected ? [] : bookings.map((b) => b.id));
  const toggleOne = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const bulkNoShow = async () => {
    if (selected.length === 0) return;
    const ok = await confirm(
      `Registrar não comparecimento de ${selected.length} ${selected.length === 1 ? 'agendamento' : 'agendamentos'}? A cota volta ao saldo e não é possível desfazer.`,
      'Registrar não comparecimento',
    );
    if (!ok) return;
    router.post(
      route('admin.bookings.bulk-no-show'),
      { ids: selected },
      {
        preserveScroll: true,
        onStart: () => setSaving(true),
        onFinish: () => setSaving(false),
      },
    );
  };

  const [emptyTitle, emptyDescription] = EMPTY[filter] ?? EMPTY.all;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <AuthenticatedLayout>
      <Head title="Agendamentos" />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <PageHeader
          title="Agendamentos"
          subtitle="Quem reservou, quando, qual veículo, NF, peso e status."
        />

        <div className="space-y-3">
          <div
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Filtros de agendamentos"
          >
            <div className="inline-flex min-w-max gap-1 rounded-xl bg-areia-200/60 p-1 dark:bg-areia-800/60">
              {TABS.map((tab) => {
                const active = tab.key === filter;
                const attention =
                  !active &&
                  ['late', 'documents', 'unresolved'].includes(tab.key) &&
                  counts[tab.key] > 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goToFilter(tab.key)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400 ${
                      active
                        ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-700 dark:text-white'
                        : 'text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-areia-100'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${
                        active
                          ? 'bg-pinho-100 text-pinho-800 dark:bg-pinho-900/60 dark:text-pinho-200'
                          : attention
                            ? 'bg-ocre-100 text-ocre-800 dark:bg-ocre-900/50 dark:text-ocre-200'
                            : 'bg-areia-200/70 text-areia-600 dark:bg-areia-800 dark:text-areia-300'
                      }`}
                    >
                      {counts[tab.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative max-w-xl">
            <label htmlFor="booking-search" className="sr-only">
              Buscar agendamentos
            </label>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-areia-500 dark:text-areia-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="booking-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código, cliente, placa, NF, motorista ou cota"
              className={`block w-full ${FormField.inputClass(null, 'pl-10')}`}
            />
          </div>
        </div>

        {canSelect && (
          <div className="flex flex-col gap-3 rounded-2xl border border-areia-200 bg-areia-50 p-4 dark:border-areia-800 dark:bg-areia-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">
              Agendamentos de dias anteriores sem registro de chegada. Confirme quem não compareceu
              para devolver a cota ao saldo.
            </p>
            <Button
              variant="danger-subtle"
              onClick={bulkNoShow}
              disabled={selected.length === 0}
              loading={saving}
            >
              Registrar não comparecimento{selected.length > 0 ? ` (${selected.length})` : ''}
            </Button>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="glass rounded-2xl">
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
                  <rect x="4" y="5" width="16" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              }
              title={search ? 'Nenhum resultado para a busca' : emptyTitle}
              description={
                search
                  ? 'Tente outro código, cliente, placa, NF ou motorista, ou mude de aba.'
                  : emptyDescription
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="glass hidden overflow-x-auto rounded-2xl md:block">
              <table className="min-w-full text-left text-[15px]">
                <thead className="border-b border-areia-200 bg-areia-50 text-[13px] font-semibold uppercase tracking-wide text-areia-600 dark:border-areia-800 dark:bg-areia-950/40 dark:text-areia-400">
                  <tr>
                    {canSelect && (
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Selecionar todos"
                          className="h-5 w-5 rounded border-areia-400 text-pinho-700 focus:ring-ocre-400"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Data/hora</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Cota</th>
                    <th className="px-4 py-3">Veículo</th>
                    <th className="px-4 py-3">NF</th>
                    <th className="px-4 py-3 text-right">Peso</th>
                    <th className="px-4 py-3">Docs</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-areia-200 dark:divide-areia-800">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => router.visit(route('admin.bookings.show', booking.id))}
                      className="cursor-pointer align-top transition hover:bg-white/50 dark:hover:bg-areia-800/60"
                    >
                      {canSelect && (
                        <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedSet.has(booking.id)}
                            onChange={() => toggleOne(booking.id)}
                            aria-label={`Selecionar ${booking.code}`}
                            className="h-5 w-5 rounded border-areia-400 text-pinho-700 focus:ring-ocre-400"
                          />
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Link
                          href={route('admin.bookings.show', booking.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="font-mono font-semibold text-pinho-800 hover:underline dark:text-pinho-300"
                        >
                          {booking.code}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-areia-800 dark:text-areia-200">
                        {formatSchedule(booking.scheduled_at)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-areia-900 dark:text-areia-100">
                        {booking.client?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-areia-700 dark:text-areia-300">
                        {quotaLine(booking)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Vehicle vehicle={booking.vehicle} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-areia-700 dark:text-areia-300">
                        {booking.invoice_number || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-areia-700 dark:text-areia-300">
                        {formatTons(booking.weight)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <DocsProgress booking={booking} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="glass divide-y divide-areia-200 overflow-hidden rounded-2xl dark:divide-areia-800 md:hidden">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <div className="flex items-start">
                    {canSelect && (
                      <label className="flex min-h-11 min-w-11 items-center justify-center pl-3 pt-3">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(booking.id)}
                          onChange={() => toggleOne(booking.id)}
                          aria-label={`Selecionar ${booking.code}`}
                          className="h-5 w-5 rounded border-areia-400 text-pinho-700 focus:ring-ocre-400"
                        />
                      </label>
                    )}
                    <Link
                      href={route('admin.bookings.show', booking.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 p-4 transition hover:bg-white/50 dark:hover:bg-areia-800/50"
                    >
                      <IconTile
                        tone={
                          booking.stage?.tone === 'neutral' || !booking.stage?.tone
                            ? 'brand'
                            : booking.stage.tone
                        }
                        size="md"
                      >
                        {(booking.client?.name ?? '?').charAt(0).toUpperCase()}
                      </IconTile>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                              {booking.client?.name ?? '—'}
                            </p>
                            <p className="text-[13px] text-areia-600 dark:text-areia-400">
                              <span className="font-mono font-semibold text-pinho-800 dark:text-pinho-300">
                                {booking.code}
                              </span>
                              {' · '}
                              <span className="tabular-nums">
                                {formatSchedule(booking.scheduled_at)}
                              </span>
                            </p>
                          </div>
                          <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
                        </div>
                        <p className="text-sm text-areia-600 dark:text-areia-400">
                          {quotaLine(booking)}
                        </p>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 text-sm">
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-600 dark:text-areia-400">
                              Veículo
                            </dt>
                            <dd>
                              <Vehicle vehicle={booking.vehicle} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-600 dark:text-areia-400">
                              NF
                            </dt>
                            <dd className="tabular-nums text-areia-800 dark:text-areia-200">
                              {booking.invoice_number || '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-600 dark:text-areia-400">
                              Peso
                            </dt>
                            <dd className="tabular-nums text-areia-800 dark:text-areia-200">
                              {formatTons(booking.weight)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-600 dark:text-areia-400">
                              Docs
                            </dt>
                            <dd>
                              <DocsProgress booking={booking} />
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
