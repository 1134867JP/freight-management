import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function elapsedMin(isoFrom, now) {
  if (!isoFrom) return null;
  return Math.floor((now - new Date(isoFrom)) / 60000);
}

// ─── badges ──────────────────────────────────────────────────────────────────

function PunctualityBadge({ freight }) {
  if (!freight.arrived_at || !freight.timeslot?.start_time) return null;
  const diff = Math.round((new Date(freight.arrived_at) - new Date(freight.timeslot.start_time)) / 60000);
  if (diff <= 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      Pontual
    </span>
  );
  if (diff <= 30) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
      +{diff}min
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
      Atrasado +{diff}min
    </span>
  );
}

function OpBadge({ type }) {
  if (type === 'load') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">
      ↑ Carga
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
      ↓ Descarga
    </span>
  );
}

// ─── QR Lookup ───────────────────────────────────────────────────────────────

function QrLookupPanel() {
  const [token, setToken]     = useState('');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef(null);

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
      if (!res.ok) { setError(data.error || 'QR não encontrado.'); return; }
      setResult(data);
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const doCheckIn = () => {
    if (!result) return;
    router.patch(route('freights.gate-checkin', result.id), {}, {
      onSuccess: () => { setResult(null); setToken(''); inputRef.current?.focus(); },
      preserveScroll: true,
    });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form onSubmit={lookup} className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-brand-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M14 14h3v3M17 17v4M14 17h.01M21 14v.01M21 18h-4v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 hidden sm:inline">QR Check-in</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={e => { setToken(e.target.value); setResult(null); setError(null); }}
          placeholder="Escaneie ou cole o token do QR Code..."
          className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Buscar'}
        </button>

        {/* resultado inline */}
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
        {result && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{result.truck_plate}</p>
              <p className="text-[11px] text-gray-500">{result.driver_name} · {result.status_label}</p>
            </div>
            {result.status === 'reserved' ? (
              <button
                onClick={doCheckIn}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                ✓ Check-in
              </button>
            ) : (
              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
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
    router.patch(route(routeName, { freight: freight.id }), {}, {
      preserveScroll: true,
      onFinish: () => setBusy(false),
    });
  };

  return (
    <div className={`rounded-xl border p-3.5 transition-shadow hover:shadow-md ${
      isOverdue
        ? 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    }`}>
      {/* plate + op */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-black tracking-wider text-gray-900 dark:text-gray-100">
            {freight.truck_plate}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
            {freight.driver_name}
          </p>
        </div>
        <OpBadge type={freight.operation_type} />
      </div>

      {/* client + dock */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {freight.user?.name && (
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{freight.user.name}</span>
        )}
        {freight.doca?.nome && (
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {freight.doca.nome}
          </span>
        )}
      </div>

      {/* time info */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          {freight.timeslot ? fmtTime(freight.timeslot.start_time) : '—'}
        </div>
        {waitMin !== null && (
          <span className={`text-[11px] font-bold ${
            waitMin > 60 ? 'text-red-600' : waitMin > 30 ? 'text-amber-600' : 'text-gray-500'
          }`}>
            {waitMin}min no pátio
          </span>
        )}
        {!freight.arrived_at && freight.timeslot && (
          <PunctualityBadge freight={freight} />
        )}
      </div>

      {/* action button */}
      {action === 'checkin' && (
        <button
          onClick={() => act('freights.gate-checkin')}
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          ↓ Check-in
        </button>
      )}
      {action === 'checkout' && (
        <button
          onClick={() => act('freights.gate-checkout')}
          disabled={busy || !!freight.departed_at}
          className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
        >
          {freight.departed_at ? '✓ Saiu' : '↑ Check-out'}
        </button>
      )}
    </div>
  );
}

// ─── pipeline column ──────────────────────────────────────────────────────────

function PipelineColumn({ title, count, accentColor, bgColor, icon, children, emptyText }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* column header */}
      <div className={`flex items-center gap-2.5 rounded-t-xl border-b-2 ${accentColor} ${bgColor} px-4 py-3`}>
        {icon}
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-black ${bgColor} ring-2 ring-current text-gray-600 dark:text-gray-300`}>
          {count}
        </span>
      </div>

      {/* scrollable cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto rounded-b-xl border border-t-0 border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {children}
        {count === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs text-gray-400 dark:text-gray-500">{emptyText}</p>
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

      <div className="flex h-[calc(100vh-112px)] flex-col px-4 pt-4 pb-0 sm:px-6">
        <FlashMessages />

        {/* ── 3-column pipeline ── */}
        <div className="flex flex-1 gap-4 overflow-hidden">

          {/* ESPERADOS */}
          <PipelineColumn
            title="Esperados hoje"
            count={expected.length}
            accentColor="border-gray-300 dark:border-gray-600"
            bgColor="bg-white dark:bg-gray-800"
            emptyText="Sem chegadas pendentes"
            icon={
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="none">
                <path d="M6 2v3M14 2v3M2.5 7.5h15M5 5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
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
            accentColor="border-amber-400 dark:border-amber-600"
            bgColor="bg-amber-50 dark:bg-amber-950/20"
            emptyText="Fila vazia"
            icon={
              <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            }
          >
            {waiting.map((f) => (
              <FreightCard key={f.id} freight={f} action="checkout" now={now} />
            ))}
          </PipelineColumn>

          {/* EM OPERAÇÃO */}
          <PipelineColumn
            title="Em operação"
            count={inProgress.length}
            accentColor="border-sky-400 dark:border-sky-600"
            bgColor="bg-sky-50 dark:bg-sky-950/20"
            emptyText="Nenhuma operação em curso"
            icon={
              <svg className="h-4 w-4 text-sky-500" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h9v7H3V6Zm9 2.5h2.5L17 11v2h-5V8.5ZM6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            }
          >
            {inProgress.map((f) => (
              <FreightCard key={f.id} freight={f} action={null} now={now} />
            ))}
          </PipelineColumn>

        </div>

        {/* ── barra de concluídos (compacta, no rodapé) ── */}
        <div className="mt-3 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/10">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
          >
            <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Concluídos hoje
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {completedToday.length}
            </span>
            <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-500">
              {showCompleted ? 'Recolher ▲' : 'Expandir ▼'}
            </span>
          </button>

          {showCompleted && (
            <div className="border-t border-emerald-200 px-4 pb-3 dark:border-emerald-800/50">
              {completedToday.length === 0 ? (
                <p className="py-3 text-xs text-emerald-600 dark:text-emerald-500">Nenhuma operação concluída ainda hoje.</p>
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
