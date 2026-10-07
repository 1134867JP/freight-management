import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import EmptyState from '@/Components/UI/EmptyState';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
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
  late: ['Nenhum veículo atrasado', 'Todos os veículos de hoje chegaram ou ainda estão dentro da tolerância.'],
  documents: ['Nenhuma documentação pendente', 'Todos os agendamentos em aberto estão com os documentos em dia.'],
  unresolved: ['Nada sem baixa', 'Todos os agendamentos de dias anteriores já têm o registro de chegada ou de não comparecimento.'],
  upcoming: ['Nenhum agendamento futuro', 'Reservas de dias seguintes aparecem aqui.'],
  all: ['Nenhum agendamento encontrado', 'Quando os clientes reservarem cotas, os agendamentos aparecem aqui.'],
};

function docsClass(booking) {
  return booking.documents_received < booking.documents_required
    ? 'font-semibold text-ocre-700 dark:text-ocre-300'
    : 'text-areia-700 dark:text-areia-300';
}

function Vehicle({ vehicle }) {
  if (!vehicle?.plate && !vehicle?.driver_name) {
    return <span className="font-medium text-ocre-700 dark:text-ocre-300">A informar</span>;
  }
  return (
    <>
      <span className="font-semibold text-areia-900 dark:text-areia-100">
        {vehicle.plate ? formatPlate(vehicle.plate) : <span className="text-ocre-700 dark:text-ocre-300">Placa a informar</span>}
      </span>
      {vehicle.driver_name && <span className="block text-[13px] text-areia-500 dark:text-areia-400">{vehicle.driver_name}</span>}
    </>
  );
}

function quotaLine(booking) {
  const code = booking.quota?.code;
  const route_ = `${booking.product_name ?? ''} → ${booking.destination ?? ''}`;
  return code ? `${code} · ${route_}` : route_;
}

