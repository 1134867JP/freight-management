import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import FlashMessages from '@/Components/UI/FlashMessages';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function punctualityBadge(freight) {
  if (!freight.arrived_at || !freight.timeslot) return null;
  const arrived = new Date(freight.arrived_at);
  const scheduled = new Date(freight.timeslot.start_time);
  const diffMin = Math.round((arrived - scheduled) / 60000);

  if (diffMin <= 0) {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Pontual</span>;
  }
  if (diffMin <= 30) {
    return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">+{diffMin}min</span>;
  }
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">Atrasado +{diffMin}min</span>;
}

function OperationBadge({ type }) {
  if (type === 'load') {
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">↑ Carga</span>;
  }
  return <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">↓ Descarga</span>;
}

function StatusBadge({ status, label }) {
  const map = {
    reserved:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    arrived:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    loading:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    unloading: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

function SectionTitle({ title, count, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return (
    <div className="flex items-center gap-2 py-2">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colors[color]}`}>{count}</span>
    </div>
  );
}

function FreightRow({ freight, actions }) {
  const [loading, setLoading] = useState(false);

  const handleAction = (routeName) => {
    if (loading) return;
    setLoading(true);
    router.patch(route(routeName, { freight: freight.id }), {}, {
      preserveScroll: true,
      onFinish: () => setLoading(false),
    });
  };

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-3 pl-4 pr-2">
        <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
      </td>
      <td className="px-2 py-3 text-sm text-gray-700 dark:text-gray-300">
        {freight.user?.name ?? '—'}
      </td>
      <td className="px-2 py-3">
        <OperationBadge type={freight.operation_type} />
      </td>
      <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
        {freight.timeslot ? formatTime(freight.timeslot.start_time) : '—'}
      </td>
      <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
        {freight.arrived_at ? formatDateTime(freight.arrived_at) : '—'}
      </td>
      <td className="px-2 py-3">
        {freight.arrived_at ? punctualityBadge(freight) : null}
      </td>
      <td className="px-2 py-3">
        <StatusBadge status={freight.status} label={freight.status_label ?? freight.status} />
      </td>
      <td className="py-3 pl-2 pr-4 text-right">
        <div className="flex justify-end gap-2">
          {actions.includes('checkin') && (
            <button
              onClick={() => handleAction('freights.gate-checkin')}
              disabled={loading}
              className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Check-in
            </button>
          )}
          {actions.includes('checkout') && (
            <button
              onClick={() => handleAction('freights.gate-checkout')}
              disabled={loading || !!freight.departed_at}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {freight.departed_at ? 'Saiu' : 'Check-out'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function FreightTable({ freights, actions, emptyText }) {
  if (freights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <tr>
            <th className="py-2.5 pl-4 pr-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Veículo</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Cliente</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Op.</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Agendado</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Chegada</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Pontualidade</th>
            <th className="px-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
            <th className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Ação</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900">
          {freights.map((f) => (
            <FreightRow key={f.id} freight={f} actions={actions} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GateIndex({ expected, waiting, inProgress, completedToday }) {
  return (
    <AuthenticatedLayout
      header={<PageHeader title="Controle de Portaria" subtitle="Gerenciamento de chegadas e saídas do pátio" />}
    >
      <Head title="Portaria" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Esperados hoje', value: expected.length, color: 'border-gray-300 dark:border-gray-600' },
              { label: 'Aguardando na fila', value: waiting.length, color: 'border-yellow-400 dark:border-yellow-600' },
              { label: 'Em operação', value: inProgress.length, color: 'border-blue-400 dark:border-blue-600' },
              { label: 'Concluídos hoje', value: completedToday.length, color: 'border-green-400 dark:border-green-600' },
            ].map((c) => (
              <div key={c.label} className={`rounded-xl border-l-4 bg-white p-4 shadow-sm dark:bg-gray-800 ${c.color}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Waiting queue */}
          <div>
            <SectionTitle title="Fila de espera — no pátio" count={waiting.length} color="yellow" />
            <FreightTable
              freights={waiting}
              actions={['checkout']}
              emptyText="Nenhum veículo aguardando no pátio."
            />
          </div>

          {/* Expected today */}
          <div>
            <SectionTitle title="Esperados hoje (ainda não chegaram)" count={expected.length} color="gray" />
            <FreightTable
              freights={expected}
              actions={['checkin']}
              emptyText="Nenhuma reserva esperada para hoje com status pendente."
            />
          </div>

          {/* In progress */}
          <div>
            <SectionTitle title="Em operação" count={inProgress.length} color="blue" />
            <FreightTable
              freights={inProgress}
              actions={[]}
              emptyText="Nenhuma operação em andamento."
            />
          </div>

          {/* Completed today */}
          <div>
            <SectionTitle title="Concluídos hoje" count={completedToday.length} color="green" />
            <FreightTable
              freights={completedToday}
              actions={['checkout']}
              emptyText="Nenhuma operação concluída hoje ainda."
            />
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
