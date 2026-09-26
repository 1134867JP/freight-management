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
          <h2 className="text-areia-900 dark:text-white">Ocupação dos próximos 7 dias</h2>
          <p className="mt-0.5 text-[15px] text-areia-600 dark:text-areia-400">Agendamentos ativos por data</p>
        </div>
        <Link href={route('reports.admin.timeslots')} className="inline-flex min-h-10 items-center text-[15px] font-semibold text-pinho-700 underline-offset-4 hover:underline dark:text-pinho-300">
          Abrir relatório
        </Link>
      </Card.Header>
      <Card.Content className="pb-4">
        {!hasOccupancy ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-areia-300 px-6 text-center dark:border-areia-700">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pinho-50 text-pinho-700 dark:bg-pinho-950 dark:text-pinho-300">
              <Icon name="calendar" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-base font-semibold text-areia-800 dark:text-areia-200">Nenhum agendamento nos próximos 7 dias</p>
            <p className="mt-1 max-w-sm text-[15px] leading-relaxed text-areia-600 dark:text-areia-400">Publique uma janela para disponibilizar horários aos clientes.</p>
            <Link href={route('timeslots.index')} className="mt-4 text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
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
                  <span className="text-[15px] font-semibold tabular-nums text-areia-800 dark:text-areia-100">{item.count}</span>
                  <div className="relative flex min-h-0 flex-1 items-end border-b border-areia-300 dark:border-areia-700">
                    <div
                      className="mx-auto w-full max-w-14 rounded-t-md bg-pinho-600 transition-[height] duration-500 hover:bg-pinho-700 dark:bg-pinho-400 dark:hover:bg-pinho-300"
                      style={{ height: `${height}%` }}
                      title={`${item.count} agendamento(s)`}
                    />
                  </div>
                  <div className="truncate text-sm text-areia-600 dark:text-areia-400">
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
    { label: 'Disponíveis', value: stats?.available_timeslots ?? 0, bar: 'bg-pinho-500' },
    { label: 'Reservados', value: stats?.reserved_timeslots ?? 0, bar: 'bg-aco-500' },
    { label: 'Lotados', value: stats?.full_timeslots ?? 0, bar: 'bg-ocre-400' },
  ];

  return (
    <Card className="h-full">
      <Card.Header>
        <h2 className="text-areia-900 dark:text-white">Status das janelas</h2>
        <p className="mt-0.5 text-[15px] text-areia-600 dark:text-areia-400">Quantidade de janelas por situação</p>
      </Card.Header>
      <Card.Content className="space-y-6">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[15px] font-medium text-areia-700 dark:text-areia-300">{row.label}</span>
              <span className="font-display text-xl font-bold leading-none tabular-nums text-areia-900 dark:text-white">{row.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-areia-100 dark:bg-areia-800">
              <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${Math.min((Number(row.value) / total) * 100, 100)}%` }} />
            </div>
          </div>
        ))}

        <Link href={route('timeslots.index')} className="flex min-h-11 items-center justify-between rounded-lg border border-areia-300 bg-white px-4 py-2 text-[15px] font-semibold text-areia-800 transition-colors hover:border-pinho-300 hover:text-pinho-800 dark:border-areia-700 dark:bg-areia-800 dark:text-areia-100">
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

      <div className="py-8">
        <div className="mx-auto max-w-[1600px] space-y-8 px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-areia-900 dark:text-white">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-1 text-base text-areia-600 dark:text-areia-400">
                Veja o que está acontecendo no pátio e na agenda.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={route('freights.approvalList')} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-areia-300 bg-white px-4 py-2 text-[15px] font-semibold text-areia-800 shadow-sm transition-colors hover:bg-areia-50 dark:border-areia-700 dark:bg-areia-800 dark:text-areia-100 dark:hover:bg-areia-700">
                Ver fretes
              </Link>
              <Link href={route('timeslots.index')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-pinho-700 px-4 py-2 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-pinho-800 dark:bg-pinho-400 dark:text-areia-950 dark:hover:bg-pinho-300">
                <Icon name="calendar" className="h-5 w-5" />
                Nova janela
              </Link>
            </div>
          </section>

          <section>
            <SectionHeading title="O que você precisa fazer?" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} href={route(action.routeName)} {...action} icon={<Icon name={action.icon} className="h-6 w-6" />} />
              ))}
            </div>
          </section>

          <section aria-labelledby="indicadores-titulo">
            <SectionHeading title={<span id="indicadores-titulo">Janelas de agendamento</span>} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <MetricCard label="Cadastradas" value={stats?.total_timeslots ?? 0} tone="neutral" detail="Total no sistema" />
              <MetricCard label="Disponíveis" value={stats?.available_timeslots ?? 0} tone="success" detail="Abertas para reserva" />
              <MetricCard label="Reservadas" value={stats?.reserved_timeslots ?? 0} tone="info" detail="Com agendamento" />
              <MetricCard label="Lotadas" value={stats?.full_timeslots ?? 0} tone="warning" detail="Sem capacidade" />
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8"><OccupancyChart occupancy={occupancy} /></div>
            <div className="xl:col-span-4"><CapacitySummary stats={stats} /></div>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
