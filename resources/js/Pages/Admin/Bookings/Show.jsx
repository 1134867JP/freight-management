import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FormField from '@/Components/UI/FormField';
import ModalShell from '@/Components/UI/ModalShell';
import SectionTitle from '@/Components/UI/SectionTitle';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatSchedule, formatTons } from '@/Features/Quota/format';
import BookingTimeline from '@/Features/Booking/BookingTimeline';
import DocumentChecklist from '@/Features/Booking/DocumentChecklist';
import { formatDateTime, formatPhone, formatPlate, formatWeight } from '@/utils/formatters';

function Field({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-areia-600 dark:text-areia-400">{label}</dt>
      <dd className="min-w-0 text-right text-[15px] font-medium text-areia-900 dark:text-areia-100">
        {children}
      </dd>
    </div>
  );
}

function Pending({ children = 'A informar' }) {
  return <span className="font-medium text-ocre-700 dark:text-ocre-300">{children}</span>;
}

/** Portaria/operação informa o veículo quando o cliente ainda não informou. */
function VehicleForm({ booking, onDone, canCancel }) {
  const { data, setData, patch, processing, errors } = useForm({
    truck_plate: booking.vehicle?.plate ?? '',
    driver_name: booking.vehicle?.driver_name ?? '',
    driver_phone: booking.vehicle?.driver_phone ?? '',
  });

  const submit = (event) => {
    event.preventDefault();
    patch(route('admin.bookings.vehicle', booking.id), { preserveScroll: true, onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <FormField id="admin-plate" label="Placa" error={errors.truck_plate} required>
        <input
          id="admin-plate"
          value={data.truck_plate}
          onChange={(event) => setData('truck_plate', event.target.value.toUpperCase())}
          className={FormField.inputClass(errors.truck_plate, 'mt-1.5 font-mono uppercase')}
          placeholder="ABC1D23"
          autoComplete="off"
        />
      </FormField>
      <FormField id="admin-driver" label="Motorista" error={errors.driver_name} required>
        <input
          id="admin-driver"
          value={data.driver_name}
          onChange={(event) => setData('driver_name', event.target.value)}
          className={FormField.inputClass(errors.driver_name, 'mt-1.5')}
        />
      </FormField>
      <FormField id="admin-driver-phone" label="Telefone do motorista" error={errors.driver_phone}>
        <input
          id="admin-driver-phone"
          type="tel"
          value={data.driver_phone}
          onChange={(event) => setData('driver_phone', event.target.value)}
          className={FormField.inputClass(errors.driver_phone, 'mt-1.5')}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={processing}>
          Salvar veículo
        </Button>
        {canCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <Card>
      <Card.Content>
        <SectionTitle>{title}</SectionTitle>
        {children}
      </Card.Content>
    </Card>
  );
}

function HeroButton({ children, onClick, disabled = false, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10241B] disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === 'danger'
          ? 'bg-white/10 text-tijolo-200 hover:bg-white/15'
          : 'bg-white/10 text-white hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  );
}

function FinalizeModal({ booking, open, onClose }) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    gross_weight: '',
    net_weight: '',
    admin_notes: booking.admin_notes ?? '',
  });

  const submit = (event) => {
    event.preventDefault();
    patch(route('freights.finalize-operation', booking.id), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const declared = booking.weight ? `Declarado: ${formatWeight(booking.weight)}` : undefined;

  return (
    <ModalShell show={open} title="Finalizar operação" onClose={onClose} maxWidthClass="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <FormField
          id="gross_weight"
          label="Peso bruto (kg)"
          error={errors.gross_weight}
          hint={declared}
          required
        >
          <FormField.Input
            id="gross_weight"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={data.gross_weight}
            error={errors.gross_weight}
            onChange={(event) => setData('gross_weight', event.target.value)}
            required
          />
        </FormField>
        <FormField id="net_weight" label="Peso líquido (kg)" error={errors.net_weight} required>
          <FormField.Input
            id="net_weight"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={data.net_weight}
            error={errors.net_weight}
            onChange={(event) => setData('net_weight', event.target.value)}
            required
          />
        </FormField>
        <FormField id="admin_notes" label="Observações" error={errors.admin_notes}>
          <textarea
            id="admin_notes"
            rows={3}
            maxLength={500}
            value={data.admin_notes}
            onChange={(event) => setData('admin_notes', event.target.value)}
            className={`mt-1 block w-full ${FormField.inputClass(errors.admin_notes)}`}
          />
        </FormField>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Voltar
          </Button>
          <Button type="submit" className="flex-1" loading={processing}>
            Finalizar
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function BookingShow({ booking, flow = {} }) {
  const confirm = useConfirm();
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const status = booking.status;
  const isLoad = booking.operation_type === 'load';
  const requiresCheckin = Boolean(flow.uses_gate) && !flow.pilot_mode;
  const isPast = booking.scheduled_at
    ? new Date(booking.scheduled_at).getTime() < Date.now()
    : false;
  const isFinal = ['completed', 'cancelled', 'no_show'].includes(status);

  const mutate = (url, data = {}) => {
    router.patch(url, data, {
      preserveScroll: true,
      onStart: () => setBusy(true),
      onFinish: () => setBusy(false),
    });
  };

  const startUrl = route(isLoad ? 'freights.start-load' : 'freights.start-unload', booking.id);
  const startLabel = isLoad ? 'Iniciar carregamento' : 'Iniciar descarga';

  const needsVehicle = status === 'reserved' && !booking.vehicle?.plate;
  const [editingVehicle, setEditingVehicle] = useState(false);
  const showVehicleForm = Boolean(booking.can?.edit_vehicle) && (needsVehicle || editingVehicle);

  let primary = null;
  let hint = null;
  if (needsVehicle) {
    hint = 'Informe placa e motorista em "Veículo e motorista" para liberar a chegada.';
  } else if (status === 'reserved' && requiresCheckin) {
    primary = {
      label: 'Registrar chegada',
      onClick: () => mutate(route('freights.gate-checkin', booking.id)),
    };
    hint = 'O veículo ainda não chegou. Registre a chegada na portaria.';
  } else if (status === 'reserved' || status === 'arrived') {
    primary = { label: startLabel, onClick: () => mutate(startUrl) };
    hint =
      status === 'arrived'
        ? 'Veículo no pátio, pronto para iniciar.'
        : 'Pode iniciar a operação direto.';
  } else if (status === 'loading' || status === 'unloading') {
    primary = { label: 'Finalizar operação', onClick: () => setFinalizeOpen(true) };
    hint = `${isLoad ? 'Carregamento' : 'Descarga'} em andamento. Informe os pesos para concluir.`;
  }

  const markNoShow = async () => {
    const ok = await confirm(
      `Registrar ${booking.code} como não comparecimento? A cota volta ao saldo e não é possível desfazer.`,
      'Não compareceu',
    );
    if (ok) mutate(route('admin.bookings.no-show', booking.id));
  };

  const cancelBooking = async () => {
    const ok = await confirm(
      `Cancelar o agendamento ${booking.code}? O cliente será avisado e a cota volta ao saldo.`,
      'Cancelar agendamento',
    );
    if (ok) mutate(route('freights.reject', booking.id));
  };

  const showNoShow = Boolean(booking.can?.mark_no_show) && isPast && !isFinal;
  const showCancel = status === 'reserved';
  const contact = booking.client_contact ?? {};
  const hasYard = booking.dock || booking.spot || booking.arrived_at || booking.departed_at;

  return (
    <AuthenticatedLayout>
      <Head title={booking.code} />
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <Link
          href={route('admin.bookings.index')}
          className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="m12 5-5 5 5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Agendamentos
        </Link>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-pinho-800 dark:text-pinho-200">
              {booking.code}
            </h1>
            <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold tabular-nums text-areia-800 dark:text-areia-200">
            {formatSchedule(booking.scheduled_at)}
            <span className="font-normal text-areia-400">·</span>
            <span className="font-medium">{booking.client?.name ?? 'Cliente'}</span>
            {booking.vehicle?.plate && (
              <>
                <span className="font-normal text-areia-400">·</span>
                <span className="plate text-[13px]">{formatPlate(booking.vehicle.plate)}</span>
              </>
            )}
          </p>
          <p className="text-[15px] text-areia-600 dark:text-areia-400">
            {booking.quota ? (
              <Link
                href={route('admin.quotas.show', booking.quota.id)}
                className="font-semibold text-pinho-700 hover:underline dark:text-pinho-300"
              >
                {booking.quota.code} · {booking.quota.product_name} → {booking.quota.destination}
              </Link>
            ) : (
              <span>
                {booking.product_name} → {booking.destination}
              </span>
            )}
            <span className="mx-2 text-areia-400">·</span>
            {booking.operation_label}
          </p>
        </header>

        {/* Próximo passo */}
        <section
          aria-label="Próximo passo"
          className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 ${
            primary
              ? 'bg-[#10241B] text-white shadow-[0_12px_32px_-16px_rgba(16,36,27,0.6)] dark:bg-[#0D1A14] dark:ring-1 dark:ring-white/5'
              : 'border border-areia-200 bg-white shadow-[0_1px_2px_rgba(37,35,32,0.04)] dark:border-areia-800 dark:bg-areia-900'
          }`}
        >
          {primary && (
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pinho-700/30 blur-3xl"
              aria-hidden="true"
            />
          )}
          {primary ? (
            <div className="relative space-y-5">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ocre-300">
                  Próximo passo
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-[-0.01em]">
                  {primary.label}
                </p>
                {hint && <p className="mt-1.5 max-w-xl text-[15px] text-white/75">{hint}</p>}
              </div>
              <button
                type="button"
                onClick={primary.onClick}
                disabled={busy}
                aria-busy={busy}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-ocre-400 px-6 py-3 text-base font-semibold text-pinho-950 shadow-sm transition-colors hover:bg-ocre-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10241B] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[320px]"
              >
                {busy && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {primary.label}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <StatusBadge label={booking.stage?.label} tone={booking.stage?.tone} />
              <p className="text-[15px] text-areia-700 dark:text-areia-300">
                {status === 'completed' && 'Operação concluída. Nenhuma ação pendente.'}
                {status === 'cancelled' && 'Agendamento cancelado. A cota voltou ao saldo.'}
                {status === 'no_show' && 'Cliente não compareceu. A cota voltou ao saldo.'}
              </p>
            </div>
          )}

          {(showNoShow || showCancel) && (
            <div
              className={`relative mt-5 flex flex-wrap gap-2 border-t pt-5 ${
                primary ? 'border-white/10' : 'border-areia-200/80 dark:border-areia-800'
              }`}
            >
              {primary ? (
                <>
                  {showNoShow && (
                    <HeroButton onClick={markNoShow} disabled={busy}>
                      Não compareceu
                    </HeroButton>
                  )}
                  {showCancel && (
                    <HeroButton tone="danger" onClick={cancelBooking} disabled={busy}>
                      Cancelar agendamento
                    </HeroButton>
                  )}
                </>
              ) : (
                <>
                  {showNoShow && (
                    <Button variant="secondary" onClick={markNoShow} disabled={busy}>
                      Não compareceu
                    </Button>
                  )}
                  {showCancel && (
                    <Button variant="danger-subtle" onClick={cancelBooking} disabled={busy}>
                      Cancelar agendamento
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Section title="Documentos">
              <DocumentChecklist
                documents={booking.documents ?? []}
                uploadUrl={route('admin.bookings.documents', booking.id)}
                canUpload
              />
            </Section>

            {(booking.operation_files?.length ?? 0) > 0 && (
              <Section title="Documentos da operação">
                <ul className="divide-y divide-areia-200 dark:divide-areia-800">
                  {booking.operation_files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <a
                        href={file.url}
                        className="min-w-0 break-all text-[15px] font-medium text-pinho-700 underline-offset-2 hover:underline dark:text-pinho-300"
                      >
                        {file.name}
                      </a>
                      <span className="text-sm text-areia-600 dark:text-areia-400">
                        {formatDateTime(file.uploaded_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Pesos">
              <dl className="divide-y divide-areia-200 dark:divide-areia-800">
                <Field label="Declarado">
                  {booking.weight
                    ? `${formatWeight(booking.weight)} (${formatTons(booking.weight)})`
                    : '—'}
                </Field>
                <Field label="Bruto">
                  {booking.gross_weight ? formatWeight(booking.gross_weight) : '—'}
                </Field>
                <Field label="Líquido">
                  {booking.net_weight ? formatWeight(booking.net_weight) : '—'}
                </Field>
              </dl>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Veículo e motorista">
              {showVehicleForm ? (
                <VehicleForm
                  booking={booking}
                  onDone={() => setEditingVehicle(false)}
                  canCancel={!needsVehicle}
                />
              ) : (
                <dl className="divide-y divide-areia-200 dark:divide-areia-800">
                  <Field label="Placa">
                    {booking.vehicle?.plate ? (
                      <span className="plate text-[13px]">
                        {formatPlate(booking.vehicle.plate)}
                      </span>
                    ) : (
                      <Pending />
                    )}
                  </Field>
                  <Field label="Motorista">{booking.vehicle?.driver_name || <Pending />}</Field>
                  <Field label="Telefone">
                    {booking.vehicle?.driver_phone ? (
                      formatPhone(booking.vehicle.driver_phone)
                    ) : (
                      <Pending />
                    )}
                  </Field>
                  <Field label="NF">{booking.invoice_number || <Pending>Pendente</Pending>}</Field>
                </dl>
              )}
              {!showVehicleForm && booking.can?.edit_vehicle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setEditingVehicle(true)}
                >
                  Alterar veículo
                </Button>
              )}
            </Section>

            <Section title="Cliente">
              <dl className="divide-y divide-areia-200 dark:divide-areia-800">
                <Field label="Nome">{booking.client?.name ?? '—'}</Field>
                <Field label="E-mail">
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                      {contact.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </Field>
                <Field label="WhatsApp">
                  {contact.whatsapp ? formatPhone(contact.whatsapp) : '—'}
                </Field>
              </dl>
            </Section>

            {hasYard && (
              <Section title="Pátio">
                <dl className="divide-y divide-areia-200 dark:divide-areia-800">
                  {booking.dock && <Field label="Doca">{booking.dock}</Field>}
                  {booking.spot && <Field label="Vaga">{booking.spot}</Field>}
                  {booking.arrived_at && (
                    <Field label="Chegada">{formatDateTime(booking.arrived_at)}</Field>
                  )}
                  {booking.departed_at && (
                    <Field label="Saída">{formatDateTime(booking.departed_at)}</Field>
                  )}
                </dl>
              </Section>
            )}

            <Section title="Acompanhamento">
              <BookingTimeline
                steps={booking.timeline ?? []}
                cancelled={['cancelled', 'no_show'].includes(status)}
              />
              {booking.admin_notes && (
                <div className="mt-5 border-t border-areia-200 pt-4 dark:border-areia-800">
                  <p className="text-sm text-areia-600 dark:text-areia-400">Observações</p>
                  <p className="mt-1 whitespace-pre-line text-[15px] text-areia-900 dark:text-areia-100">
                    {booking.admin_notes}
                  </p>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      <FinalizeModal booking={booking} open={finalizeOpen} onClose={() => setFinalizeOpen(false)} />
    </AuthenticatedLayout>
  );
}
