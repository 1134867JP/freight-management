import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, router, usePage } from '@inertiajs/react';

const ACTION_LABELS = {
  created: { label: 'Inserção', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  updated: { label: 'Atualização', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  deleted: { label: 'Exclusão', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const MODEL_LABELS = {
  Freight: 'Frete',
  Timeslot: 'Horário',
  User: 'Usuário',
  Truck: 'Caminhão',
  DropoffAddress: 'Endereço',
};

function ActionBadge({ action }) {
  const cfg = ACTION_LABELS[action] || { label: action, class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

function DiffCell({ old: oldVal, new: newVal }) {
  if (!oldVal && !newVal) return <span className="text-gray-400 dark:text-gray-600">—</span>;

  const allKeys = Array.from(new Set([
    ...Object.keys(oldVal || {}),
    ...Object.keys(newVal || {}),
  ]));

  return (
    <div className="space-y-0.5 text-xs">
      {allKeys.map((key) => {
        const prev = oldVal?.[key];
        const next = newVal?.[key];
        const changed = prev !== next;
        return (
          <div key={key} className="flex flex-wrap gap-1">
            <span className="font-medium text-gray-500 dark:text-gray-400">{key}:</span>
            {prev !== undefined && (
              <span className={changed ? 'text-red-600 dark:text-red-400 line-through' : 'text-gray-700 dark:text-gray-300'}>
                {String(prev ?? '')}
              </span>
            )}
            {changed && next !== undefined && (
              <span className="text-green-700 dark:text-green-400">
                {String(next ?? '')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditLogs({ logs, filters }) {
  const { data: items, current_page, last_page, links } = logs;

  const [form, setForm] = useState({
    action: filters.action || '',
    model_type: filters.model_type || '',
    user_name: filters.user_name || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  const applyFilters = (e) => {
    e.preventDefault();
    router.get(route('audit-logs.index'), form, { preserveScroll: true });
  };

  const clearFilters = () => {
    const empty = { action: '', model_type: '', user_name: '', date_from: '', date_to: '' };
    setForm(empty);
    router.get(route('audit-logs.index'), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Logs de Alterações" subtitle="Histórico de inserções, atualizações e exclusões" />}
    >
      <Head title="Logs de Alterações" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">

          {/* Filtros */}
          <form
            onSubmit={applyFilters}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Ação</label>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  <option value="created">Inserção</option>
                  <option value="updated">Atualização</option>
                  <option value="deleted">Exclusão</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Entidade</label>
                <select
                  value={form.model_type}
                  onChange={(e) => setForm({ ...form, model_type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  {Object.entries(MODEL_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Usuário</label>
                <input
                  type="text"
                  value={form.user_name}
                  onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                  placeholder="Nome..."
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">De</label>
                <input
                  type="date"
                  value={form.date_from}
                  onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Até</label>
                <input
                  type="date"
                  value={form.date_to}
                  onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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

          {/* Tabela */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {items.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Nenhum log encontrado." />
              </div>
            ) : (
              <table className="min-w-full table-fixed text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="w-[14%] px-4 py-3 font-semibold">Data/Hora</th>
                    <th className="w-[14%] px-4 py-3 font-semibold">Usuário</th>
                    <th className="w-[10%] px-4 py-3 font-semibold">Ação</th>
                    <th className="w-[10%] px-4 py-3 font-semibold">Entidade</th>
                    <th className="w-[6%] px-4 py-3 font-semibold">ID</th>
                    <th className="w-[46%] px-4 py-3 font-semibold">Alterações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.user_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {MODEL_LABELS[log.model_type] || log.model_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        #{log.model_id}
                      </td>
                      <td className="px-4 py-3">
                        <DiffCell old={log.old_values} new={log.new_values} />
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
