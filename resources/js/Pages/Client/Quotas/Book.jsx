import React, { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FlashMessages from '@/Components/UI/FlashMessages';
import FormField from '@/Components/UI/FormField';
import { formatPeriod, formatTons, formatWeekdayDate, plural } from '@/Features/Quota/format';
import { Head, Link, useForm } from '@inertiajs/react';

const OTHER = '__other';

function StepTitle({ n, children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-areia-900 dark:text-white">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pinho-700 text-sm font-bold text-white dark:bg-pinho-400 dark:text-areia-950">
        {n}
      </span>
      {children}
    </h2>
  );
}

export default function Book({ quota, days = [], trucks = [], drivers = [] }) {
  const available = quota.available_for_me ?? 0;

  const firstOpenDay = days.find((day) => day.free > 0)?.date ?? null;
  const [selectedDate, setSelectedDate] = useState(firstOpenDay);
  const [vehicleLater, setVehicleLater] = useState(false);
  const [truckChoice, setTruckChoice] = useState('');
  const [driverChoice, setDriverChoice] = useState('');

  const { data, setData, post, processing, errors, transform } = useForm({
    timeslot_id: '',
    quantity: 1,
    truck_plate: '',
    driver_name: '',
    driver_phone: '',
    invoice_number: '',
    weight_tons: quota.expected_weight_kg ? String(Number(quota.expected_weight_kg) / 1000) : '',
  });

  const day = useMemo(() => days.find((item) => item.date === selectedDate) ?? null, [days, selectedDate]);
  const slot = useMemo(
    () => day?.slots.find((item) => item.id === data.timeslot_id) ?? null,
    [day, data.timeslot_id],
  );

  const maxQuantity = Math.max(1, Math.min(available, slot?.free ?? available));
  const quantity = Number(data.quantity) || 1;
  const single = quantity === 1;
  const showVehicle = single && !vehicleLater;

  // Quando o servidor devolve novas vagas (ex.: horário lotou), limpa a escolha inválida.
  useEffect(() => {
    if (data.timeslot_id && !slot) {
      setData('timeslot_id', '');
    } else if (slot && slot.free === 0) {
      setData('timeslot_id', '');
    }
    if (selectedDate && !days.some((item) => item.date === selectedDate && item.free > 0)) {
      setSelectedDate(days.find((item) => item.free > 0)?.date ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    if (quantity > maxQuantity) setData('quantity', maxQuantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxQuantity]);

  const pickDate = (date) => {
    setSelectedDate(date);
    setData('timeslot_id', '');
  };

  const changeQuantity = (next) => setData('quantity', Math.min(Math.max(next, 1), maxQuantity));

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
    if (!slot) return;
    transform((form) => ({
      timeslot_id: form.timeslot_id,
      quantity: Number(form.quantity),
      truck_plate: showVehicle ? form.truck_plate || null : null,
      driver_name: showVehicle ? form.driver_name || null : null,
      driver_phone: showVehicle ? form.driver_phone || null : null,
      invoice_number: single ? form.invoice_number || null : null,
      weight_tons: form.weight_tons || null,
    }));
    post(route('client.quotas.book.store', quota.id), { preserveScroll: true });
  };

  const showTruckInput = trucks.length === 0 || truckChoice === OTHER;
  const showDriverInput = drivers.length === 0 || driverChoice === OTHER;

  return (
    <AuthenticatedLayout>
      <Head title="Agendar cota" />
      <div className="py-6">
        <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <div>
            <Link href={route('client.quotas')} className="text-[15px] font-semibold text-pinho-700 hover:underline dark:text-pinho-300">
              ← Cotas disponíveis
            </Link>
          </div>

          {/* (a) Resumo */}
          <header className="rounded-2xl border border-pinho-200 bg-pinho-50 p-5 dark:border-pinho-900 dark:bg-pinho-950/40">
            <p className="text-[22px] font-bold leading-snug text-pinho-900 dark:text-pinho-100">
              Você possui {plural(available, 'cota disponível', 'cotas disponíveis')}
            </p>
            <p className="mt-2 text-lg font-semibold text-areia-900 dark:text-white">
              {quota.product_name} → {quota.destination}
            </p>
            <p className="mt-0.5 text-[15px] text-areia-700 dark:text-areia-300">
              {quota.operation_label} · {formatPeriod(quota.starts_on, quota.ends_on)}
              {quota.expected_weight_kg ? ` · ${formatTons(quota.expected_weight_kg)} por carga` : ''}
            </p>
          </header>

          {available === 0 && (
            <p className="rounded-lg border border-ocre-300 bg-ocre-50 p-4 text-[15px] font-medium text-ocre-900 dark:border-ocre-800 dark:bg-ocre-950/30 dark:text-ocre-100">
              Você não tem saldo nesta cota no momento.
            </p>
          )}

          {/* (b) Dia */}
          <section>
            <StepTitle n={1}>Escolha o dia</StepTitle>
            {days.length === 0 ? (
              <p className="text-[15px] text-areia-600 dark:text-areia-400">Nenhum horário disponível nesta cota.</p>
            ) : (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Dia">
                {days.map((item) => {
                  const disabled = item.free === 0;
                  const active = item.date === selectedDate;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={disabled}
                      onClick={() => pickDate(item.date)}
                      className={[
                        'flex min-h-[64px] shrink-0 flex-col items-center justify-center rounded-xl border px-4 py-2 text-center transition',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                        active
                          ? 'border-pinho-700 bg-pinho-700 text-white dark:border-pinho-400 dark:bg-pinho-400 dark:text-areia-950'
                          : disabled
                            ? 'cursor-not-allowed border-areia-200 bg-areia-100 text-areia-400 line-through dark:border-areia-800 dark:bg-areia-900 dark:text-areia-600'
                            : 'border-areia-300 bg-white text-areia-900 hover:border-pinho-500 dark:border-areia-700 dark:bg-areia-900 dark:text-areia-100',
                      ].join(' ')}
                    >
                      <span className="text-[15px] font-bold capitalize">{formatWeekdayDate(item.date)}</span>
                      <span className="text-[13px] font-medium opacity-90">
                        {disabled ? 'Sem vagas' : plural(item.free, 'vaga', 'vagas')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* (c) Horário */}
          {day && (
            <section>
              <StepTitle n={2}>Escolha o horário</StepTitle>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Horário">
                {day.slots.map((item) => {
                  const full = item.free === 0;
                  const active = item.id === data.timeslot_id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={full}
                      onClick={() => setData('timeslot_id', item.id)}
                      className={[
                        'flex min-h-[56px] items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                        active
                          ? 'border-pinho-700 bg-pinho-50 ring-2 ring-pinho-700 dark:border-pinho-400 dark:bg-pinho-950/50 dark:ring-pinho-400'
                          : full
                            ? 'cursor-not-allowed border-areia-200 bg-areia-100 text-areia-400 dark:border-areia-800 dark:bg-areia-900 dark:text-areia-600'
                            : 'border-areia-300 bg-white hover:border-pinho-500 dark:border-areia-700 dark:bg-areia-900',
                      ].join(' ')}
                    >
                      <span className={`text-xl font-bold ${full ? '' : 'text-areia-900 dark:text-white'}`}>{item.time}</span>
                      <span className={`text-[15px] font-medium ${full ? '' : active ? 'text-pinho-800 dark:text-pinho-200' : 'text-pinho-700 dark:text-pinho-300'}`}>
                        {full ? 'ocupado' : `disponível (${plural(item.free, 'vaga', 'vagas')})`}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.timeslot_id && (
                <p role="alert" className="mt-2 text-sm font-medium text-tijolo-700 dark:text-tijolo-300">{errors.timeslot_id}</p>
              )}
            </section>
          )}

          {/* (d) Quantidade */}
          {slot && (
            <section>
              <StepTitle n={3}>Quantidade</StepTitle>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-areia-300 bg-white dark:border-areia-700 dark:bg-areia-900">
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Diminuir quantidade"
                    className="flex h-14 w-14 items-center justify-center text-2xl font-bold text-areia-800 hover:bg-areia-100 disabled:opacity-40 dark:text-areia-100 dark:hover:bg-areia-800"
                  >
                    −
                  </button>
                  <span className="w-14 text-center text-2xl font-bold text-areia-900 dark:text-white" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    aria-label="Aumentar quantidade"
                    className="flex h-14 w-14 items-center justify-center text-2xl font-bold text-areia-800 hover:bg-areia-100 disabled:opacity-40 dark:text-areia-100 dark:hover:bg-areia-800"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-areia-600 dark:text-areia-400">
                  Máximo de {plural(maxQuantity, 'cota', 'cotas')} neste horário.
                </p>
              </div>
              {errors.quantity && (
                <p role="alert" className="mt-2 text-sm font-medium text-tijolo-700 dark:text-tijolo-300">{errors.quantity}</p>
              )}
            </section>
          )}

          {/* (e)(f) Veículo, NF e peso */}
          {slot && (
            <section>
              <StepTitle n={4}>Detalhes <span className="text-sm font-normal text-areia-500">(opcional)</span></StepTitle>
              <Card>
                <Card.Content className="space-y-5 p-5">
                  {single ? (
                    showVehicle ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[15px] font-bold text-areia-900 dark:text-white">Veículo e motorista</h3>
                          <button
                            type="button"
                            onClick={() => setVehicleLater(true)}
                            className="text-[15px] font-semibold text-pinho-700 underline-offset-2 hover:underline dark:text-pinho-300"
                          >
                            Informar depois
                          </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            {trucks.length > 0 && (
                              <FormField id="truck-select" label="Veículo" error={!showTruckInput ? errors.truck_plate : undefined}>
                                <FormField.Select id="truck-select" value={truckChoice} onChange={(e) => pickTruck(e.target.value)}>
                                  <option value="">Selecione…</option>
                                  {trucks.map((truck) => (
                                    <option key={truck.id} value={truck.plate}>
                                      {truck.plate}{truck.model ? ` — ${truck.model}` : ''}
                                    </option>
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
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[15px] text-areia-700 dark:text-areia-300">Veículo e motorista: você informa depois, até a chegada.</p>
                        <button
                          type="button"
                          onClick={() => setVehicleLater(false)}
                          className="text-[15px] font-semibold text-pinho-700 underline-offset-2 hover:underline dark:text-pinho-300"
                        >
                          Informar agora
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="rounded-lg bg-aco-50 p-3 text-[15px] text-aco-900 dark:bg-aco-950/40 dark:text-aco-100">
                      Você informa placa e motorista de cada agendamento depois, até a chegada.
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {single && (
                      <FormField id="invoice-number" label="Número da NF" error={errors.invoice_number} hint={quota.requires_invoice ? 'Você poderá enviar o arquivo depois.' : undefined}>
                        <FormField.Input
                          id="invoice-number"
                          value={data.invoice_number}
                          onChange={(e) => setData('invoice_number', e.target.value)}
                          maxLength={60}
                          placeholder="Ex.: 000123456"
                          error={errors.invoice_number}
                        />
                      </FormField>
                    )}
                    <FormField id="weight-tons" label="Peso previsto (t)" error={errors.weight_tons}>
                      <FormField.Input
                        id="weight-tons"
                        type="number"
                        step="0.01"
                        min="0.1"
                        inputMode="decimal"
                        value={data.weight_tons}
                        onChange={(e) => setData('weight_tons', e.target.value)}
                        error={errors.weight_tons}
                      />
                    </FormField>
                  </div>
                </Card.Content>
              </Card>
            </section>
          )}

          {/* (g) Confirmação */}
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-areia-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border dark:border-areia-800 dark:bg-areia-900/95">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100" aria-live="polite">
                {slot
                  ? `${plural(quantity, 'cota', 'cotas')} · ${formatWeekdayDate(day.date)} às ${slot.time} · ${quota.destination}`
                  : 'Escolha o dia e o horário para continuar.'}
              </p>
              <Button type="submit" size="lg" loading={processing} disabled={!slot || available === 0} className="w-full sm:w-auto">
                Confirmar agendamento
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
