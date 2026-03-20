import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, router } from '@inertiajs/react';

const STATUS_LABELS = {
  reserved: { label: 'Reservado', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  loading: { label: 'Carregando', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  unloading: { label: 'Descarregando', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  completed: { label: 'Concluído', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const OP_LABELS = { load: 'Carga', unload: 'Descarga' };

function StatusBadge({ status }) {
  const normalised = status || 'reserved';
  const cfg = STATUS_LABELS[normalised] || { label: normalised, class: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

export default function AdminFreightsReport({ freights, filters }) {
  const { data: items, current_page, last_page, links } = freights;

  const [form, setForm] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    operation_type: filters.operation_type || '',
    status: filters.status || '',
    search: filters.search || '',
  });

  const applyFilters = (e) => {
    e.preventDefault();
    router.get(route('reports.admin.freights'), form, { preserveScroll: true });
  };

  const clearFilters = () => {
    const empty = { date_from: '', date_to: '', operation_type: '', status: '', search: '' };
    setForm(empty);
    router.get(route('reports.admin.freights'), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Relatório de Fretes" subtitle="Fretes reservados no sistema" />}
    >
      <Head title="Relatório de Fretes" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">

          {/* Filtros */}
          <form
            onSubmit={applyFilters}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">De (horário)</label>
                <input
                  type="date"
                  value={form.date_from}
                  onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Até (horário)</label>
                <input
                  type="date"
                  value={form.date_to}
                  onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Operação</label>
                <select
                  value={form.operation_type}
                  onChange={(e) => setForm({ ...form, operation_type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  <option value="load">Carga</option>
                  <option value="unload">Descarga</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="reserved">Reservado</option>
                  <option value="loading">Carregando</option>
                  <option value="unloading">Descarregando</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Buscar</label>
                <input
                  type="text"
                  value={form.search}
                  onChange={(e) => setForm({ ...form, search: e.target.value })}
                  placeholder="Cliente, motorista, placa..."
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Limpar
              </button>
            </div>
          </form>

          {/* Resumo */}
          {items.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {freights.total} frete{freights.total !== 1 ? 's' : ''} encontrado{freights.total !== 1 ? 's' : ''}
            </p>
          )}

          {/* Tabela */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {items.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Nenhum frete encontrado." />
              </div>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-semibold">Horário</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Motorista</th>
                    <th className="px-4 py-3 font-semibold">Placa</th>
                    <th className="px-4 py-3 font-semibold">Operação</th>
                    <th className="px-4 py-3 font-semibold">Tipo de carga</th>
                    <th className="px-4 py-3 font-semibold">Peso bruto</th>
                    <th className="px-4 py-3 font-semibold">Peso líquido</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((fr) => (
                    <tr key={fr.id} className="align-top hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {fr.timeslot
                          ? new Date(fr.timeslot.start_time).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {fr.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {fr.driver_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300 uppercase">
                        {fr.truck_plate || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {OP_LABELS[fr.operation_type] || fr.operation_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {fr.cargo_description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {fr.gross_weight ? `${Number(fr.gross_weight).toLocaleString('pt-BR')} kg` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {fr.net_weight ? `${Number(fr.net_weight).toLocaleString('pt-BR')} kg` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={fr.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginação */}
          {last_page > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Página {current_page} de {last_page}</span>
              <div className="flex gap-1">
                {links.map((link, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      link.active
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
