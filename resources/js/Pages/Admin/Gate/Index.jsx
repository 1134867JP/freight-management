import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import Button from '@/Components/UI/Button';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { formatTime } from '@/utils/formatters';

// ─── helpers ─────────────────────────────────────────────────────────────────

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function elapsedMin(isoFrom, now) {
  if (!isoFrom) return null;
  return Math.floor((now - new Date(isoFrom)) / 60000);
}

// ─── badges ──────────────────────────────────────────────────────────────────

function PunctualityBadge({ freight }) {
  if (!freight.arrived_at || !freight.timeslot?.start_time) return null;
  const diff = Math.round(
    (new Date(freight.arrived_at) - new Date(freight.timeslot.start_time)) / 60000,
  );
  if (diff <= 0)
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-emerald-800 ring-1 ring-emerald-600">
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        Pontual
      </span>
    );
  if (diff <= 30)
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-amber-800 ring-1 ring-amber-500">
        +{diff}min
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-red-600 px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-white">
      Atrasado +{diff}min
    </span>
  );
}

function OpBadge({ type }) {
  if (type === 'load')
    return (
      <span className="inline-flex items-center gap-1 bg-sky-700 px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-white">
        ↑ Carga
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-violet-700 px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-white">
      ↓ Descarga
    </span>
  );
}

// ─── QR Lookup ───────────────────────────────────────────────────────────────

