import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button, { buttonClassName } from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FlashMessages from '@/Components/UI/FlashMessages';
import IconTile from '@/Components/UI/IconTile';
import SectionTitle from '@/Components/UI/SectionTitle';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatClock, formatPeriod, formatSchedule, formatTons, dateParts } from '@/Features/Quota/format';
import { Head, Link, usePage } from '@inertiajs/react';

const ACTION_LABELS = {
  vehicle: 'Informar veículo',
  invoice: 'Enviar NF',
  weight_ticket: 'Enviar comprovante',
};

const ICON_PROPS = {
  className: 'h-5 w-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function AlertIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 4 3 19h18L12 4Z" />
      <path d="M12 10v4M12 16.8v.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg {...ICON_PROPS} className="h-5 w-5 shrink-0 text-areia-400 dark:text-areia-500">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(name) {
  const first = String(name ?? '').trim().split(/\s+/)[0] || '';
  return first ? first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1).toLocaleLowerCase('pt-BR') : '';
}


function HeroMetric({ href, value, label, tone = 'plain' }) {
  const active = Number(value) > 0;
  const color = !active
    ? 'text-white/40'
    : tone === 'ocre'
      ? 'text-ocre-300'
      : 'text-white';
  return (
    <Link
      href={href}
      className="group block rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-300 sm:p-4"
    >
      <span className={`block font-display text-[34px] font-bold leading-none tabular-nums sm:text-[42px] ${color}`}>{value}</span>
      <span className="mt-2 block text-[13px] font-medium leading-tight text-white/70 group-hover:text-white/90">{label}</span>
    </Link>
  );
}

function BookingRow({ booking }) {
  const parts = dateParts(booking.scheduled_at);
  return (
    <li>
      <Link
        href={route('client.bookings.show', booking.id)}
        className="flex min-h-[64px] items-center gap-3.5 px-4 py-3 transition hover:bg-white/50 focus:outline-none focus-visible:bg-areia-50 dark:hover:bg-areia-800/60 dark:focus-visible:bg-areia-800/60"
      >
        <IconTile tone="brand">
          {parts ? (
            <span className="flex flex-col items-center leading-none">
              <span className="text-[17px]">{parts.day}</span>
              <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide">{parts.month}</span>
            </span>
          ) : '—'}
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">
            {formatSchedule(booking.scheduled_at)}
            <span className="ml-2 font-normal text-areia-500 dark:text-areia-400">{booking.code}</span>
          </p>
          <p className="truncate text-sm text-areia-600 dark:text-areia-400">
            {booking.product_name} → {booking.destination}
          </p>
        </div>
        <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
        <ChevronIcon />
      </Link>
    </li>
  );
}

