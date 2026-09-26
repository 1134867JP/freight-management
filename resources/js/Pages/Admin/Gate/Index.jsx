import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import Button from '@/Components/UI/Button';
import StatusBadge from '@/Components/UI/StatusBadge';
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
  if (diff <= 0) return <StatusBadge label="Pontual" tone="success" />;
  if (diff <= 30) return <StatusBadge label={`${diff} min de atraso`} tone="warning" />;
  return <StatusBadge label={`Atrasado ${diff} min`} tone="danger" />;
}

/* Tipo de operação em cinza neutro: a cor fica reservada para o estado. */
function OpBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-areia-300 bg-areia-50 px-2 py-0.5 text-[13px] font-semibold text-areia-700 dark:border-areia-700 dark:bg-areia-800 dark:text-areia-200">
      <span aria-hidden="true">{type === 'load' ? '↑' : '↓'}</span>
      {type === 'load' ? 'Carga' : 'Descarga'}
    </span>
  );
}

function WaitBadge({ minutes }) {
  if (minutes === null) return null;
  const tone = minutes > 60 ? 'danger' : minutes > 30 ? 'warning' : 'neutral';
  return <StatusBadge label={`${minutes} min no pátio`} tone={tone} />;
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
    <div className="sticky top-0 z-20 border-b border-areia-200 bg-white px-4 py-4 sm:px-6 dark:border-areia-800 dark:bg-areia-900">
      <form onSubmit={lookup} className="flex flex-wrap items-center gap-3">
        <label htmlFor="gate-qr" className="flex w-full items-center gap-2 text-base font-semibold text-areia-900 sm:w-auto dark:text-white">
          <svg className="h-6 w-6 text-pinho-700 dark:text-pinho-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
            <path d="M14 14h3v3M17 17v4M14 17h.01M21 14v.01M21 18h-4v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Check-in por QR Code
        </label>
        <input
          id="gate-qr"
          ref={inputRef}
          type="text"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setResult(null);
            setError(null);
          }}
          placeholder="Aponte o leitor para o QR Code ou digite o código"
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-areia-400/70 bg-white px-4 py-2 text-base text-areia-900 placeholder:text-areia-400 focus:border-pinho-600 focus:outline-none focus:ring-[3px] focus:ring-ocre-300/60 dark:border-areia-600 dark:bg-areia-950 dark:text-areia-100"
          autoFocus
        />
        <Button type="submit" size="lg" loading={loading} className="shrink-0">
          Buscar
        </Button>

        {error && (
          <p role="alert" className="w-full text-[15px] font-medium text-tijolo-700 dark:text-tijolo-300">
            {error}
          </p>
        )}
        {result && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-pinho-200 bg-pinho-50 px-4 py-3 dark:border-pinho-800 dark:bg-pinho-950/50">
            <div className="flex items-center gap-3">
              <p className="plate text-base">{result.truck_plate}</p>
              <div>
                <p className="text-[15px] font-semibold text-areia-900 dark:text-white">{result.driver_name}</p>
                <p className="text-sm text-areia-600 dark:text-areia-400">{result.status_label}</p>
              </div>
            </div>
            {result.status === 'reserved' ? (
              <Button onClick={doCheckIn} size="lg">
                Fazer check-in
              </Button>
            ) : (
              <StatusBadge label={`Já registrado: ${result.status_label}`} tone="neutral" />
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ─── freight card ────────────────────────────────────────────────────────────

function FreightCard({ freight, action, now }) {
  const [busy, setBusy] = useState(false);
  const waitMin = freight.arrived_at ? elapsedMin(freight.arrived_at, now) : null;
  const isOverdue = waitMin !== null && waitMin > 60;

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
      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-areia-900 ${
        isOverdue
          ? 'border-tijolo-300 border-l-4 border-l-tijolo-600 dark:border-tijolo-800 dark:border-l-tijolo-400'
          : 'border-areia-200 dark:border-areia-800'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="plate text-base">{freight.truck_plate}</p>
        <OpBadge type={freight.operation_type} />
      </div>

      <p className="mt-3 truncate text-base font-semibold text-areia-900 dark:text-white">{freight.driver_name}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[15px] text-areia-600 dark:text-areia-400">
        {freight.user?.name && <span className="truncate">{freight.user.name}</span>}
        {freight.doca?.nome && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-pinho-800 dark:text-pinho-300">{freight.doca.nome}</span>
          </>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[15px] text-areia-700 dark:text-areia-300">
          <svg className="h-4 w-4 text-areia-500" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          Agendado {formatTime(freight.timeslot?.start_time)}
        </span>
        <WaitBadge minutes={waitMin} />
        {!freight.arrived_at && freight.timeslot && <PunctualityBadge freight={freight} />}
      </div>

      {action === 'checkin' && (
        <Button onClick={() => act('freights.gate-checkin')} disabled={busy} className="mt-4 w-full">
          Fazer check-in
        </Button>
      )}
      {action === 'checkout' && (
        <Button
          onClick={() => act('freights.gate-checkout')}
          disabled={busy || !!freight.departed_at}
          variant={freight.departed_at ? 'secondary' : 'primary'}
          className="mt-4 w-full"
        >
          {freight.departed_at ? 'Saída registrada' : 'Registrar saída'}
        </Button>
      )}
    </div>
  );
}

// ─── pipeline column ──────────────────────────────────────────────────────────

function PipelineColumn({ step, title, hint, count, tone, children, emptyText }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-areia-200 bg-areia-50 dark:border-areia-800 dark:bg-areia-900/60">
      <header className="flex items-start gap-3 border-b border-areia-200 px-4 py-3.5 dark:border-areia-800">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-areia-700 ring-1 ring-areia-300 dark:bg-areia-800 dark:text-areia-200 dark:ring-areia-700">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight text-areia-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">{hint}</p>
        </div>
        <StatusBadge label={String(count)} tone={tone} className="text-base" />
      </header>

      <div className="max-h-[55vh] flex-1 space-y-3 overflow-y-auto p-3 lg:max-h-[calc(100vh-300px)]">
        {children}
        {count === 0 && (
          <p className="py-10 text-center text-[15px] text-areia-500 dark:text-areia-400">{emptyText}</p>
        )}
      </div>
    </section>
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

      <div className="flex min-h-[calc(100vh-150px)] flex-col px-4 pb-6 pt-5 sm:px-6">
        <FlashMessages />

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
          <PipelineColumn
            step={1}
            title="Esperados hoje"
            hint="Faça o check-in quando o caminhão chegar"
            count={expected.length}
            tone="neutral"
            emptyText="Nenhuma chegada pendente."
          >
            {expected.map((f) => (
              <FreightCard key={f.id} freight={f} action="checkin" now={now} />
            ))}
          </PipelineColumn>

          <PipelineColumn
            step={2}
            title="No pátio"
            hint="Aguardando liberação de doca"
            count={waiting.length}
            tone="warning"
            emptyText="Ninguém aguardando."
          >
            {waiting.map((f) => (
              <FreightCard key={f.id} freight={f} action={null} now={now} />
            ))}
          </PipelineColumn>

          <PipelineColumn
            step={3}
            title="Em operação"
            hint="Carregando ou descarregando na doca"
            count={inProgress.length}
            tone="info"
            emptyText="Nenhuma operação em andamento."
          >
            {inProgress.map((f) => (
              <FreightCard key={f.id} freight={f} action={null} now={now} />
            ))}
          </PipelineColumn>
        </div>

        <section className="mt-4 shrink-0 rounded-xl border border-areia-200 bg-white shadow-sm dark:border-areia-800 dark:bg-areia-900">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
            aria-expanded={showCompleted}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-areia-700 ring-1 ring-areia-300 dark:bg-areia-800 dark:text-areia-200 dark:ring-areia-700">
              4
            </span>
            <span className="text-base font-semibold text-areia-900 dark:text-white">Concluídos — registrar saída</span>
            <StatusBadge label={String(completedToday.length)} tone="success" />
            <span className="ml-auto text-[15px] font-medium text-pinho-700 dark:text-pinho-300">
              {showCompleted ? 'Ocultar' : 'Mostrar'}
            </span>
          </button>

          {showCompleted && (
            <div className="border-t border-areia-200 px-4 pb-4 dark:border-areia-800">
              {completedToday.length === 0 ? (
                <p className="py-4 text-[15px] text-areia-600 dark:text-areia-400">
                  Nenhuma operação concluída ainda hoje.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {completedToday.map((f) => (
                    <FreightCard key={f.id} freight={f} action="checkout" now={now} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
