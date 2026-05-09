import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── helpers ────────────────────────────────────────────────────────────────

function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

function elapsed(isoString, now) {
  if (!isoString) return null;
  const diff = Math.floor((now - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatClock(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

// ─── status config ───────────────────────────────────────────────────────────

const STATUS = {
  arrived: {
    label: 'No Pátio',
    ring: 'ring-amber-400/60',
    border: 'border-amber-400',
    glow: 'shadow-amber-400/20',
    badge: 'bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30',
    dot: 'bg-amber-400',
    icon: '⏳',
    operationRow: 'from-amber-100/50 dark:from-amber-950/30',
  },
  loading: {
    label: 'Carregando',
    ring: 'ring-sky-400/60',
    border: 'border-sky-400',
    glow: 'shadow-sky-400/20',
    badge: 'bg-sky-400/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400/30',
    dot: 'bg-sky-400',
    icon: '↑',
    operationRow: 'from-sky-100/50 dark:from-sky-950/30',
  },
  unloading: {
    label: 'Descarregando',
    ring: 'ring-violet-400/60',
    border: 'border-violet-400',
    glow: 'shadow-violet-400/20',
    badge: 'bg-violet-400/15 text-violet-700 dark:text-violet-300 ring-1 ring-violet-400/30',
    dot: 'bg-violet-400',
    icon: '↓',
    operationRow: 'from-violet-100/50 dark:from-violet-950/30',
  },
};

// ─── sub-components ──────────────────────────────────────────────────────────

function LiveDot({ color = 'bg-emerald-400' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function FreightSlot({ freight, now }) {
  const cfg = STATUS[freight.status] ?? STATUS.arrived;
  const since = elapsed(freight.arrived_at, now);
  const sinceOp = freight.status !== 'arrived' ? elapsed(freight.updated_at, now) : null;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cfg.border} bg-gradient-to-br ${cfg.operationRow} to-transparent p-4 shadow-lg ${cfg.glow}`}>
      {/* pulse bar top */}
      <div className={`absolute top-0 left-0 h-0.5 w-full ${cfg.dot} opacity-70`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-2xl font-black tracking-widest text-gray-900 dark:text-white">{freight.truck_plate}</p>
          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <path d="M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          {freight.operation_type === 'load' ? 'Carga' : 'Descarga'}
        </span>
        {freight.client_name && (
          <span className="truncate text-xs text-gray-500 dark:text-gray-500">{freight.client_name}</span>
        )}
      </div>

      {(since || sinceOp) && (
        <div className="mt-3 flex gap-3 border-t border-gray-200/50 dark:border-white/5 pt-3">
          {since && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-600">No pátio</p>
              <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{since}</p>
            </div>
          )}
          {sinceOp && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-600">Operando</p>
              <p className={`font-mono text-sm font-bold ${freight.status === 'loading' ? 'text-sky-600 dark:text-sky-400' : 'text-violet-600 dark:text-violet-400'}`}>{sinceOp}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocaCard({ doca, now }) {
  const isEmpty = doca.freights.length === 0;

  return (
    <div className={`flex flex-col rounded-2xl border transition-all duration-500 ${
      isEmpty
        ? 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50'
        : 'border-gray-300 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900'
    }`}>
      {/* dock header */}
      <div className={`flex items-center justify-between rounded-t-2xl px-4 py-3 ${
        isEmpty
          ? 'bg-gray-100/40 dark:bg-gray-800/40'
          : 'bg-gray-100/70 dark:bg-gray-800/70'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            isEmpty
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              : 'bg-teal-600 text-white'
          }`}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M2 20V9l10-6 10 6v11H2ZM9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{doca.nome}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          isEmpty
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {isEmpty ? 'Livre' : `${doca.freights.length} ativo`}
        </span>
      </div>

      {/* dock body */}
      <div className="flex-1 p-3">
        {isEmpty ? (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <svg className="h-8 w-8 text-gray-300 dark:text-gray-700" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-700">Disponível</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {doca.freights.map((f) => (
              <FreightSlot key={f.id} freight={f} now={now} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({ freight, now }) {
  const since = elapsed(freight.arrived_at, now);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-300/40 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/50 bg-amber-100/30 dark:border-amber-800/50 dark:bg-amber-900/30">
        <span className="text-lg">⏳</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-base font-black tracking-wider text-gray-900 dark:text-white">{freight.truck_plate}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-500">{freight.driver_name} · {freight.client_name}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-600">Aguardando</p>
        {since && <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{since}</p>}
      </div>
      <div className={`rounded-lg px-2 py-1 text-xs font-medium ${freight.operation_type === 'load' ? 'bg-sky-100/50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400' : 'bg-violet-100/50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400'}`}>
        {freight.operation_type === 'load' ? '↑ Carga' : '↓ Desc.'}
      </div>
    </div>
  );
}

function StatPill({ label, value, color = 'text-gray-600 dark:text-gray-300' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100/60 dark:bg-gray-800/60 px-3 py-1.5">
      <span className={`font-mono text-xl font-black ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-500">{label}</span>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

// Intervalo de fallback (polling de segurança caso o WebSocket caia)
const FALLBACK_POLL_MS = 30_000;

export default function YardBoard({ initialData }) {
  const { auth } = usePage().props;
  const [data, setData] = useState(initialData);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connError, setConnError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const now = useNow(1000);
  const intervalRef = useRef(null);
  const rootRef = useRef(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setConnError(false);
    try {
      const res = await fetch(route('admin.yard-board.data'), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date());
      } else {
        setConnError(true);
      }
    } catch {
      setConnError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // WebSocket via Laravel Echo/Reverb
  useEffect(() => {
    if (!window.Echo || !auth?.company?.id) return;

    const channelName = `yard-board.${auth.company.id}`;
    const channel = window.Echo.private(channelName);

    channel
      .listen('.YardBoardUpdated', () => fetchData())
      .subscribed(() => setConnected(true))
      .error(() => setConnected(false));

    return () => {
      window.Echo.leave(channelName);
      setConnected(false);
    };
  }, [auth?.company?.id, fetchData]);

  // Polling de segurança: intervalo maior quando WebSocket está ativo,
  // normal quando não há WebSocket disponível
  useEffect(() => {
    const interval = connected ? FALLBACK_POLL_MS : 10_000;
    intervalRef.current = setInterval(fetchData, interval);
    return () => clearInterval(intervalRef.current);
  }, [fetchData, connected]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const allActive = (data?.docas ?? []).reduce((s, d) => s + d.freights.length, 0)
    + (data?.waitingQueue ?? []).length;
  const loadingCount = (data?.docas ?? []).flatMap(d => d.freights).filter(f => f.status === 'loading').length;
  const unloadingCount = (data?.docas ?? []).flatMap(d => d.freights).filter(f => f.status === 'unloading').length;
  const waitingCount = (data?.waitingQueue ?? []).length;
  const freeDocas = (data?.docas ?? []).filter(d => d.freights.length === 0).length;

  const board = (
    <div ref={rootRef} className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* ── top bar ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-gray-900 dark:text-white">CargoHub</span>
            <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Painel do Pátio</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="ativos" value={allActive} color="text-teal-600 dark:text-teal-400" />
          <StatPill label="carregando" value={loadingCount} color="text-sky-600 dark:text-sky-400" />
          <StatPill label="descarregando" value={unloadingCount} color="text-violet-600 dark:text-violet-400" />
          <StatPill label="aguardando" value={waitingCount} color="text-amber-600 dark:text-amber-400" />
          <StatPill label="docas livres" value={freeDocas} color="text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <LiveDot color={connError ? 'bg-red-400' : refreshing ? 'bg-amber-400' : connected ? 'bg-emerald-400' : 'bg-sky-400'} />
            <span>
              {connError
                ? 'Erro ao atualizar'
                : refreshing
                  ? 'Atualizando...'
                  : connected
                    ? `Tempo real · ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : `Polling · ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </span>
          </div>
          <div className="hidden flex-col items-end sm:flex">
            <span className="font-mono text-lg font-black tabular-nums text-gray-900 dark:text-white">{formatClock(now)}</span>
            <span className="text-[11px] capitalize text-gray-400 dark:text-gray-600">{formatDate(now)}</span>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            title="Atualizar agora"
            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-500 dark:text-gray-400 transition hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40"
          >
            <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none">
              <path d="M4 4v6h6M20 20v-6h-6M4.93 15A9 9 0 1 0 6 6.93" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={toggleFullscreen}
            title={fullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-500 dark:text-gray-400 transition hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {fullscreen ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="p-6 space-y-8">

        {/* ── waiting queue ── */}
        {(data?.waitingQueue?.length ?? 0) > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Fila de espera</h2>
              </div>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                {data.waitingQueue.length} veículo{data.waitingQueue.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.waitingQueue.map((f) => (
                <QueueCard key={f.id} freight={f} now={now} />
              ))}
            </div>
          </section>
        )}

        {/* ── docas grid ── */}
        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Docas</h2>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-600">{data?.docas?.length ?? 0} docas ativas</span>
          </div>

          {(data?.docas?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-20 text-center">
              <svg className="h-12 w-12 text-gray-200 dark:text-gray-800" viewBox="0 0 24 24" fill="none">
                <path d="M2 20V9l10-6 10 6v11H2ZM9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-600">Nenhuma doca ativa cadastrada.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data.docas).map((doca) => (
                <DocaCard key={doca.id} doca={doca} now={now} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );

  // render inside layout OR standalone when fullscreen
  return (
    <AuthenticatedLayout>
      <Head title="Painel do Pátio — CargoHub" />
      {board}
    </AuthenticatedLayout>
  );
}
