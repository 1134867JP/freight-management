import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, Link, usePage } from '@inertiajs/react';

const statCards = (stats) => [
  {
    label: 'Total de fretes',
    value: stats?.total_my_freights ?? 0,
    color: 'text-gray-800 dark:text-gray-100',
    accent: 'border-gray-300 dark:border-gray-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  },
  {
    label: 'Carregando',
    value: stats?.loading_my_freights ?? 0,
    color: 'text-amber-700 dark:text-amber-400',
    accent: 'border-amber-400 dark:border-amber-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 3v9m0 0-3-3m3 3 3-3M3 17h18M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
  {
    label: 'Descarregando',
    value: stats?.unloading_my_freights ?? 0,
    color: 'text-blue-700 dark:text-blue-400',
    accent: 'border-blue-400 dark:border-blue-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 21v-9m0 0-3 3m3-3 3 3M3 7h18M5 7V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
  {
    label: 'Finalizados',
    value: stats?.completed_my_freights ?? 0,
    color: 'text-green-700 dark:text-green-400',
    accent: 'border-green-400 dark:border-green-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  },
  {
    label: 'Cancelados',
    value: stats?.cancelled_my_freights ?? 0,
    color: 'text-red-700 dark:text-red-400',
    accent: 'border-red-400 dark:border-red-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  },
  {
    label: 'Cotas disponíveis hoje',
    value: stats?.available_today ?? 0,
    color: 'text-teal-700 dark:text-teal-400',
    accent: 'border-teal-400 dark:border-teal-600',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
  },
];

const quickLinks = [
  {
    label: 'Nova reserva',
    description: 'Visualize as cotas disponíveis e faça uma reserva.',
    routeName: 'client.available',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-teal-500',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    label: 'Meus fretes',
    description: 'Acompanhe o status das suas reservas ativas.',
    routeName: 'client.reservations',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    label: 'Meus caminhões',
    description: 'Cadastre e gerencie as placas usadas nas reservas.',
    routeName: 'client.trucks',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M3 8h11v7H3V8Zm11 2h3l3 3v2h-6v-5ZM7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
    ),
    accent: 'border-t-violet-500',
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
];

function StatCard({ label, value, color }) {
  const border = {
    gray: 'border-gray-400',
    green: 'border-green-500',
    blue: 'border-blue-500',
    orange: 'border-orange-500',
    red: 'border-red-500',
  }[color] || 'border-gray-400';

  const text = {
    gray: 'text-gray-900',
    green: 'text-green-700',
    blue: 'text-blue-700',
    orange: 'text-orange-600',
    red: 'text-red-700',
  }[color] || 'text-gray-900';

  return (
    <div className={`rounded-lg border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${text}`}>{value}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard({ stats }) {
  const { auth } = usePage().props;
  const firstName = auth.user.name.split(' ')[0];
  return (
    <AuthenticatedLayout
      header={
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {greeting()}, <span className="font-semibold text-gray-700 dark:text-gray-200">{firstName}</span>
          </p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Meu Painel</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Resumo das suas operações de frete</p>
        </div>
      }
    >
      <Head title="Meu Painel" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Minhas solicitações" value={stats?.total_my_freights ?? 0} color="gray" />
            <StatCard label="Carregando" value={stats?.loading_my_freights ?? 0} color="orange" />
            <StatCard label="Descarregando" value={stats?.unloading_my_freights ?? 0} color="blue" />
            <StatCard label="Concluídas" value={stats?.completed_my_freights ?? 0} color="green" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={route(link.routeName)}
                className={`group rounded-xl border-t-4 bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50 hover:ring-teal-200 dark:bg-gray-800 ${link.accent}`}
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
