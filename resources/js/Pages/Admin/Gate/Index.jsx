import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// ─── helpers ────────────────────────────────────────────────────────────────

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

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function elapsedMin(isoFrom, now) {
  if (!isoFrom) return null;
  return Math.floor((now - new Date(isoFrom)) / 60000);
}

// ─── badges ─────────────────────────────────────────────────────────────────

function PunctualityBadge({ freight }) {
  if (!freight.arrived_at || !freight.timeslot?.start_time) return null;
  const diff = Math.round((new Date(freight.arrived_at) - new Date(freight.timeslot.start_time)) / 60000);
  if (diff <= 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      Pontual
    </span>
  );
  if (diff <= 30) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 3v3.5l2 1" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
      +{diff}min
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 2v4M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M.75 10.5L6 1l5.25 9.5H.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
      Atrasado +{diff}min
    </span>
  );
}

function OpBadge({ type }) {
  if (type === 'load') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
      Carga
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
      Descarga
    </span>
  );
}

function StatusBadge({ status, label }) {
  const cfg = {
    reserved:  'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
    arrived:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    loading:   'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    unloading: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }[status] ?? 'bg-gray-100 text-gray-600';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg}`}>{label}</span>;
}

// ─── stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, borderColor, valueColor }) {
  return (
    <div className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm dark:bg-gray-800 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`mt-2 text-4xl font-black tabular-nums ${valueColor}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${borderColor.replace('border-', 'bg-').replace('-400', '-100').replace('-600', '-900/30')} mt-0.5`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── flow pipeline ───────────────────────────────────────────────────────────

function FlowStep({ label, count, active, color }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? '' : 'opacity-40'}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black ${
        active
          ? `border-current ${color} bg-current/10`
          : 'border-gray-300 text-gray-400 dark:border-gray-600'
      }`}>
        {count}
      </div>
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return <div className="mt-[-1.25rem] h-px flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />;
}

// ─── section heading ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, countColor, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${countColor}`}>{count}</span>
        </div>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
  );
}

// ─── freight row ─────────────────────────────────────────────────────────────

