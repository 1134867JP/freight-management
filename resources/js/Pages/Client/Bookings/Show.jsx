import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FlashMessages from '@/Components/UI/FlashMessages';
import FormField from '@/Components/UI/FormField';
import IconTile from '@/Components/UI/IconTile';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import BookingTimeline from '@/Features/Booking/BookingTimeline';
import DocumentChecklist from '@/Features/Booking/DocumentChecklist';
import { formatClock, formatSchedule, formatTons } from '@/Features/Quota/format';
import { formatDate, formatDateTime, formatPhone } from '@/utils/formatters';
import QrCodeDisplay from '@/Components/UI/QrCodeDisplay';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

const OTHER = '__other';

function Section({ title, aside = null, children }) {
  return (
    <Card>
      <Card.Header className="flex min-h-[60px] flex-wrap items-center justify-between gap-2 !py-3 [&_h2]:font-display [&_h2]:!text-base [&_h2]:!font-bold [&_h2]:text-areia-900 dark:[&_h2]:text-white">
        <h2>{title}</h2>
        {aside}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-pinho-200 py-2 last:border-0 dark:border-pinho-900">
      <dt className="text-[15px] text-pinho-800 dark:text-pinho-200">{label}</dt>
      <dd className="text-right font-display text-[17px] font-bold text-pinho-950 dark:text-white">{value}</dd>
    </div>
  );
}

function VehicleForm({ booking, trucks, drivers }) {
  const currentPlate = booking.vehicle?.plate ?? '';
  const [truckChoice, setTruckChoice] = useState(
    currentPlate ? (trucks.some((truck) => truck.plate === currentPlate) ? currentPlate : OTHER) : '',
  );
  const [driverChoice, setDriverChoice] = useState(() => {
    const name = booking.vehicle?.driver_name;
    if (!name) return '';
    const match = drivers.find((driver) => driver.nome === name);
    return match ? String(match.id) : OTHER;
  });

  const { data, setData, patch, processing, errors } = useForm({
    truck_plate: currentPlate,
    driver_name: booking.vehicle?.driver_name ?? '',
    driver_phone: booking.vehicle?.driver_phone ?? '',
  });

  const showTruckInput = trucks.length === 0 || truckChoice === OTHER;
  const showDriverInput = drivers.length === 0 || driverChoice === OTHER;

  const pickTruck = (value) => {
    setTruckChoice(value);
    setData('truck_plate', value === OTHER ? '' : value);
  };

  const pickDriver = (value) => {
    setDriverChoice(value);
    if (value === OTHER || value === '') {
      setData((current) => ({ ...current, driver_name: '', driver_phone: '' }));
      return;
    }
    const driver = drivers.find((item) => String(item.id) === value);
    setData((current) => ({ ...current, driver_name: driver?.nome ?? '', driver_phone: driver?.phone ?? '' }));
  };

  const submit = (event) => {
    event.preventDefault();
    patch(route('client.bookings.vehicle', booking.id), { preserveScroll: true });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          {trucks.length > 0 && (
            <FormField id="truck-select" label="Veículo" error={!showTruckInput ? errors.truck_plate : undefined}>
              <FormField.Select id="truck-select" value={truckChoice} onChange={(e) => pickTruck(e.target.value)}>
                <option value="">Selecione…</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.plate}>{truck.plate}{truck.model ? ` — ${truck.model}` : ''}</option>
                ))}
                <option value={OTHER}>Digitar outra placa…</option>
              </FormField.Select>
            </FormField>
          )}
          {showTruckInput && (
            <FormField id="truck-plate" label={trucks.length > 0 ? 'Placa' : 'Placa do veículo'} error={errors.truck_plate} className={trucks.length > 0 ? 'mt-3' : ''}>
              <FormField.Input
                id="truck-plate"
                value={data.truck_plate}
                onChange={(e) => setData('truck_plate', e.target.value.toUpperCase())}
                maxLength={10}
                autoCapitalize="characters"
                placeholder="ABC1D23"
                error={errors.truck_plate}
              />
            </FormField>
          )}
        </div>
        <div>
          {drivers.length > 0 && (
            <FormField id="driver-select" label="Motorista" error={!showDriverInput ? errors.driver_name : undefined}>
              <FormField.Select id="driver-select" value={driverChoice} onChange={(e) => pickDriver(e.target.value)}>
                <option value="">Selecione…</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={String(driver.id)}>{driver.nome}</option>
                ))}
                <option value={OTHER}>Digitar outro motorista…</option>
              </FormField.Select>
            </FormField>
          )}
          {showDriverInput && (
            <div className={`space-y-3 ${drivers.length > 0 ? 'mt-3' : ''}`}>
              <FormField id="driver-name" label="Nome do motorista" error={errors.driver_name}>
                <FormField.Input
                  id="driver-name"
                  value={data.driver_name}
                  onChange={(e) => setData('driver_name', e.target.value)}
                  maxLength={100}
                  error={errors.driver_name}
                />
              </FormField>
              <FormField id="driver-phone" label="Telefone do motorista" error={errors.driver_phone}>
                <FormField.Input
                  id="driver-phone"
                  type="tel"
                  inputMode="tel"
                  value={data.driver_phone}
                  onChange={(e) => setData('driver_phone', e.target.value)}
                  maxLength={20}
                  placeholder="(51) 99999-9999"
                  error={errors.driver_phone}
                />
              </FormField>
            </div>
          )}
        </div>
      </div>
      <Button type="submit" loading={processing} className="w-full sm:w-auto">Salvar veículo e motorista</Button>
    </form>
  );
}

