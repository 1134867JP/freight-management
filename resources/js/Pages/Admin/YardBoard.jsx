import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const STATUS_CONFIG = {
  arrived: {
    label: 'No Pátio',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-800 dark:text-yellow-300',
    dot: 'bg-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-700',
  },
  loading: {
    label: 'Carregando',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-800 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-300 dark:border-blue-700',
  },
  unloading: {
    label: 'Descarregando',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-800 dark:text-violet-300',
    dot: 'bg-violet-500',
    border: 'border-violet-300 dark:border-violet-700',
  },
};

function elapsed(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FreightCard({ freight }) {
  const cfg = STATUS_CONFIG[freight.status] ?? {};
  const sinceArrived = elapsed(freight.arrived_at);
  const sinceUpdated = elapsed(freight.updated_at);

  return (
    <div className={`rounded-lg border p-3 ${cfg.border ?? 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-bold text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
        </div>
        <StatusBadge status={freight.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span>{freight.operation_type === 'load' ? '↑ Carga' : '↓ Descarga'}</span>
        {freight.client_name && <span className="truncate">{freight.client_name}</span>}
        {sinceArrived && <span>Pátio: {sinceArrived}</span>}
        {freight.status !== 'arrived' && sinceUpdated && <span>Op: {sinceUpdated}</span>}
      </div>
    </div>
  );
}

function DocaCard({ doca }) {
  const isEmpty = doca.freights.length === 0;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isEmpty
        ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
        : 'border-teal-300 bg-white shadow-sm dark:border-teal-700 dark:bg-gray-800'
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{doca.nome}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isEmpty
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
        }`}>
          {isEmpty ? 'Livre' : `${doca.freights.length} ativo`}
        </span>
      </div>
      {isEmpty ? (
        <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">Disponível</p>
        </div>
      ) : (
        <div className="space-y-2">
          {doca.freights.map((f) => (
            <FreightCard key={f.id} freight={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueSection({ queue }) {
  if (queue.length === 0) return null;

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
          {queue.length}
        </span>
        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Fila de espera — sem doca atribuída</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {queue.map((f) => (
          <FreightCard key={f.id} freight={f} />
        ))}
      </div>
    </div>
  );
}

export default function YardBoard({ initialData }) {
  const [data, setData] = useState(initialData);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(route('admin.yard-board.data'), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch (_) {
      // silently ignore network errors between polls
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(fetchData, 10_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const totalActive = (data?.docas ?? []).reduce((sum, d) => sum + d.freights.length, 0)
    + (data?.waitingQueue ?? []).length;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Painel do Pátio"
          subtitle="Status ao vivo das docas — atualização a cada 10s"
        />
      }
    >
      <Head title="Painel do Pátio" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

          {/* Header bar */}
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {refreshing ? 'Atualizando...' : 'Ao vivo'}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                {totalActive} ativo{totalActive !== 1 ? 's' : ''}
              </span>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Atualizar agora
              </button>
            </div>
          </div>

          {/* Waiting queue */}
          {data?.waitingQueue?.length > 0 && (
            <QueueSection queue={data.waitingQueue} />
          )}

          {/* Doca grid */}
          {data?.docas?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma doca ativa cadastrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data?.docas ?? []).map((doca) => (
                <DocaCard key={doca.id} doca={doca} />
              ))}
            </div>
          )}

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
