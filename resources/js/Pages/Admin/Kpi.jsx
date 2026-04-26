import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

function StatCard({ label, value, unit, sub, color = 'text-gray-900 dark:text-gray-100', border = 'border-gray-200 dark:border-gray-700' }) {
  return (
    <div className={`rounded-xl border ${border} bg-white px-5 py-4 shadow-sm dark:bg-gray-800`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className={`text-3xl font-black ${color}`}>{value ?? '—'}</span>
        {unit && <span className="mb-1 text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function BarChart({ data, maxVal, label }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm italic text-gray-400 dark:text-gray-500">Sem dados no período.</p>;
  }
  const max = maxVal || Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([day, count]) => (
        <div key={day} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">{day.slice(5)}</span>
          <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700" style={{ height: '18px' }}>
            <div
              className="rounded-full bg-teal-500 transition-all"
              style={{ width: `${(count / max) * 100}%`, height: '18px' }}
            />
          </div>
          <span className="w-6 shrink-0 text-xs font-bold text-gray-700 dark:text-gray-300">{count}</span>
        </div>
      ))}
    </div>
  );
}

function DocaBar({ doca }) {
  const pct = doca.utilization_pct || 0;
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{doca.codigo}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" style={{ height: '18px' }}>
        <div className={`rounded-full transition-all ${color}`} style={{ width: `${pct}%`, height: '18px' }} />
      </div>
      <span className={`w-12 shrink-0 text-xs font-bold ${pct >= 80 ? 'text-red-600 dark:text-red-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function Kpi({ kpis, period }) {
  const changePeriod = days => router.get(route('admin.kpi'), { days }, { preserveState: true });

  const {
    turn_time_avg_minutes,
    gate_throughput_by_day,
    doca_utilization,
    avg_wait_minutes,
    active_now,
    completed_period,
    detention_count,
    operation_breakdown,
  } = kpis || {};

  const formatMinutes = m => {
    if (m == null) return '—';
    if (m < 60) return `${m}`;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}min`;
  };

  const loadCount   = operation_breakdown?.load   || 0;
  const unloadCount = operation_breakdown?.unload || 0;
  const totalOps    = loadCount + unloadCount;

  return (
    <AuthenticatedLayout header={
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">KPIs do Pátio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Indicadores de desempenho operacional</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => changePeriod(d)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${period === d ? 'bg-teal-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>
    }>
      <Head title="KPIs do Pátio" />

      <div className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Top stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Turn Time médio"
              value={turn_time_avg_minutes != null ? formatMinutes(turn_time_avg_minutes) : '—'}
              unit={turn_time_avg_minutes != null && turn_time_avg_minutes < 60 ? 'min' : ''}
              sub="Entrada → saída do pátio"
              color={turn_time_avg_minutes != null && turn_time_avg_minutes > 240 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}
            />
            <StatCard
              label="Aguardando agora"
              value={avg_wait_minutes != null ? formatMinutes(avg_wait_minutes) : '—'}
              unit={avg_wait_minutes != null && avg_wait_minutes < 60 ? 'min' : ''}
              sub="Tempo médio na fila"
              color="text-amber-600 dark:text-amber-400"
              border="border-amber-200 dark:border-amber-800"
            />
            <StatCard
              label="Veículos no pátio"
              value={active_now}
              sub="Agora"
              color="text-blue-700 dark:text-blue-400"
              border="border-blue-200 dark:border-blue-800"
            />
            <StatCard
              label="Em detention"
              value={detention_count}
              sub={`No pátio há mais tempo que o limite`}
              color={detention_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
              border={detention_count > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Gate throughput */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Gate Throughput</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Veículos que chegaram por dia</p>
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{completed_period}</span>
              </div>
              <BarChart data={gate_throughput_by_day} />
            </div>

            {/* Dock utilization */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">Utilização de Docas</h3>
              <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">% do tempo ocupadas no período</p>
              {(!doca_utilization || doca_utilization.length === 0) ? (
                <p className="text-sm italic text-gray-400">Nenhuma doca cadastrada.</p>
              ) : (
                <div className="space-y-2.5">
                  {doca_utilization.map(d => <DocaBar key={d.id} doca={d} />)}
                </div>
              )}
            </div>

            {/* Operation breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">Operações por Tipo</h3>
              {totalOps === 0 ? (
                <p className="text-sm italic text-gray-400">Sem operações concluídas no período.</p>
              ) : (
                <div className="flex gap-6">
                  {[
                    { label: 'Cargas', value: loadCount, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500' },
                    { label: 'Descargas', value: unloadCount, color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-500' },
                  ].map(op => (
                    <div key={op.label} className="flex-1">
                      <div className="flex items-end gap-2 mb-2">
                        <span className={`text-4xl font-black ${op.color}`}>{op.value}</span>
                        <span className="mb-1 text-xs text-gray-400">{totalOps > 0 ? Math.round((op.value / totalOps) * 100) : 0}%</span>
                      </div>
                      <div className="mb-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" style={{ height: '8px' }}>
                        <div className={`rounded-full ${op.bg}`} style={{ width: `${totalOps > 0 ? (op.value / totalOps) * 100 : 0}%`, height: '8px' }} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{op.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Period summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">Resumo do Período ({period} dias)</h3>
              <dl className="space-y-2">
                {[
                  { label: 'Operações concluídas', value: completed_period },
                  { label: 'Turn time médio', value: formatMinutes(turn_time_avg_minutes) },
                  { label: 'Veículos no pátio agora', value: active_now },
                  { label: 'Em detention agora', value: detention_count },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{item.label}</dt>
                    <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
