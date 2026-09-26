import Card from '@/Components/UI/Card';
import MetricCard from '@/Components/Dashboard/MetricCard';
import QuickActionCard from '@/Components/Dashboard/QuickActionCard';
import SectionHeading from '@/Components/Dashboard/SectionHeading';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const ICON_PATHS = {
  calendar: 'M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z',
  check: 'M5 12.5 9.5 17 19 7.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  clipboard: 'M9 4.5h6m-5-2h4a1 1 0 0 1 1 1v1H9v-1a1 1 0 0 1 1-1Zm-2 3h8a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z',
  alert: 'M12 8v4m0 4h.01M10.3 3.6 2.7 17a2 2 0 0 0 1.74 3h15.12a2 2 0 0 0 1.74-3L13.7 3.6a2 2 0 0 0-3.4 0Z',
  yard: 'M3 3h7v7H3V3Zm0 11h7v7H3v-7Zm11-11h7v7h-7V3Zm0 11h7v7h-7v-7Z',
  gate: 'M3 12h18M3 12V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M9 12v4m6-4v4',
  schedule: 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  truck: 'M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  chart: 'M4 19V9m6 10V5m6 14v-7m4 7H2',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={ICON_PATHS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function OccupancyChart({ occupancy = [] }) {
  const maxCount = Math.max(...occupancy.map((item) => item.count), 1);
  const hasOccupancy = occupancy.some((item) => Number(item.count) > 0);

  return (
    <Card className="h-full">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Ocupação dos próximos 7 dias</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Agendamentos ativos por data</p>
        </div>
        <Link href={route('reports.admin.timeslots')} className="stencil text-sm text-ink underline decoration-signal-400 decoration-2 underline-offset-4 hover:bg-signal-400 dark:text-signal-400 dark:hover:text-ink">
          Abrir relatório
        </Link>
      </Card.Header>
      <Card.Content className="pb-4">
        {!hasOccupancy ? (
          <div className="flex h-56 flex-col items-center justify-center border-2 border-dashed border-concrete-300 px-6 text-center dark:border-concrete-700">
            <span className="flex h-10 w-10 items-center justify-center bg-ink text-signal-400">
              <Icon name="calendar" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Nenhum agendamento nos próximos 7 dias</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">Publique uma janela para disponibilizar horários aos clientes.</p>
            <Link href={route('timeslots.index')} className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Gerenciar janelas →
            </Link>
          </div>
        ) : (
          <div className="grid h-64 grid-cols-7 items-end gap-2 sm:gap-3" role="img" aria-label="Gráfico de reservas por dia">
            {occupancy.map((item) => {
              const date = new Date(`${item.date}T12:00:00`);
              const height = item.count === 0 ? 4 : Math.max((item.count / maxCount) * 100, 10);
              return (
                <div key={item.date} className="flex h-full min-w-0 flex-col justify-end gap-2 text-center">
                  <span className="font-display text-lg font-bold leading-none text-ink dark:text-white">{item.count}</span>
                  <div className="relative flex min-h-0 flex-1 items-end overflow-hidden border-b-2 border-ink bg-[repeating-linear-gradient(0deg,transparent_0_23px,rgb(20_20_19/0.06)_23px_24px)] dark:border-signal-400 dark:bg-[repeating-linear-gradient(0deg,transparent_0_23px,rgb(255_255_255/0.06)_23px_24px)]">
                    <div
                      className="w-full bg-ink transition-[height] duration-500 hover:bg-signal-400 dark:bg-signal-400 dark:hover:bg-signal-300"
                      style={{ height: `${height}%` }}
                      title={`${item.count} agendamento(s)`}
                    />
                  </div>
                  <div className="stencil truncate text-[11px] text-concrete-600 dark:text-concrete-400 sm:text-xs">
                    {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', '')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function CapacitySummary({ stats }) {
  const total = Math.max(Number(stats?.total_timeslots ?? 0), 1);
  const rows = [
    { label: 'Disponíveis', value: stats?.available_timeslots ?? 0, bar: 'bg-emerald-500' },
    { label: 'Reservados', value: stats?.reserved_timeslots ?? 0, bar: 'bg-ink dark:bg-signal-400' },
    { label: 'Lotados', value: stats?.full_timeslots ?? 0, bar: 'bg-amber-500' },
  ];

  return (
    <Card className="h-full">
      <Card.Header>
        <h2 className="font-bold text-slate-900 dark:text-white">Status das janelas</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Quantidade de janelas por situação</p>
      </Card.Header>
      <Card.Content className="space-y-6">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="stencil text-sm text-concrete-700 dark:text-concrete-300">{row.label}</span>
              <span className="font-display text-2xl font-bold leading-none text-ink dark:text-white">{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden bg-concrete-100 dark:bg-concrete-800">
              <div className={`h-full ${row.bar}`} style={{ width: `${Math.min((Number(row.value) / total) * 100, 100)}%` }} />
            </div>
          </div>
        ))}

        <Link href={route('timeslots.index')} className="stencil flex items-center justify-between border-2 border-ink px-4 py-3 text-sm text-ink transition-colors hover:bg-signal-400 dark:border-concrete-600 dark:text-concrete-100 dark:hover:border-signal-400 dark:hover:bg-signal-400 dark:hover:text-ink">
          Gerenciar disponibilidade
          <span aria-hidden="true">→</span>
        </Link>
      </Card.Content>
    </Card>
  );
}

export default function Dashboard({ stats, occupancy }) {
  const { auth } = usePage().props;
  const firstName = auth.user.name.split(' ')[0];
  const pilotMode = auth.company?.pilot_mode ?? false;
  const usesQueues = (auth.company?.uses_queues ?? true) && !pilotMode;

  const quickActions = [
    ...(usesQueues ? [{ title: 'Painel do pátio', description: 'Acompanhe filas, vagas e docas da operação.', routeName: 'admin.yard-board', icon: 'yard', tone: 'brand' }] : []),
    ...(usesQueues ? [{ title: 'Portaria', description: 'Faça check-in e check-out com menos etapas.', routeName: 'admin.gate', icon: 'gate', tone: 'warning' }] : []),
    { title: 'Gerenciar janelas', description: 'Crie horários e ajuste a capacidade da operação.', routeName: 'timeslots.index', icon: 'calendar', tone: 'violet' },
    { title: 'Agenda operacional', description: 'Visualize horários e reservas em uma única grade.', routeName: 'admin.agenda', icon: 'schedule', tone: 'brand' },
    { title: 'Fretes', description: 'Aprove, acompanhe e finalize movimentações.', routeName: 'freights.approvalList', icon: 'truck', tone: 'success' },
    ...(!pilotMode ? [{ title: 'Relatórios', description: 'Analise dados e exporte os resultados da operação.', routeName: 'reports.admin.freights', icon: 'chart', tone: 'slate' }] : []),
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Painel de operações" />

      <div className="py-6">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-5 border-b-2 border-ink pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-concrete-700">
            <div className="border-l-[10px] border-signal-400 pl-4">
              <p className="stencil text-xs text-slate-500 dark:text-slate-400">Visão geral</p>
              <h1 className="mt-1 text-5xl font-bold leading-none text-ink dark:text-white">Painel operacional</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {greeting()}, {firstName}. Resumo de capacidade, ocupação e atividades da operação.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={route('freights.approvalList')} className="stencil inline-flex min-h-11 items-center justify-center border-2 border-ink bg-white px-4 py-2 text-base text-ink transition-colors hover:bg-concrete-100 dark:border-concrete-500 dark:bg-transparent dark:text-concrete-100 dark:hover:bg-concrete-800">
                Ver fretes
              </Link>
              <Link href={route('timeslots.index')} className="stencil inline-flex min-h-11 items-center justify-center gap-2 border-2 border-ink bg-signal-400 px-4 py-2 text-base text-ink transition-colors hover:bg-signal-300">
                <Icon name="calendar" className="h-4 w-4" />
                Nova janela
              </Link>
            </div>
          </section>

          <section aria-label="Indicadores da operação" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <MetricCard label="Janelas cadastradas" value={stats?.total_timeslots ?? 0} tone="neutral" icon={<Icon name="calendar" />} detail="Total no sistema" />
            <MetricCard label="Disponíveis" value={stats?.available_timeslots ?? 0} tone="success" icon={<Icon name="check" />} detail="Abertas para reserva" />
            <MetricCard label="Reservados" value={stats?.reserved_timeslots ?? 0} tone="brand" icon={<Icon name="clipboard" />} detail="Com agendamento" />
            <MetricCard label="Lotados" value={stats?.full_timeslots ?? 0} tone="warning" icon={<Icon name="alert" />} detail="Sem capacidade" />
          </section>

          <section className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8"><OccupancyChart occupancy={occupancy} /></div>
            <div className="xl:col-span-4"><CapacitySummary stats={stats} /></div>
          </section>

          <section>
            <SectionHeading title="Acessos operacionais" description="Atalhos para as rotinas mais frequentes do dia." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} href={route(action.routeName)} {...action} icon={<Icon name={action.icon} className="h-5 w-5" />} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
