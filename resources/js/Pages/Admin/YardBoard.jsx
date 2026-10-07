import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import StatusBadge from '@/Components/UI/StatusBadge';
import { getStatusPresentation } from '@/utils/statusPresentation';

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

// ─── sub-components ──────────────────────────────────────────────────────────

/* Tempo grande e legível de longe (painel pensado para TV). */
function Duration({ label, value, tone = 'neutral' }) {
  const colors = {
    neutral: 'text-areia-900 dark:text-white',
    warning: 'text-ocre-700 dark:text-ocre-300',
    danger: 'text-tijolo-700 dark:text-tijolo-300',
  };
  return (
    <div>
      <p className="text-sm text-areia-600 dark:text-areia-400">{label}</p>
      <p className={`whitespace-nowrap font-display text-2xl font-bold leading-tight tabular-nums ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function minutesSince(isoString, now) {
  if (!isoString) return null;
  return Math.floor((now - new Date(isoString)) / 60000);
}

function waitTone(minutes) {
  if (minutes === null) return 'neutral';
  if (minutes > 60) return 'danger';
  if (minutes > 30) return 'warning';
  return 'neutral';
}

function OpLabel({ type }) {
  return (
    <span className="text-[15px] text-areia-600 dark:text-areia-400">
      <span aria-hidden="true">{type === 'load' ? '↑ ' : '↓ '}</span>
      {type === 'load' ? 'Carga' : 'Descarga'}
    </span>
  );
}

function FreightSlot({ freight, now }) {
  const statusPresentation = getStatusPresentation('freight', freight.status);
  const since = elapsed(freight.arrived_at, now);
  const sinceOp = freight.status !== 'arrived' ? elapsed(freight.updated_at, now) : null;

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="plate text-lg">{freight.truck_plate || 'A definir'}</p>
        <StatusBadge label={statusPresentation.label} tone={statusPresentation.tone} />
      </div>
      <p className="mt-2.5 truncate text-base font-semibold text-areia-900 dark:text-white">{freight.driver_name}</p>
      <p className="flex flex-wrap gap-x-2">
        <OpLabel type={freight.operation_type} />
        {freight.client_name && <span className="truncate text-[15px] text-areia-600 dark:text-areia-400">· {freight.client_name}</span>}
      </p>

      {(since || sinceOp) && (
        <div className="mt-3 flex gap-6 border-t border-areia-200 pt-3 dark:border-areia-800">
          {since && <Duration label="No pátio" value={since} tone={waitTone(minutesSince(freight.arrived_at, now))} />}
          {sinceOp && <Duration label="Operando" value={sinceOp} />}
        </div>
      )}
    </div>
  );
}

function DocaCard({ doca, now }) {
  const isEmpty = doca.freights.length === 0;

  return (
    <section
      className={`flex flex-col rounded-xl border ${
        isEmpty
          ? 'border-dashed border-areia-300 bg-transparent dark:border-areia-700'
          : 'border-areia-200 bg-areia-50 shadow-sm dark:border-areia-800 dark:bg-areia-900/60'
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <h3 className="text-lg font-semibold text-areia-900 dark:text-white">{doca.nome}</h3>
        {isEmpty ? (
          <StatusBadge label="Livre" tone="success" />
        ) : (
          <StatusBadge label={doca.freights.length === 1 ? 'Ocupada' : `${doca.freights.length} veículos`} tone="info" />
        )}
      </header>

      <div className="flex-1 px-3 pb-3">
        {isEmpty ? (
          <p className="flex h-24 items-center justify-center text-[15px] text-areia-500 dark:text-areia-400">
            Disponível para receber
          </p>
        ) : (
          <div className="space-y-2.5">
            {doca.freights.map((f) => (
              <FreightSlot key={f.id} freight={f} now={now} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function QueueCard({ freight, now }) {
  const since = elapsed(freight.arrived_at, now);
  const tone = waitTone(minutesSince(freight.arrived_at, now));

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-areia-900 ${
        tone === 'danger'
          ? 'border-tijolo-300 border-l-4 border-l-tijolo-600 dark:border-tijolo-800'
          : 'border-areia-200 dark:border-areia-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="plate text-base">{freight.truck_plate || 'A definir'}</p>
        <OpLabel type={freight.operation_type} />
      </div>
      <p className="mt-2.5 truncate text-base font-semibold text-areia-900 dark:text-white">{freight.driver_name}</p>
      {freight.client_name && <p className="truncate text-[15px] text-areia-600 dark:text-areia-400">{freight.client_name}</p>}
      {since && (
        <div className="mt-3 border-t border-areia-200 pt-3 dark:border-areia-800">
          <Duration label="Esperando" value={since} tone={tone} />
        </div>
      )}
    </div>
  );
}

function Counter({ label, value, tone }) {
  const dots = {
    neutral: 'bg-areia-500',
    info: 'bg-aco-500',
    warning: 'bg-ocre-400',
    success: 'bg-pinho-500',
  };
  return (
    <div className="glass min-w-[120px] rounded-lg px-4 py-2.5">
      <p className="flex items-center gap-2 text-sm font-medium text-areia-600 dark:text-areia-400">
        <span className={`h-2 w-2 rounded-full ${dots[tone]}`} aria-hidden="true" />
        {label}
      </p>
      <p className="font-display text-3xl font-bold leading-tight tabular-nums text-areia-900 dark:text-white">{value}</p>
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

  const statusText = connError
    ? 'Erro ao atualizar'
    : refreshing
      ? 'Atualizando…'
      : `${connected ? 'Ao vivo' : 'Atualizado'} às ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const board = (
    <div ref={rootRef} className="min-h-screen bg-areia-100 text-areia-900 dark:bg-[#1d1f1c] dark:text-white">
      <header className="sticky top-0 z-10 border-b border-areia-200 bg-areia-50 px-6 py-4 dark:border-areia-800 dark:bg-areia-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-areia-900 dark:text-white">Painel do pátio</h1>
            <p className="mt-0.5 flex items-center gap-2 text-[15px] text-areia-600 dark:text-areia-400">
              <span
                className={`h-2.5 w-2.5 rounded-full ${connError ? 'bg-tijolo-500' : refreshing ? 'bg-ocre-400' : 'bg-pinho-500'}`}
                aria-hidden="true"
              />
              {statusText}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-display text-3xl font-bold leading-none tabular-nums">{formatClock(now)}</p>
              <p className="mt-1 text-sm capitalize text-areia-600 dark:text-areia-400">{formatDate(now)}</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              aria-label="Atualizar agora"
              title="Atualizar agora"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-areia-300 bg-white text-areia-700 transition hover:border-areia-400 hover:text-areia-900 disabled:opacity-40 dark:border-areia-700 dark:bg-areia-900 dark:text-areia-300"
            >
              <svg className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4v6h6M20 20v-6h-6M4.93 15A9 9 0 1 0 6 6.93" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-areia-300 bg-white text-areia-700 transition hover:border-areia-400 hover:text-areia-900 dark:border-areia-700 dark:bg-areia-900 dark:text-areia-300"
            >
              {fullscreen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Counter label="Aguardando" value={waitingCount} tone="warning" />
          <Counter label="Carregando" value={loadingCount} tone="info" />
          <Counter label="Descarregando" value={unloadingCount} tone="info" />
          <Counter label="Docas livres" value={freeDocas} tone="success" />
          <Counter label="Total no pátio" value={allActive} tone="neutral" />
        </div>
      </header>

      <div className="space-y-8 p-6">
        {(data?.waitingQueue?.length ?? 0) > 0 && (
          <section>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold text-areia-900 dark:text-white">Fila de espera</h2>
              <span className="text-[15px] text-areia-600 dark:text-areia-400">
                {data.waitingQueue.length} veículo{data.waitingQueue.length !== 1 ? 's' : ''}, do que chegou primeiro ao último
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.waitingQueue.map((f) => (
                <QueueCard key={f.id} freight={f} now={now} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-xl font-semibold text-areia-900 dark:text-white">Docas</h2>
            <span className="text-[15px] text-areia-600 dark:text-areia-400">{data?.docas?.length ?? 0} ativas</span>
          </div>

          {(data?.docas?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-areia-300 py-20 text-center dark:border-areia-700">
              <p className="text-base text-areia-600 dark:text-areia-400">Nenhuma doca ativa cadastrada.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.docas.map((doca) => (
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
