import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import EmptyState from '@/Components/UI/EmptyState';
import PageHeader from '@/Components/UI/PageHeader';
import Pagination from '@/Components/UI/Pagination';
import StatusBadge from '@/Components/UI/StatusBadge';
import TableShell from '@/Components/UI/TableShell';
import { translateOperationType } from '@/Features/Freight/utils/freightPresentation';
import { formatDateTime, formatWeight } from '@/utils/formatters';
import { FREIGHT_STATUS_CONFIG, getStatusPresentation } from '@/utils/statusPresentation';
import { Head, router } from '@inertiajs/react';

export default function ClientReservationsReport({ freights, filters }) {
  const { data: items, current_page, last_page, links } = freights;

  const [form, setForm] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    operation_type: filters.operation_type || '',
    status: filters.status || '',
  });

  const applyFilters = (e) => {
    e.preventDefault();
    router.get(route('reports.client.reservations'), form, { preserveScroll: true });
  };

  const clearFilters = () => {
    const empty = { date_from: '', date_to: '', operation_type: '', status: '' };
    setForm(empty);
    router.get(route('reports.client.reservations'), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Meus Fretes" subtitle="Histórico de fretes reservados" />}
    >
      <Head title="Relatório de Reservas" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">

          {/* Filtros */}
          <form
            onSubmit={applyFilters}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  {Object.entries(FREIGHT_STATUS_CONFIG).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="submit" size="sm">
                Filtrar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </form>

          {/* Resumo */}
          {items.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {freights.total} frete{freights.total !== 1 ? 's' : ''} encontrado{freights.total !== 1 ? 's' : ''}
            </p>
          )}

          {/* Tabela */}
          <TableShell>
            {items.length === 0 ? (
              <EmptyState title="Nenhum frete encontrado." />
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-semibold">Horário</th>
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
                        {formatDateTime(fr.timeslot?.start_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {fr.driver_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300 uppercase">
                        {fr.truck_plate || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {translateOperationType(fr.operation_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {fr.cargo_description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatWeight(fr.gross_weight)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatWeight(fr.net_weight)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge {...getStatusPresentation('freight', fr.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableShell>

          {/* Paginação */}
          <Pagination links={links} currentPage={current_page} lastPage={last_page} />

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