export default function Show({ booking, justConfirmed = 0, trucks = [], drivers = [] }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);

  const cancelled = ['cancelled', 'no_show'].includes(booking.status);
  const pending = booking.pending_actions ?? [];
  const docsComplete = booking.documents_required > 0 && booking.documents_received >= booking.documents_required;
  const hasVehicle = Boolean(booking.vehicle?.plate);
  const canEditVehicle = booking.can?.edit_vehicle;
  const company = usePage().props.auth?.company;
  // Mesmo critério do WhatsApp: QR de entrada só quando a portaria usa fila e fora do piloto.
  const showGateCode = Boolean(company?.uses_queues) && !company?.pilot_mode
    && Boolean(booking.qr_token) && ['reserved', 'arrived'].includes(booking.status) && hasVehicle;

  const cancelBooking = async () => {
    const ok = await confirm(
      `Deseja cancelar o agendamento ${booking.code}? A cota volta para o seu saldo quando o cancelamento for permitido.`,
      'Cancelar agendamento',
    );
    if (ok) router.delete(route('client.reservations.cancel', booking.id));
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Agendamento ${booking.code}`} />
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <FlashMessages />

          <Link href={route('client.bookings')} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
            Meus agendamentos
          </Link>

          {justConfirmed > 0 && (
            <section className="overflow-hidden rounded-2xl border border-pinho-200 bg-pinho-50 shadow-[0_8px_24px_-16px_rgba(16,36,27,0.35)] dark:border-pinho-900 dark:bg-pinho-950/40" aria-live="polite">
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pinho-700 text-white dark:bg-pinho-400 dark:text-areia-950" aria-hidden="true">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-[22px] font-bold leading-tight text-pinho-900 sm:text-[26px] dark:text-pinho-100">Agendamento confirmado.</h2>
                  <p className="mt-1 font-display text-[28px] font-bold leading-none tracking-wide text-pinho-700 tabular-nums dark:text-pinho-300">{booking.code}</p>
                </div>
              </div>
              <div className="border-t-2 border-dashed border-pinho-300 px-5 pb-5 pt-2 sm:px-6 dark:border-pinho-800">
                <dl>
                  <ReceiptRow label="Código" value={booking.code} />
                  <ReceiptRow label="Data" value={booking.scheduled_at ? formatDate(booking.scheduled_at) : '—'} />
                  <ReceiptRow label="Horário" value={formatClock(booking.scheduled_at)} />
                  <ReceiptRow label="Destino" value={booking.destination} />
                  <ReceiptRow label="Quantidade" value={formatTons(booking.weight, '1 carga')} />
                </dl>
                {justConfirmed > 1 && (
                  <p className="mt-3 text-[15px] font-medium text-pinho-800 dark:text-pinho-200">
                    Os demais agendamentos estão em{' '}
                    <Link href={route('client.bookings')} className="underline">Meus agendamentos</Link>.
                  </p>
                )}
              </div>
            </section>
          )}

          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.01em] text-areia-900 dark:text-white">{booking.code}</h1>
              <StatusBadge label={booking.stage.label} tone={booking.stage.tone} />
            </div>
            <p className="font-display text-[24px] font-bold leading-tight text-pinho-800 dark:text-pinho-200">{formatSchedule(booking.scheduled_at)}</p>
            <p className="text-lg text-areia-700 dark:text-areia-300">
              {booking.product_name} → {booking.destination} · {booking.operation_label}
            </p>
          </header>

          {pending.length > 0 && (
            <div className="flex items-start gap-3.5 rounded-2xl border border-ocre-200 bg-ocre-50 p-4 sm:p-5 dark:border-ocre-900 dark:bg-ocre-950/30">
              <IconTile tone="warning">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4 3 19h18L12 4Z" />
                  <path d="M12 10v4M12 16.8v.2" />
                </svg>
              </IconTile>
              <div className="min-w-0">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ocre-800 dark:text-ocre-200">O que falta</p>
                <ul className="mt-1.5 space-y-1">
                  {pending.map((action) => (
                    <li key={action.key} className="text-[15px] font-medium text-areia-900 dark:text-areia-100">{action.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showGateCode && (
            <Section title="Código de entrada na portaria">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-areia-50 px-5 py-6 text-center dark:bg-areia-800/40">
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-areia-200">
                  <QrCodeDisplay value={booking.qr_token} size={200} />
                </div>
                <p className="plate text-lg">{booking.vehicle.plate}</p>
                <p className="text-sm text-areia-600 dark:text-areia-400">Apresente este código ao porteiro para o check-in rápido.</p>
              </div>
            </Section>
          )}

          <Section
            title="Veículo e motorista"
            aside={canEditVehicle && !editing && hasVehicle ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Alterar</Button>
            ) : null}
          >
            {canEditVehicle && (editing || !hasVehicle) ? (
              <div className="space-y-3">
                {!hasVehicle && (
                  <p className="text-[15px] text-areia-600 dark:text-areia-400">Informe a placa e o motorista até a chegada.</p>
                )}
                <VehicleForm booking={booking} trucks={trucks} drivers={drivers} />
                {editing && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Fechar</Button>}
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-[15px]">
                <div>
                  <dt className="text-[13px] text-areia-600 dark:text-areia-400">Placa</dt>
                  <dd className={`mt-0.5 font-semibold ${hasVehicle ? 'text-areia-900 dark:text-white' : 'text-ocre-800 dark:text-ocre-200'}`}>
                    {hasVehicle ? <span className="plate text-base">{booking.vehicle.plate}</span> : 'A informar'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-areia-600 dark:text-areia-400">Motorista</dt>
                  <dd className={`font-semibold ${booking.vehicle?.driver_name ? 'text-areia-900 dark:text-white' : 'text-ocre-800 dark:text-ocre-200'}`}>
                    {booking.vehicle?.driver_name ?? 'A informar'}
                    {booking.vehicle?.driver_phone && (
                      <span className="block text-sm font-normal text-areia-600 dark:text-areia-400">{formatPhone(booking.vehicle.driver_phone)}</span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </Section>

          <Section
            title="Documentos"
            aside={(
              <span className={`text-[15px] font-semibold ${docsComplete ? 'text-pinho-700 dark:text-pinho-300' : 'text-ocre-800 dark:text-ocre-200'}`}>
                {docsComplete ? '✓ Documentação completa' : `${booking.documents_received} de ${booking.documents_required} recebidos`}
              </span>
            )}
          >
            <DocumentChecklist
              documents={booking.documents}
              uploadUrl={route('client.bookings.documents', booking.id)}
              canUpload={booking.can?.upload}
            />
            {booking.operation_files?.length > 0 && (
              <div className="mt-5 border-t border-areia-200 pt-4 dark:border-areia-800">
                <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">Documentos enviados pela empresa</p>
                <ul className="mt-2 space-y-1.5">
                  {booking.operation_files.map((file) => (
                    <li key={file.id} className="text-[15px]">
                      <a href={file.url} className="font-medium text-pinho-700 underline-offset-2 hover:underline dark:text-pinho-300">
                        {file.name}
                      </a>
                      <span className="ml-2 text-sm text-areia-500">{formatDateTime(file.uploaded_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section title="Acompanhamento">
            <BookingTimeline steps={booking.timeline} cancelled={cancelled} />
          </Section>

          <Section title="Pesos">
            <dl className="grid grid-cols-3 gap-4 text-[15px]">
              <div>
                <dt className="text-[13px] text-areia-600 dark:text-areia-400">Declarado</dt>
                <dd className="font-semibold text-areia-900 dark:text-white">{formatTons(booking.weight)}</dd>
              </div>
              {booking.net_weight != null && (
                <div>
                  <dt className="text-[13px] text-areia-600 dark:text-areia-400">Líquido</dt>
                  <dd className="font-semibold text-areia-900 dark:text-white">{formatTons(booking.net_weight)}</dd>
                </div>
              )}
              {booking.gross_weight != null && (
                <div>
                  <dt className="text-[13px] text-areia-600 dark:text-areia-400">Bruto</dt>
                  <dd className="font-semibold text-areia-900 dark:text-white">{formatTons(booking.gross_weight)}</dd>
                </div>
              )}
            </dl>
          </Section>

          {booking.quota_rules && (
            <details className="glass rounded-2xl px-5 py-3.5">
              <summary className="cursor-pointer text-[15px] font-semibold text-areia-800 dark:text-areia-200">Regras da cota</summary>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">{booking.quota_rules}</p>
            </details>
          )}

          {booking.can?.cancel && (
            <div className="border-t border-areia-200 pt-6 dark:border-areia-800">
              <Button variant="danger-subtle" onClick={cancelBooking} className="w-full sm:w-auto">Cancelar agendamento</Button>
            </div>
          )}
      </div>
    </AuthenticatedLayout>
  );
}