export default function BookingsIndex({ filter = 'today', search = '', bookings = [], counts = {} }) {
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
      router.get(route('admin.bookings.index'), { filter, search: query.trim() || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const goToFilter = (key) => {
    router.get(route('admin.bookings.index'), { filter: key, search: query.trim() || undefined }, { preserveState: true, preserveScroll: true });
  };

  const allSelected = bookings.length > 0 && selected.length === bookings.length;
  const toggleAll = () => setSelected(allSelected ? [] : bookings.map((b) => b.id));
  const toggleOne = (id) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const bulkNoShow = async () => {
    if (selected.length === 0) return;
    const ok = await confirm(
      `Registrar não comparecimento de ${selected.length} ${selected.length === 1 ? 'agendamento' : 'agendamentos'}? A cota volta ao saldo e não é possível desfazer.`,
      'Registrar não comparecimento',
    );
    if (!ok) return;
    router.post(route('admin.bookings.bulk-no-show'), { ids: selected }, {
      preserveScroll: true,
      onStart: () => setSaving(true),
      onFinish: () => setSaving(false),
    });
  };

  const [emptyTitle, emptyDescription] = EMPTY[filter] ?? EMPTY.all;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <AuthenticatedLayout>
      <Head title="Agendamentos" />
      <div className="py-6">
        <div className="mx-auto max-w-[1600px] space-y-5 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <PageHeader
            title="Agendamentos"
            subtitle="Quem reservou, quando, qual veículo, NF, peso e status."
            eyebrow="Operação"
          />

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filtros de agendamentos">
            <div className="flex min-w-max gap-1 border-b border-areia-200 dark:border-areia-800">
              {TABS.map((tab) => {
                const active = tab.key === filter;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goToFilter(tab.key)}
                    className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3.5 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400 ${
                      active
                        ? 'border-pinho-700 text-pinho-800 dark:border-pinho-300 dark:text-pinho-200'
                        : 'border-transparent text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-areia-100'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${
                        active
                          ? 'bg-pinho-100 text-pinho-800 dark:bg-pinho-900/60 dark:text-pinho-200'
                          : tab.key !== 'all' && counts[tab.key] > 0 && ['late', 'documents', 'unresolved'].includes(tab.key)
                            ? 'bg-ocre-100 text-ocre-800 dark:bg-ocre-900/50 dark:text-ocre-200'
                            : 'bg-areia-100 text-areia-600 dark:bg-areia-800 dark:text-areia-300'
                      }`}
                    >
                      {counts[tab.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-xl">
            <label htmlFor="booking-search" className="sr-only">Buscar agendamentos</label>
            <input
              id="booking-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código, cliente, placa, NF, motorista ou cota"
              className={`block w-full ${FormField.inputClass(null)}`}
            />
          </div>

          {canSelect && (
            <div className="flex flex-col gap-3 rounded-xl border border-areia-200 bg-areia-50 p-4 dark:border-areia-800 dark:bg-areia-900 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">
                Agendamentos de dias anteriores sem registro de chegada. Confirme quem não compareceu para devolver a cota ao saldo.
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
            <div className="rounded-xl border border-areia-200 bg-white dark:border-areia-800 dark:bg-areia-900">
              <EmptyState
                title={search ? 'Nenhum resultado para a busca' : emptyTitle}
                description={search ? 'Tente outro código, cliente, placa, NF ou motorista, ou mude de aba.' : emptyDescription}
              />
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto rounded-xl border border-areia-200 bg-white shadow-sm dark:border-areia-800 dark:bg-areia-900 md:block">
                <table className="min-w-full text-left text-[15px]">
                  <thead className="border-b border-areia-200 bg-areia-50 text-[13px] font-semibold uppercase tracking-wide text-areia-500 dark:border-areia-800 dark:bg-areia-950/40 dark:text-areia-400">
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
                        className="cursor-pointer align-top transition hover:bg-areia-50 dark:hover:bg-areia-800/60"
                      >
                        {canSelect && (
                          <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedSet.has(booking.id)}
                              onChange={() => toggleOne(booking.id)}
                              aria-label={`Selecionar ${booking.code}`}
                              className="h-5 w-5 rounded border-areia-400 text-pinho-700 focus:ring-ocre-400"
                            />
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link
                            href={route('admin.bookings.show', booking.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
                          >
                            {booking.code}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-areia-800 dark:text-areia-200">{formatSchedule(booking.scheduled_at)}</td>
                        <td className="px-4 py-3 font-medium text-areia-900 dark:text-areia-100">{booking.client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-areia-700 dark:text-areia-300">{quotaLine(booking)}</td>
                        <td className="px-4 py-3"><Vehicle vehicle={booking.vehicle} /></td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-areia-700 dark:text-areia-300">{booking.invoice_number || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-areia-700 dark:text-areia-300">{formatTons(booking.weight)}</td>
                        <td className={`whitespace-nowrap px-4 py-3 tabular-nums ${docsClass(booking)}`}>
                          {booking.documents_received}/{booking.documents_required}
                        </td>
                        <td className="px-4 py-3"><StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <ul className="space-y-3 md:hidden">
                {bookings.map((booking) => (
                  <li key={booking.id} className="rounded-xl border border-areia-200 bg-white shadow-sm dark:border-areia-800 dark:bg-areia-900">
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
                      <Link href={route('admin.bookings.show', booking.id)} className="block min-w-0 flex-1 space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[15px] font-bold text-pinho-700 dark:text-pinho-300">{booking.code}</p>
                            <p className="text-sm tabular-nums text-areia-600 dark:text-areia-400">{formatSchedule(booking.scheduled_at)}</p>
                          </div>
                          <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
                        </div>
                        <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">{booking.client?.name ?? '—'}</p>
                        <p className="text-sm text-areia-600 dark:text-areia-400">{quotaLine(booking)}</p>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-500">Veículo</dt>
                            <dd><Vehicle vehicle={booking.vehicle} /></dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-500">NF</dt>
                            <dd className="tabular-nums text-areia-800 dark:text-areia-200">{booking.invoice_number || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-500">Peso</dt>
                            <dd className="tabular-nums text-areia-800 dark:text-areia-200">{formatTons(booking.weight)}</dd>
                          </div>
                          <div>
                            <dt className="text-[12px] uppercase tracking-wide text-areia-500">Docs</dt>
                            <dd className={`tabular-nums ${docsClass(booking)}`}>{booking.documents_received}/{booking.documents_required}</dd>
                          </div>
                        </dl>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