function NextBookingTicket({ booking }) {
  const parts = dateParts(booking.scheduled_at);
  const plate = booking.vehicle?.plate;
  return (
    <div className="overflow-hidden rounded-2xl border border-pinho-200 bg-white shadow-[0_1px_2px_rgba(37,35,32,0.04),0_8px_24px_-16px_rgba(37,35,32,0.12)] dark:border-pinho-900 dark:bg-areia-900">
      <div className="grid sm:grid-cols-[210px_1fr]">
        <div className="flex flex-col justify-center border-b border-dashed border-pinho-300 bg-pinho-50 px-6 py-5 sm:border-b-0 sm:border-r dark:border-pinho-800 dark:bg-pinho-950/50">
          {parts ? (
            <>
              <p className="text-[13px] font-semibold capitalize text-pinho-800 dark:text-pinho-200">{parts.weekday}</p>
              <p className="mt-1 font-display text-[44px] font-bold leading-none tabular-nums text-pinho-900 dark:text-pinho-100">{parts.short}</p>
              <p className="mt-2 font-display text-[24px] font-bold leading-none tabular-nums text-pinho-700 dark:text-pinho-300">{formatClock(booking.scheduled_at)}</p>
            </>
          ) : (
            <p className="font-display text-[26px] font-bold leading-tight text-pinho-900 dark:text-pinho-100">Horário a definir</p>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-snug text-areia-900 dark:text-white">
                {booking.product_name} → {booking.destination}
              </p>
              <p className="mt-0.5 text-sm text-areia-500 dark:text-areia-400">{booking.code}</p>
            </div>
            <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 text-[15px]">
            <div>
              <dt className="text-[13px] text-areia-600 dark:text-areia-400">Operação</dt>
              <dd className="font-semibold text-areia-900 dark:text-areia-100">{booking.operation_label}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-areia-600 dark:text-areia-400">Peso</dt>
              <dd className="font-semibold text-areia-900 dark:text-areia-100">{formatTons(booking.weight)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-areia-600 dark:text-areia-400">Veículo</dt>
              <dd className="mt-0.5">
                {plate ? (
                  <span className="plate text-sm">{plate}</span>
                ) : (
                  <span className="font-semibold text-ocre-800 dark:text-ocre-200">A informar</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-5">
            <Link href={route('client.bookings.show', booking.id)}>
              <Button size="lg" className="w-full sm:w-auto">Ver agendamento</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home({
  summary = {},
  actionRequired = [],
  nextBooking = null,
  upcoming = [],
  inProgress = [],
  quotas = [],
}) {
  const { auth } = usePage().props;
  const name = firstName(auth?.user?.name);

  return (
    <AuthenticatedLayout>
      <Head title="Início" />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <section aria-label="Resumo" className="glass-dark rounded-3xl p-5 text-white sm:p-8">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[34px]">
            {greeting()}{name ? `, ${name}` : ''}
          </h1>
          <p className="mt-1 text-[15px] text-white/70">Veja o que há de novo nas suas cotas e agendamentos.</p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <HeroMetric href={route('client.quotas')} value={summary.available_quotas ?? 0} label="cotas disponíveis" tone="ocre" />
            <HeroMetric href={route('client.bookings')} value={summary.upcoming_bookings ?? 0} label="agendamentos próximos" />
            <HeroMetric href={route('client.bookings', { tab: 'pending' })} value={summary.pending_actions ?? 0} label="pendências" tone="ocre" />
          </div>

          <Link
            href={route('client.quotas')}
            className={buttonClassName({ variant: 'accent', size: 'lg', className: 'mt-6 w-full sm:w-auto' })}
          >
            Agendar cota
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </section>

        {actionRequired.length > 0 && (
          <section aria-labelledby="acao-necessaria" className="overflow-hidden rounded-2xl border border-ocre-200 bg-ocre-50 dark:border-ocre-900 dark:bg-ocre-950/30">
            <SectionTitle id="acao-necessaria" className="!mb-0 px-5 pt-5 [&_h2]:text-ocre-800 dark:[&_h2]:text-ocre-200">
              Ação necessária
            </SectionTitle>
            <ul className="mt-2 divide-y divide-ocre-200/70 dark:divide-ocre-900/70">
              {actionRequired.map((booking) => {
                const first = booking.pending_actions[0];
                return (
                  <li key={booking.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <IconTile tone="warning"><AlertIcon /></IconTile>
                      <p className="min-w-0 text-[15px] font-medium text-areia-900 dark:text-areia-100">
                        {first?.label} — <span className="font-semibold">{booking.code}</span> · {formatSchedule(booking.scheduled_at)}
                        {booking.pending_actions.length > 1 && (
                          <span className="block text-sm font-normal text-ocre-800 dark:text-ocre-200">
                            Também falta: {booking.pending_actions.slice(1).map((action) => action.label.toLowerCase()).join(' · ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <Link href={route('client.bookings.show', booking.id)} className="shrink-0">
                      <Button className="w-full sm:w-auto">{ACTION_LABELS[first?.key] ?? 'Resolver'}</Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="proximo-agendamento">
          <SectionTitle id="proximo-agendamento">Próximo agendamento</SectionTitle>
          {nextBooking ? (
            <NextBookingTicket booking={nextBooking} />
          ) : (
            <Card>
              <Card.Content className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <IconTile tone="brand" size="lg">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="5" width="16" height="15" rx="3" />
                    <path d="M8 3v4M16 3v4M4 10h16" />
                  </svg>
                </IconTile>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold text-areia-900 dark:text-white">Nenhum agendamento por vir</p>
                  <p className="mt-1 text-[15px] text-areia-600 dark:text-areia-400">
                    Escolha uma das suas cotas e reserve o dia e o horário em poucos toques.
                  </p>
                </div>
                <Link href={route('client.quotas')}>
                  <Button variant="secondary">Ver cotas disponíveis</Button>
                </Link>
              </Card.Content>
            </Card>
          )}
        </section>

        {inProgress.length > 0 && (
          <section>
            <SectionTitle>Em andamento</SectionTitle>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {inProgress.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
              </ul>
            </Card>
          </section>
        )}

        <section>
          <SectionTitle aside={<Link href={route('client.quotas')} className="hover:underline">Ver todas</Link>}>
            Minhas cotas
          </SectionTitle>
          <Card className="overflow-hidden">
            {quotas.length === 0 ? (
              <div className="flex items-center gap-4 px-5 py-6">
                <IconTile tone="neutral" size="lg">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
                  </svg>
                </IconTile>
                <p className="text-[15px] text-areia-600 dark:text-areia-400">
                  Você não tem cotas com saldo agora. Avisaremos pelo WhatsApp quando houver novas cotas.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {quotas.map((quota) => (
                  <li key={quota.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <IconTile tone="brand">{String(quota.product_name ?? '?').charAt(0).toUpperCase()}</IconTile>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                          {quota.product_name} → {quota.destination}
                        </p>
                        <p className="text-sm text-areia-600 dark:text-areia-400">
                          {formatPeriod(quota.starts_on, quota.ends_on)} ·{' '}
                          <span className="font-semibold text-pinho-700 dark:text-pinho-300">
                            {quota.available_for_me} {quota.available_for_me === 1 ? 'disponível' : 'disponíveis'} para você
                          </span>
                        </p>
                      </div>
                    </div>
                    <Link href={route('client.quotas.book', quota.id)} className="shrink-0">
                      <Button variant="soft" className="w-full sm:w-auto">Agendar</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {upcoming.length > 0 && (
          <section>
            <SectionTitle aside={<Link href={route('client.bookings')} className="hover:underline">Ver todos</Link>}>
              Próximos agendamentos
            </SectionTitle>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                {upcoming.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
              </ul>
            </Card>
          </section>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
