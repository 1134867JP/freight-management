import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

// ─── stat cards ──────────────────────────────────────────────────────────────

const STAT_CARDS = (stats) => [
  {
    label: 'Cotas anunciadas',
    value: stats?.total_timeslots ?? 0,
    delta: null,
    accent: 'border-gray-300 dark:border-gray-600',
    valueColor: 'text-gray-800 dark:text-gray-100',
    iconBg: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path d="M6 2v2.5M14 2v2.5M2 8h16M4 4.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Disponíveis',
    value: stats?.available_timeslots ?? 0,
    accent: 'border-emerald-400 dark:border-emerald-600',
    valueColor: 'text-emerald-700 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Reservados',
    value: stats?.reserved_timeslots ?? 0,
    accent: 'border-sky-400 dark:border-sky-600',
    valueColor: 'text-sky-700 dark:text-sky-400',
    iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path d="M8 3.5h4M7 3h6a1 1 0 0 1 1 1v1H6V4a1 1 0 0 1 1-1ZM5 6h10a1.5 1.5 0 0 1 1.5 1.5V16A1.5 1.5 0 0 1 15 17.5H5A1.5 1.5 0 0 1 3.5 16V7.5A1.5 1.5 0 0 1 5 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Lotados',
    value: stats?.full_timeslots ?? 0,
    accent: 'border-orange-400 dark:border-orange-600',
    valueColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
        <path d="M10 7v4M10 13.5v.5M2 15L10 2l8 13H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ─── quick links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    label: 'Painel do Pátio',
    description: 'Status ao vivo das docas com atualização automática.',
    routeName: 'admin.yard-board',
    accent: 'border-t-teal-500',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    badge: 'Ao vivo',
    badgeColor: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 3h7v7H3V3Zm0 11h7v7H3v-7Zm11-11h7v7h-7V3Zm0 11h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Portaria',
    description: 'Check-in e check-out de veículos na portaria.',
    routeName: 'admin.gate',
    accent: 'border-t-amber-500',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    badge: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M3 12V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M9 12v4m6-4v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Gerenciar Cotas',
    description: 'Criar, editar e fechar cotas da operação.',
    routeName: 'timeslots.index',
    accent: 'border-t-indigo-500',
    iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    badge: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Agenda',
    description: 'Visualize cotas anunciados e reservas dos clientes.',
    routeName: 'admin.agenda',
    accent: 'border-t-violet-500',
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    badge: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Fretes',
    description: 'Gerenciar operações e reservas de frete.',
    routeName: 'freights.approvalList',
    accent: 'border-t-rose-500',
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    badge: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Relatórios',
    description: 'Exporte dados de cotas e fretes em planilha.',
    routeName: 'reports.admin.freights',
    accent: 'border-t-gray-400',
    iconBg: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    badge: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l4-8 4 5 3-3 4 6M3 21h18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ─── occupancy chart ──────────────────────────────────────────────────────────

function OccupancyChart({ occupancy }) {
  if (!occupancy?.length) return null;

  const maxCount = Math.max(...occupancy.map((d) => d.count), 1);
  const chartH = 110;
  const barW = 32;
  const gap = 10;
  const chartW = occupancy.length * (barW + gap) - gap;
  const padTop = 24;

  const formatDate = (s) => {
    const d = new Date(s + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                <path d="M2 15l4-8 4 5 3-3 4 6H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ocupação — próximos 7 dias</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reservas ativas por dia</p>
            </div>
          </div>
          <Link
            href={route('reports.admin.timeslots')}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            Ver relatório →
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto px-6 py-5">
        <svg width={chartW} height={chartH + padTop + 36} style={{ minWidth: chartW }}>
          {[0, 0.25, 0.5, 0.75, 1].map((r) => {
            const y = padTop + chartH - r * chartH;
            return (
              <line key={r} x1={0} y1={y} x2={chartW} y2={y}
                stroke="currentColor" strokeWidth="0.5"
                className="text-gray-100 dark:text-gray-700" />
            );
          })}
          {occupancy.map((item, i) => {
            const bh = maxCount > 0 ? (item.count / maxCount) * chartH : 0;
            const x = i * (barW + gap);
            const y = padTop + chartH - bh;
            const isEmpty = item.count === 0;
            return (
              <g key={item.date}>
                <rect
                  x={x} y={isEmpty ? padTop + chartH - 4 : y}
                  width={barW} height={isEmpty ? 4 : bh}
                  rx={6}
                  className={isEmpty ? 'fill-gray-100 dark:fill-gray-700' : 'fill-teal-500 dark:fill-teal-400'}
                />
                {item.count > 0 && (
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                    className="fill-gray-600 dark:fill-gray-300" fontSize="11" fontWeight="700">
                    {item.count}
                  </text>
                )}
                <text x={x + barW / 2} y={padTop + chartH + 20} textAnchor="middle"
                  className="fill-gray-400 dark:fill-gray-500" fontSize="10">
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

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Dashboard({ stats, occupancy }) {
  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">CargoHub</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Painel do Administrador</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Visão geral das operações</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href={route('admin.yard-board')}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              Painel do Pátio
            </Link>
            <Link
              href={route('admin.gate')}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M2 8V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4M2 8v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8M6 8v2.5M10 8v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Portaria
            </Link>
          </div>
        </div>
      }
    >
      <Head title="Painel — CargoHub" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

          {/* stat cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {STAT_CARDS(stats).map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700/50 ${card.accent}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                  <span className={`rounded-xl p-2 ${card.iconBg}`}>{card.icon}</span>
                </div>
                <p className={`mt-4 text-4xl font-black tabular-nums ${card.valueColor}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* chart */}
          <OccupancyChart occupancy={occupancy} />

          {/* quick links */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Acesso rápido</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={route(link.routeName)}
                  className={`group relative rounded-2xl border-t-4 bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:-translate-y-0.5 dark:bg-gray-800 dark:ring-gray-700/50 ${link.accent}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`rounded-xl p-2.5 transition group-hover:scale-105 ${link.iconBg}`}>{link.icon}</span>
                    {link.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${link.badgeColor}`}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-gray-900 dark:text-gray-100">{link.label}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{link.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 transition group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400">
                    Acessar
                    <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
