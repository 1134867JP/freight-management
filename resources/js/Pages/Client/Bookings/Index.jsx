import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatSchedule } from '@/Features/Quota/format';
import { Head, Link, router } from '@inertiajs/react';

const TABS = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'pending', label: 'Pendências' },
  { key: 'done', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

const EMPTY = {
  upcoming: {
    title: 'Você não tem agendamentos próximos',
    description: 'Escolha uma cota e reserve um horário em poucos toques.',
  },
  pending: {
    title: 'Nenhuma pendência',
    description: 'Tudo certo: não há veículo ou documento esperando por você.',
  },
  done: {
    title: 'Nenhum agendamento concluído ainda',
    description: 'Os agendamentos finalizados aparecem aqui.',
  },
  cancelled: {
    title: 'Nenhum agendamento cancelado',
    description: 'Cancelamentos e ausências aparecem aqui.',
  },
};

function BookingItem({ booking }) {
  const plate = booking.vehicle?.plate;
  const hint = booking.pending_actions?.[0];

  return (
    <li>
      <Link
        href={route('client.bookings.show', booking.id)}
        className="block px-4 py-4 transition hover:bg-areia-50 focus:outline-none focus-visible:bg-areia-50 dark:hover:bg-areia-800/60 dark:focus-visible:bg-areia-800/60"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-[17px] font-bold text-areia-900 dark:text-white">
              {formatSchedule(booking.scheduled_at)}
              <span className="ml-2 text-sm font-medium text-areia-500 dark:text-areia-400">{booking.code}</span>
            </p>
            <p className="mt-0.5 text-[15px] text-areia-700 dark:text-areia-300">
              {booking.product_name} → {booking.destination}
            </p>
          </div>
          <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-areia-600 dark:text-areia-400">
          <span className={plate ? 'font-semibold text-areia-800 dark:text-areia-200' : ''}>{plate ?? 'Veículo a informar'}</span>
          <span>Documentos {booking.documents_received}/{booking.documents_required}</span>
          {hint && (
            <span className="font-semibold text-ocre-800 dark:text-ocre-200">{hint.label}</span>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function BookingsIndex({ tab = 'upcoming', bookings = [], counts = {} }) {
  const selectTab = (key) => {
    if (key === tab) return;
    router.get(route('client.bookings'), { tab: key }, { preserveScroll: true, preserveState: true });
  };

  const empty = EMPTY[tab] ?? EMPTY.upcoming;

  return (
    <AuthenticatedLayout>
      <Head title="Meus agendamentos" />
      <div className="py-6">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[15px] font-semibold text-pinho-700 dark:text-pinho-300">Agendamentos</p>
              <h1 className="text-[28px] font-bold leading-tight text-areia-900 dark:text-white">Meus agendamentos</h1>
            </div>
            <Link href={route('client.quotas')}>
              <Button className="w-full sm:w-auto">Agendar nova cota</Button>
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div role="tablist" aria-label="Filtrar agendamentos" className="inline-flex min-w-full gap-1 rounded-xl bg-areia-200/70 p-1 sm:min-w-0 dark:bg-areia-800">
              {TABS.map((item) => {
                const active = item.key === tab;
                const count = counts[item.key] ?? 0;
                const attention = item.key === 'pending' && count > 0;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectTab(item.key)}
                    className={[
                      'flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-[15px] font-semibold transition',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                      active
                        ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-950 dark:text-white'
                        : 'text-areia-600 hover:text-areia-900 dark:text-areia-300 dark:hover:text-white',
                    ].join(' ')}
                  >
                    {item.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${
                        attention
                          ? 'bg-ocre-200 text-ocre-900 dark:bg-ocre-800 dark:text-ocre-100'
                          : 'bg-areia-100 text-areia-600 dark:bg-areia-800 dark:text-areia-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card>
            {bookings.length === 0 ? (
              <EmptyState
                title={empty.title}
                description={empty.description}
                action={tab === 'upcoming' ? (
                  <Link href={route('client.quotas')}><Button>Ver cotas disponíveis</Button></Link>
                ) : null}
              />
            ) : (
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {bookings.map((booking) => <BookingItem key={booking.id} booking={booking} />)}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
