import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import IconTile from '@/Components/UI/IconTile';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatClock, dateParts } from '@/Features/Quota/format';
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
  const parts = dateParts(booking.scheduled_at);
  const required = Number(booking.documents_required ?? 0);
  const received = Number(booking.documents_received ?? 0);
  const docsPct = required > 0 ? Math.min(Math.round((received / required) * 100), 100) : 0;
  const docsDone = required > 0 && received >= required;

  return (
    <li>
      <Link
        href={route('client.bookings.show', booking.id)}
        className="group flex items-start gap-3.5 px-4 py-4 transition hover:bg-white/50 focus:outline-none focus-visible:bg-areia-50 sm:items-center sm:px-5 dark:hover:bg-areia-800/60 dark:focus-visible:bg-areia-800/60"
      >
        <IconTile tone="brand" size="lg">
          {parts ? (
            <span className="flex flex-col items-center leading-none">
              <span className="text-[20px] tabular-nums">{parts.day}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide">{parts.month}</span>
            </span>
          ) : '—'}
        </IconTile>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-areia-900 dark:text-white">
                {booking.product_name} → {booking.destination}
              </p>
              <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">
                <span className="font-semibold text-areia-700 dark:text-areia-200">{booking.code}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-display font-semibold tabular-nums">{formatClock(booking.scheduled_at)}</span>
              </p>
            </div>
            <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-areia-600 dark:text-areia-400">
            {plate ? <span className="plate text-[13px]">{plate}</span> : <span>Veículo a informar</span>}
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-14 overflow-hidden rounded-full bg-areia-200 dark:bg-areia-700" aria-hidden="true">
                <span className={`block h-full rounded-full ${docsDone ? 'bg-pinho-600 dark:bg-pinho-400' : 'bg-ocre-400'}`} style={{ width: `${docsPct}%` }} />
              </span>
              Documentos {received}/{required}
            </span>
            {hint && (
              <span className="font-semibold text-ocre-800 dark:text-ocre-200">{hint.label}</span>
            )}
          </div>
        </div>

        <svg className="hidden h-5 w-5 shrink-0 self-center text-areia-400 transition group-hover:translate-x-0.5 sm:block dark:text-areia-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
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
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <div>
          <PageHeader
            title="Meus agendamentos"
            actions={(
              <Link href={route('client.quotas')} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Agendar nova cota</Button>
              </Link>
            )}
          />

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div role="tablist" aria-label="Filtrar agendamentos" className="inline-flex min-w-full gap-1 rounded-xl bg-areia-200/60 p-1 sm:min-w-0 dark:bg-areia-800/60">
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
                        ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-700 dark:text-white'
                        : 'text-areia-600 hover:text-areia-900 dark:text-areia-300 dark:hover:text-white',
                    ].join(' ')}
                  >
                    {item.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums ${
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
        </div>

        <Card className="overflow-hidden">
          {bookings.length === 0 ? (
            <EmptyState
              icon={(
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="15" rx="3" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              )}
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
    </AuthenticatedLayout>
  );
}