function FreightRow({ freight, actions, now }) {
  const [busy, setBusy] = useState(false);
  const waitMin = freight.arrived_at ? elapsedMin(freight.arrived_at, now) : null;
  const isOverdue = waitMin !== null && waitMin > 60;

  const act = (routeName) => {
    if (busy) return;
    setBusy(true);
    router.patch(route(routeName, { freight: freight.id }), {}, {
      preserveScroll: true,
      onFinish: () => setBusy(false),
    });
  };

  return (
    <tr className={`group border-b transition-colors last:border-0 ${
      isOverdue
        ? 'border-red-100 bg-red-50/30 hover:bg-red-50/60 dark:border-red-900/30 dark:bg-red-950/10 dark:hover:bg-red-950/20'
        : 'border-gray-100 hover:bg-gray-50 dark:border-gray-700/60 dark:hover:bg-gray-800/50'
    }`}>

      {/* vehicle */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            freight.operation_type === 'load'
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'
              : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
          }`}>
            {freight.operation_type === 'load' ? '↑' : '↓'}
          </div>
          <div>
            <p className="font-mono text-sm font-black tracking-wider text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
          </div>
        </div>
      </td>

      {/* client */}
      <td className="px-3 py-3.5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{freight.user?.name ?? '—'}</p>
      </td>

      {/* op */}
      <td className="px-3 py-3.5">
        <OpBadge type={freight.operation_type} />
      </td>

      {/* scheduled */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          {freight.timeslot ? fmtTime(freight.timeslot.start_time) : '—'}
        </div>
      </td>

      {/* arrival */}
      <td className="px-3 py-3.5">
        {freight.arrived_at ? (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDateTime(freight.arrived_at)}</p>
            {waitMin !== null && (
              <p className={`mt-0.5 text-xs font-semibold ${
                waitMin > 60 ? 'text-red-500' : waitMin > 30 ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {waitMin > 0 ? `${waitMin}min no pátio` : 'Acabou de chegar'}
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>

      {/* punctuality */}
      <td className="px-3 py-3.5">
        <PunctualityBadge freight={freight} />
      </td>

      {/* status */}
      <td className="px-3 py-3.5">
        <StatusBadge status={freight.status} label={freight.status_label ?? freight.status} />
      </td>

      {/* doca */}
      <td className="px-3 py-3.5">
        {freight.doca?.nome ? (
          <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
            {freight.doca.nome}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* actions */}
      <td className="py-3.5 pl-3 pr-5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {actions.includes('checkin') && (
            <button
              onClick={() => act('freights.gate-checkin')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              Check-in
            </button>
          )}
          {actions.includes('checkout') && (
            <button
              onClick={() => act('freights.gate-checkout')}
              disabled={busy || !!freight.departed_at}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {freight.departed_at ? (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  Saiu
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><path d="M8 14V2M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                  Check-out
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── freight table ────────────────────────────────────────────────────────────

function FreightTable({ freights, actions, emptyIcon, emptyText, now }) {
  if (!freights.length) return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        {emptyIcon}
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{emptyText}</p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/60">
              {['Veículo / Motorista', 'Cliente', 'Op.', 'Agendado', 'Chegada', 'Pontualidade', 'Status', 'Doca', ''].map((h) => (
                <th key={h} className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 first:pl-5 last:pr-5 dark:text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700/60 dark:bg-gray-900">
            {freights.map((f) => (
              <FreightRow key={f.id} freight={f} actions={actions} now={now} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── queue card (compact) ─────────────────────────────────────────────────────

function QueueCard({ freight, now }) {
  const [busy, setBusy] = useState(false);
  const waitMin = elapsedMin(freight.arrived_at, now);
  const isLong = waitMin !== null && waitMin > 45;

  const checkout = () => {
    if (busy) return;
    setBusy(true);
    router.patch(route('freights.gate-checkout', { freight: freight.id }), {}, {
      preserveScroll: true,
      onFinish: () => setBusy(false),
    });
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
      isLong
        ? 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    }`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
        isLong
          ? 'bg-amber-100 dark:bg-amber-900/40'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        {isLong ? '⚠️' : '⏳'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-base font-black tracking-wider text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {freight.driver_name}
          {freight.user?.name && ` · ${freight.user.name}`}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <OpBadge type={freight.operation_type} />
          <PunctualityBadge freight={freight} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {waitMin !== null && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">No pátio</p>
            <p className={`font-mono text-lg font-black ${isLong ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {waitMin}min
            </p>
          </div>
        )}
        <button
          onClick={checkout}
          disabled={busy || !!freight.departed_at}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {freight.departed_at ? 'Saiu' : 'Check-out'}
        </button>
      </div>
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────────

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
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' },
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
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/20">
      <h3 className="mb-3 text-sm font-bold text-teal-700 dark:text-teal-400">Check-in por QR Code</h3>
      <form onSubmit={lookup} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={e => { setToken(e.target.value); setResult(null); setError(null); }}
          placeholder="Escaneie ou cole o token do QR Code..."
          className="flex-1 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-teal-700 dark:bg-gray-800 dark:text-gray-100"
          autoFocus
        />
        <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-teal-200 bg-white p-3 dark:border-teal-800 dark:bg-gray-800">
          <div>
            <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{result.truck_plate}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{result.driver_name}</p>
            <p className="mt-0.5 text-xs text-gray-400">{result.status_label}</p>
          </div>
          {result.status === 'reserved' ? (
            <button onClick={doCheckIn} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              ✓ Check-in
            </button>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {result.status_label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function GateIndex({ expected, waiting, inProgress, completedToday }) {
  const now = useNow();
  const totalOps = inProgress.length;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Controle de Portaria"
          subtitle="Registre chegadas, gerencie a fila e acompanhe operações em tempo real"
        />
      }
    >
      <Head title="Portaria — CargoHub" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <QrLookupPanel />

          {/* ── stat cards ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Esperados hoje"
              value={expected.length}
              borderColor="border-gray-400 dark:border-gray-500"
              valueColor="text-gray-700 dark:text-gray-200"
              icon={<svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="none"><path d="M6 2v3M14 2v3M2.5 7.5h15M5 5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
            />
            <StatCard
              label="Aguardando fila"
              value={waiting.length}
              borderColor="border-amber-400 dark:border-amber-500"
              valueColor="text-amber-600 dark:text-amber-400"
              icon={<svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
            />
            <StatCard
              label="Em operação"
              value={totalOps}
              borderColor="border-sky-400 dark:border-sky-500"
              valueColor="text-sky-600 dark:text-sky-400"
              icon={<svg className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="none"><path d="M3 6h9v7H3V6Zm9 2.5h2.5L17 11v2h-5V8.5ZM6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
            />
            <StatCard
              label="Concluídos hoje"
              value={completedToday.length}
              borderColor="border-emerald-400 dark:border-emerald-500"
              valueColor="text-emerald-600 dark:text-emerald-400"
              icon={<svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>}
            />
          </div>

          {/* ── flow pipeline ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Fluxo do dia</p>
            <div className="flex items-center gap-2">
              <FlowStep label="Reservados" count={expected.length} active={expected.length > 0} color="text-gray-500" />
              <FlowArrow />
              <FlowStep label="No Pátio" count={waiting.length} active={waiting.length > 0} color="text-amber-500" />
              <FlowArrow />
              <FlowStep label="Operando" count={totalOps} active={totalOps > 0} color="text-sky-500" />
              <FlowArrow />
              <FlowStep label="Concluídos" count={completedToday.length} active={completedToday.length > 0} color="text-emerald-500" />
            </div>
          </div>

          {/* ── waiting queue (cards) ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={<svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}
              title="Fila de espera — veículos no pátio"
              count={waiting.length}
              countColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              description="Veículos que chegaram e aguardam operação"
            />
            {waiting.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 px-5 py-4 dark:border-amber-900/40 dark:bg-transparent">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
                <p className="text-sm text-amber-600 dark:text-amber-500">Fila vazia — nenhum veículo aguardando.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {waiting.map((f) => <QueueCard key={f.id} freight={f} now={now} />)}
              </div>
            )}
          </section>

          {/* ── expected today ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={<svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="none"><path d="M6 2v3M14 2v3M2.5 7.5h15M5 5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
              title="Esperados hoje"
              count={expected.length}
              countColor="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              description="Reservas de hoje que ainda não fizeram check-in"
            />
            <FreightTable
              freights={expected}
              actions={['checkin']}
              emptyText="Sem chegadas pendentes para hoje."
              emptyIcon={<svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
              now={now}
            />
          </section>

          {/* ── in progress ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={<svg className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="none"><path d="M3 6h9v7H3V6Zm9 2.5h2.5L17 11v2h-5V8.5ZM6 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
              title="Em operação agora"
              count={inProgress.length}
              countColor="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
              description="Veículos com carga ou descarga em andamento"
            />
            <FreightTable
              freights={inProgress}
              actions={[]}
              emptyText="Nenhuma operação em andamento."
              emptyIcon={<svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
              now={now}
            />
          </section>

          {/* ── completed today ── */}
          <section className="space-y-3">
            <SectionHeader
              icon={<svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>}
              title="Concluídos hoje"
              count={completedToday.length}
              countColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              description="Operações finalizadas — registre a saída se necessário"
            />
            <FreightTable
              freights={completedToday}
              actions={['checkout']}
              emptyText="Nenhuma operação concluída ainda hoje."
              emptyIcon={<svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
              now={now}
            />
          </section>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
