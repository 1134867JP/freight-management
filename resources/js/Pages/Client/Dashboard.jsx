import MetricCard from '@/Components/Dashboard/MetricCard';
import QuickActionCard from '@/Components/Dashboard/QuickActionCard';
import SectionHeading from '@/Components/Dashboard/SectionHeading';
import Card from '@/Components/UI/Card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const PATHS = {
  truck: 'M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  loading: 'M12 3v9m0 0-3-3m3 3 3-3M3 17h18M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2',
  unloading: 'M12 21v-9m0 0-3 3m3-3 3 3M3 7h18M5 7V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2',
  check: 'm5 12 4 4L19 6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  close: 'm16 8-8 8m0-8 8 8M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  calendar: 'M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z',
  plus: 'M12 5v14M5 12h14',
  driver: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PATHS[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard({ stats }) {
  const { auth } = usePage().props;
  const firstName = auth.user.name.split(' ')[0];
  const activeFreights = Number(stats?.loading_my_freights ?? 0) + Number(stats?.unloading_my_freights ?? 0);

  return (
    <AuthenticatedLayout>
      <Head title="Meu painel" />

      <div className="py-6">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Visão geral</p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white">Meus agendamentos</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {greeting()}, {firstName}. Acompanhe reservas, horários e fretes em andamento.
              </p>
            </div>
            <Link href={route('client.available')} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-brand-700 bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:border-brand-800 hover:bg-brand-800 sm:self-auto">
              <Icon name="plus" className="h-4 w-4" />
              Nova reserva
            </Link>
          </section>

          <section aria-label="Resumo dos fretes" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 lg:gap-4">
            <MetricCard label="Total de fretes" value={stats?.total_my_freights ?? 0} tone="neutral" icon={<Icon name="truck" />} />
            <MetricCard label="Carregando" value={stats?.loading_my_freights ?? 0} tone="warning" icon={<Icon name="loading" />} />
            <MetricCard label="Descarregando" value={stats?.unloading_my_freights ?? 0} tone="brand" icon={<Icon name="unloading" />} />
            <MetricCard label="Finalizados" value={stats?.completed_my_freights ?? 0} tone="success" icon={<Icon name="check" />} />
            <MetricCard label="Cancelados" value={stats?.cancelled_my_freights ?? 0} tone="danger" icon={<Icon name="close" />} />
            <MetricCard label="Horários hoje" value={stats?.available_today ?? 0} tone="violet" icon={<Icon name="calendar" />} detail="Disponíveis agora" />
          </section>

          <section className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <Card.Content className="h-full">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Em andamento</span>
                  <p className="mt-3 text-4xl font-bold tabular-nums tracking-[-0.04em] text-slate-950 dark:text-white">{activeFreights}</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">frete(s) em operação</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Acompanhe os status ativos e identifique rapidamente o que exige atenção.
                  </p>
                  <Link href={route('client.reservations')} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                    Ver acompanhamento <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Card.Content>
            </Card>

            <div className="lg:col-span-3">
              <SectionHeading title="Acessos rápidos" description="Rotinas mais usadas para gerenciar seus agendamentos." />
              <div className="grid gap-3 sm:grid-cols-3">
                <QuickActionCard href={route('client.available')} title="Novo agendamento" description="Escolha uma janela disponível para sua operação." tone="brand" icon={<Icon name="plus" />} />
                <QuickActionCard href={route('client.reservations')} title="Meus fretes" description="Consulte status, horários e histórico." tone="success" icon={<Icon name="truck" />} />
                <QuickActionCard href={route('client.drivers')} title="Motoristas" description="Mantenha os dados da equipe atualizados." tone="violet" icon={<Icon name="driver" />} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