function QrLookupPanel() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(route('admin.gate.qr-lookup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'QR não encontrado.');
        return;
      }
      setResult(data);
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const doCheckIn = () => {
    if (!result) return;
    router.patch(
      route('freights.gate-checkin', result.id),
      {},
      {
        onSuccess: () => {
          setResult(null);
          setToken('');
          inputRef.current?.focus();
        },
        preserveScroll: true,
      },
    );
  };

  return (
    <div className="sticky top-0 z-20 border-b-4 border-signal-400 bg-ink px-4 py-3 sm:px-6">
      <form onSubmit={lookup} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-signal-400">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M14 14h3v3M17 17v4M14 17h.01M21 14v.01M21 18h-4v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <span className="stencil hidden text-base text-white sm:inline">
            QR Check-in
          </span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setResult(null);
            setError(null);
          }}
          placeholder="Escaneie ou cole o token do QR Code..."
          className="min-h-11 min-w-0 flex-1 border-2 border-concrete-600 bg-concrete-900 px-3 py-2 font-mono text-base text-white placeholder-concrete-500 focus:border-signal-400 focus:outline-none focus:ring-0"
          autoFocus
        />
        <Button type="submit" variant="signal" loading={loading} className="min-h-11 shrink-0">
          Buscar
        </Button>

        {/* resultado inline */}
        {error && <span className="text-sm font-semibold text-red-400">{error}</span>}
        {result && (
          <div className="flex w-full items-center justify-between gap-3 border-2 border-signal-400 bg-concrete-900 px-3 py-2 sm:w-auto">
            <div>
              <p className="plate text-sm">
                {result.truck_plate}
              </p>
              <p className="mt-1 text-xs text-concrete-400">
                {result.driver_name} · {result.status_label}
              </p>
            </div>
            {result.status === 'reserved' ? (
              <Button onClick={doCheckIn} variant="signal" size="sm">
                ✓ Check-in
              </Button>
            ) : (
              <span className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {result.status_label}
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ─── freight card (compact — for column pipeline) ─────────────────────────────

function FreightCard({ freight, action, now }) {
  const [busy, setBusy] = useState(false);
  const waitMin = freight.arrived_at ? elapsedMin(freight.arrived_at, now) : null;
  const isOverdue = waitMin !== null && waitMin > 45;

  const act = (routeName) => {
    if (busy) return;
    setBusy(true);
    router.patch(
      route(routeName, { freight: freight.id }),
      {},
      {
        preserveScroll: true,
        onFinish: () => setBusy(false),
      },
    );
  };

  return (
    <div
      className={`relative overflow-hidden border bg-white p-3.5 pl-4 dark:bg-concrete-900 ${
        isOverdue
          ? 'border-ink dark:border-signal-500'
          : 'border-concrete-300 dark:border-concrete-700'
      }`}
    >
      {isOverdue && <span className="hazard absolute inset-y-0 left-0 w-1.5" aria-hidden="true" />}
      {/* plate + op */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="plate text-base">
            {freight.truck_plate}
          </p>
          <p className="mt-1.5 max-w-[160px] truncate text-sm font-medium text-concrete-700 dark:text-concrete-300">
            {freight.driver_name}
          </p>
        </div>
        <OpBadge type={freight.operation_type} />
      </div>

      {/* client + dock */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {freight.user?.name && (
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {freight.user.name}
          </span>
        )}
        {freight.doca?.nome && (
          <span className="bg-ink px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-[0.06em] text-signal-400 dark:bg-signal-400 dark:text-ink">
            {freight.doca.nome}
          </span>
        )}
      </div>

      {/* time info */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 font-mono text-xs text-concrete-600 dark:text-concrete-400">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          {formatTime(freight.timeslot?.start_time)}
        </div>
        {waitMin !== null && (
          <span
            className={`font-mono text-xs font-semibold ${
              waitMin > 60 ? 'text-red-600' : waitMin > 30 ? 'text-amber-700 dark:text-amber-400' : 'text-concrete-600 dark:text-concrete-400'
            }`}
          >
            {waitMin}min no pátio
          </span>
        )}
        {!freight.arrived_at && freight.timeslot && <PunctualityBadge freight={freight} />}
      </div>

      {/* action button */}
      {action === 'checkin' && (
        <Button
          onClick={() => act('freights.gate-checkin')}
          disabled={busy}
          variant="signal"
          size="sm"
          className="mt-3 w-full"
        >
          ↓ Check-in
        </Button>
      )}
      {action === 'checkout' && (
        <Button
          onClick={() => act('freights.gate-checkout')}
          disabled={busy || !!freight.departed_at}
          size="sm"
          className="mt-3 w-full !border-emerald-800 !bg-emerald-600 !text-white hover:!bg-emerald-700 focus:ring-emerald-500"
        >
          {freight.departed_at ? '✓ Saiu' : '↑ Check-out'}
        </Button>
      )}
    </div>
  );
}

// ─── pipeline column ──────────────────────────────────────────────────────────

function PipelineColumn({ title, count, accentColor, icon, children, emptyText }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* column header */}
      <div
        className={`flex items-center gap-2.5 border-t-[6px] bg-ink px-4 py-2.5 ${accentColor}`}
      >
        {icon}
        <span className="stencil text-base text-white">{title}</span>
        <span className="ml-auto font-display text-3xl font-bold leading-none tabular-nums text-white">
          {count}
        </span>
      </div>

      {/* scrollable cards */}
      <div
        className="max-h-[55vh] flex-1 space-y-2.5 overflow-y-auto border border-t-0 border-concrete-300 bg-concrete-50 p-3 lg:max-h-[calc(100vh-280px)] dark:border-concrete-800 dark:bg-concrete-950/40"
      >
        {children}
        {count === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <svg
              className="h-8 w-8 text-gray-300 dark:text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <p className="stencil text-xs text-concrete-500">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function GateIndex({ expected, waiting, inProgress, completedToday }) {
  const now = useNow();
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <AuthenticatedLayout>
      <Head title="Portaria — CargoHub" />

      <QrLookupPanel />

      <div className="flex min-h-[calc(100vh-112px)] flex-col px-4 pb-4 pt-4 sm:px-6">
        <FlashMessages />

        {/* ── 3-column pipeline ── */}
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
          {/* ESPERADOS */}
          <PipelineColumn
            title="Esperados hoje"
            count={expected.length}
            accentColor="border-concrete-400"
            emptyText="Sem chegadas pendentes"
            icon={
              <svg className="h-4 w-4 text-concrete-400" viewBox="0 0 20 20" fill="none">
                <path
                  d="M6 2v3M14 2v3M2.5 7.5h15M5 5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {expected.map((f) => (
              <FreightCard key={f.id} freight={f} action="checkin" now={now} />
            ))}
          </PipelineColumn>

          {/* AGUARDANDO */}
          <PipelineColumn
            title="No pátio — aguardando"
            count={waiting.length}
            accentColor="border-signal-400"
            emptyText="Fila vazia"
            icon={
              <svg className="h-4 w-4 text-signal-400" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10 6v4.5l2.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {waiting.map((f) => (
              <FreightCard key={f.id} freight={f} action={null} now={now} />
            ))}
          </PipelineColumn>

          {/* EM OPERAÇÃO */}
          <PipelineColumn
            title="Em operação"
            count={inProgress.length}
            accentColor="border-sky-500"
            emptyText="Nenhuma operação em curso"
            icon={
              <svg className="h-4 w-4 text-sky-400" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 6h9v7H3V6Zm9 2.5h2.5L17 11v2h-5V8.5ZM6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {inProgress.map((f) => (
              <FreightCard key={f.id} freight={f} action={null} now={now} />
            ))}
          </PipelineColumn>
        </div>

        {/* ── barra de concluídos (compacta, no rodapé) ── */}
        <div className="mt-3 shrink-0 border border-concrete-300 border-l-[6px] border-l-emerald-600 bg-white dark:border-concrete-800 dark:border-l-emerald-500 dark:bg-concrete-900">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
          >
            <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10.5l4 4 8-8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            <span className="stencil text-base text-ink dark:text-concrete-100">
              Operação concluída / saída
            </span>
            <span className="font-display text-2xl font-bold leading-none tabular-nums text-emerald-700 dark:text-emerald-400">
              {completedToday.length}
            </span>
            <span className="stencil ml-auto text-xs text-concrete-600 dark:text-concrete-400">
              {showCompleted ? 'Recolher ▲' : 'Expandir ▼'}
            </span>
          </button>

          {showCompleted && (
            <div className="border-t border-slate-200 px-4 pb-3 dark:border-slate-700">
              {completedToday.length === 0 ? (
                <p className="py-3 text-xs text-emerald-600 dark:text-emerald-500">
                  Nenhuma operação concluída ainda hoje.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {completedToday.map((f) => (
                    <FreightCard key={f.id} freight={f} action="checkout" now={now} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
