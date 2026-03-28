import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, Link } from '@inertiajs/react';

const statCards = (stats) => [
  {
    label: 'Cotas anunciados',
    value: stats?.total_timeslots ?? 0,
    color: 'text-gray-800 dark:text-gray-100',
    accent: 'border-gray-300 dark:border-gray-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  },
  {
    label: 'Disponíveis',
    value: stats?.available_timeslots ?? 0,
    color: 'text-green-700 dark:text-green-400',
    accent: 'border-green-400 dark:border-green-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  },
  {
    label: 'Reservados',
    value: stats?.reserved_timeslots ?? 0,
    color: 'text-blue-700 dark:text-blue-400',
    accent: 'border-blue-400 dark:border-blue-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 4.5h6m-5-2h4a1 1 0 0 1 1 1v1H9v-1a1 1 0 0 1 1-1Zm-2 3h8a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
  {
    label: 'Lotados',
    value: stats?.full_timeslots ?? 0,
    color: 'text-orange-600 dark:text-orange-400',
    accent: 'border-orange-400 dark:border-orange-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  },
];

const quickLinks = [
  {
    label: 'Gerenciar Cotas',
    description: 'Criar, editar e fechar Cotas da operação.',
    routeName: 'timeslots.index',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-teal-500',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    label: 'Agenda',
    description: 'Ver Cotas anunciados e os clientes que reservaram.',
    routeName: 'admin.agenda',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    label: 'Fretes',
    description: 'Gerenciar operações e reservas de frete.',
    routeName: 'freights.approvalList',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-violet-500',
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
];

function OccupancyChart({ occupancy }) {
  if (!occupancy || occupancy.length === 0) return null;

  const maxCount = Math.max(...occupancy.map((d) => d.count), 1);
  const chartHeight = 120;
  const barWidth = 28;
  const barGap = 12;
  const chartWidth = occupancy.length * (barWidth + barGap) - barGap;
  const paddingTop = 20;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M3 3v18h18M7 16v-4m4 4V9m4 7v-7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ocupação — próximos 7 dias</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Reservas ativas por dia</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight + paddingTop + 32}
          className="min-w-full"
          style={{ minWidth: chartWidth }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight - ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-200 dark:text-gray-700"
              />
            );
          })}

          {occupancy.map((item, i) => {
            const barHeight = maxCount > 0 ? (item.count / maxCount) * chartHeight : 0;
            const x = i * (barWidth + barGap);
            const y = paddingTop + chartHeight - barHeight;
            const isEmpty = item.count === 0;

            return (
              <g key={item.date}>
                <rect
                  x={x}
                  y={isEmpty ? paddingTop + chartHeight - 3 : y}
                  width={barWidth}
                  height={isEmpty ? 3 : barHeight}
                  rx={4}
                  className={isEmpty ? 'fill-gray-200 dark:fill-gray-700' : 'fill-indigo-500 dark:fill-indigo-400'}
                />
                {item.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className="fill-gray-700 dark:fill-gray-300"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {item.count}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400"
                  fontSize="9"
                >
                  {formatDate(item.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard({ stats, occupancy }) {
  return (
    <AuthenticatedLayout
      header={<PageHeader title="Painel do Administrador" subtitle="Visão geral das operações" />}
    >
      <Head title="Painel do Administrador" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards(stats).map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border-l-4 bg-white p-5 shadow-sm dark:bg-gray-800 ${card.accent}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                  <span className={`rounded-lg p-1.5 ${card.iconBg}`}>{card.icon}</span>
                </div>
                <p className={`mt-3 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <OccupancyChart occupancy={occupancy} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={route(link.routeName)}
                className={`group rounded-xl border-t-4 bg-white p-6 shadow-sm transition hover:shadow-md dark:bg-gray-800 ${link.accent}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg p-2 ${link.iconBg}`}>{link.icon}</span>
                  <svg className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{link.label}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
