import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatSchedule, formatTons, formatPeriod, plural } from '@/Features/Quota/format';
import { Head, Link, usePage } from '@inertiajs/react';

const ACTION_LABELS = {
  vehicle: 'Informar veículo',
  invoice: 'Enviar NF',
  weight_ticket: 'Enviar comprovante',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(name) {
  return String(name ?? '').trim().split(/\s+/)[0] || '';
}

function SummaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="font-semibold text-pinho-700 underline-offset-4 hover:underline dark:text-pinho-300"
    >
      {children}
    </Link>
  );
}

function SectionTitle({ children, action = null }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-areia-600 dark:text-areia-400">{children}</h2>
      {action}
    </div>
  );
}

function BookingRow({ booking }) {
  return (
    <li>
      <Link
        href={route('client.bookings.show', booking.id)}
        className="flex min-h-[56px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-areia-50 dark:hover:bg-areia-800/60"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">
            {formatSchedule(booking.scheduled_at)}
            <span className="ml-2 font-normal text-areia-500 dark:text-areia-400">{booking.code}</span>
          </p>
          <p className="truncate text-sm text-areia-600 dark:text-areia-400">
            {booking.product_name} → {booking.destination}
          </p>
        </div>
        <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
      </Link>
    </li>
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
      <div className="py-6">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <header>
            <p className="text-[15px] font-semibold uppercase tracking-wide text-pinho-700 dark:text-pinho-300">
              {greeting()}{name ? `, ${name}` : ''}
            </p>
            <p className="mt-2 text-[22px] font-bold leading-snug text-areia-900 sm:text-[26px] dark:text-white">
              Você possui{' '}
              <SummaryLink href={route('client.quotas')}>
                {plural(summary.available_quotas ?? 0, 'cota disponível', 'cotas disponíveis')}
              </SummaryLink>
              <span className="text-areia-400"> · </span>
              <SummaryLink href={route('client.bookings')}>
                {plural(summary.upcoming_bookings ?? 0, 'agendamento próximo', 'agendamentos próximos')}
              </SummaryLink>
              <span className="text-areia-400"> · </span>
              <SummaryLink href={route('client.bookings', { tab: 'pending' })}>
                {plural(summary.pending_actions ?? 0, 'pendência', 'pendências')}
              </SummaryLink>
            </p>
          </header>

          {actionRequired.length > 0 && (
            <section aria-labelledby="acao-necessaria">
              <div className="overflow-hidden rounded-xl border border-ocre-300 border-l-4 border-l-ocre-500 bg-ocre-50 dark:border-ocre-800 dark:border-l-ocre-400 dark:bg-ocre-950/30">
                <h2 id="acao-necessaria" className="px-4 pt-4 text-[13px] font-bold uppercase tracking-wider text-ocre-800 dark:text-ocre-200">
                  Ação necessária
                </h2>
                <ul className="divide-y divide-ocre-200 dark:divide-ocre-900">
                  {actionRequired.map((booking) => {
                    const first = booking.pending_actions[0];
                    return (
                      <li key={booking.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[15px] font-medium text-areia-900 dark:text-areia-100">
                          {first?.label} — <span className="font-semibold">{booking.code}</span> · {formatSchedule(booking.scheduled_at)}
                          {booking.pending_actions.length > 1 && (
                            <span className="block text-sm font-normal text-ocre-800 dark:text-ocre-200">
                              Também falta: {booking.pending_actions.slice(1).map((action) => action.label.toLowerCase()).join(' · ')}
                            </span>
                          )}
                        </p>
                        <Link href={route('client.bookings.show', booking.id)} className="shrink-0">
                          <Button className="w-full sm:w-auto">{ACTION_LABELS[first?.key] ?? 'Resolver'}</Button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          <section aria-labelledby="proximo-agendamento">
            <SectionTitle>
              <span id="proximo-agendamento">Próximo agendamento</span>
            </SectionTitle>
            {nextBooking ? (
              <div className="rounded-2xl border border-pinho-200 bg-pinho-50 p-5 sm:p-6 dark:border-pinho-900 dark:bg-pinho-950/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-[32px] font-bold leading-none text-pinho-900 sm:text-[40px] dark:text-pinho-100">
                    {formatSchedule(nextBooking.scheduled_at)}
                  </p>
                  <StatusBadge label={nextBooking.stage.label} tone={nextBooking.stage.tone} />
                </div>
                <p className="mt-3 text-lg font-semibold text-areia-900 dark:text-white">
                  {nextBooking.product_name} → {nextBooking.destination}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px] sm:grid-cols-4">
                  <div>
                    <dt className="text-[13px] text-areia-600 dark:text-areia-400">Operação</dt>
                    <dd className="font-semibold text-areia-900 dark:text-areia-100">{nextBooking.operation_label}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-areia-600 dark:text-areia-400">Peso</dt>
                    <dd className="font-semibold text-areia-900 dark:text-areia-100">{formatTons(nextBooking.weight)}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-areia-600 dark:text-areia-400">Veículo</dt>
                    <dd className="font-semibold text-areia-900 dark:text-areia-100">{nextBooking.vehicle?.plate ?? 'A informar'}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-areia-600 dark:text-areia-400">Código</dt>
                    <dd className="font-semibold text-areia-900 dark:text-areia-100">{nextBooking.code}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <Link href={route('client.bookings.show', nextBooking.id)}>
                    <Button size="lg" className="w-full sm:w-auto">Ver agendamento</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Card>
                <Card.Content className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-areia-900 dark:text-white">Nenhum agendamento por vir</p>
                    <p className="mt-1 text-[15px] text-areia-600 dark:text-areia-400">
                      Escolha uma das suas cotas e reserve o dia e o horário em poucos toques.
                    </p>
                  </div>
                  <Link href={route('client.quotas')}>
                    <Button>Ver cotas disponíveis</Button>
                  </Link>
                </Card.Content>
              </Card>
            )}
          </section>

          {inProgress.length > 0 && (
            <section>
              <SectionTitle>Em andamento</SectionTitle>
              <Card>
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {inProgress.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
                </ul>
              </Card>
            </section>
          )}

          <section>
            <SectionTitle
              action={(
                <Link href={route('client.quotas')} className="text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
                  Ver todas
                </Link>
              )}
            >
              Minhas cotas
            </SectionTitle>
            <Card>
              {quotas.length === 0 ? (
                <p className="px-4 py-6 text-[15px] text-areia-600 dark:text-areia-400">
                  Você não tem cotas com saldo agora. Avisaremos pelo WhatsApp quando houver novas cotas.
                </p>
              ) : (
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {quotas.map((quota) => (
                    <li key={quota.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                          {quota.product_name} → {quota.destination}
                        </p>
                        <p className="text-sm text-areia-600 dark:text-areia-400">
                          {formatPeriod(quota.starts_on, quota.ends_on)} ·{' '}
                          <span className="font-semibold text-pinho-700 dark:text-pinho-300">
                            {quota.available_for_me} {quota.available_for_me === 1 ? 'disponível' : 'disponíveis'} para você
                          </span>
                        </p>
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
              <SectionTitle
                action={(
                  <Link href={route('client.bookings')} className="text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
                    Ver todos
                  </Link>
                )}
              >
                Próximos agendamentos
              </SectionTitle>
              <Card>
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {upcoming.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
                </ul>
              </Card>
            </section>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
