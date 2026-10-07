import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
import SectionTitle from '@/Components/UI/SectionTitle';
import { plural } from '@/Features/Quota/format';
import { Head, Link, useForm } from '@inertiajs/react';

const DEFAULT_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];
const BASE_HOURS = Array.from({ length: 18 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`);

const PRESETS = [
  { label: 'Comercial (08–17h)', hours: DEFAULT_HOURS },
  { label: 'Manhã', hours: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde', hours: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
  { label: 'Limpar', hours: [] },
];

const MS_DAY = 86400000;

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function countDays(startsOn, endsOn) {
  if (!startsOn || !endsOn) return 0;
  const [sy, sm, sd] = startsOn.split('-').map(Number);
  const [ey, em, ed] = endsOn.split('-').map(Number);
  const diff = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / MS_DAY) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function sortHours(list) {
  return [...list].sort();
}

function SubTitle({ children, hint = null }) {
  return (
    <div className="mb-3">
      <h3 className="text-[17px] font-semibold text-areia-900 dark:text-white">{children}</h3>
      {hint && <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">{hint}</p>}
    </div>
  );
}

function StepTitle({ number, children }) {
  return (
    <SectionTitle className="!mb-4">
      <span className="flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-pinho-700 font-display text-[13px] font-bold tabular-nums tracking-normal text-white dark:bg-pinho-400 dark:text-areia-950"
          aria-hidden="true"
        >
          {number}
        </span>
        {children}
      </span>
    </SectionTitle>
  );
}

function Chip({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'min-h-12 rounded-lg border px-3 text-base font-semibold tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
        active
          ? 'border-pinho-700 bg-pinho-700 text-white shadow-sm ring-1 ring-pinho-800/20 dark:border-pinho-400 dark:bg-pinho-400 dark:text-areia-950'
          : 'border-areia-300 bg-white text-areia-700 hover:border-areia-400 hover:bg-white/50 dark:border-areia-700 dark:bg-areia-900 dark:text-areia-200 dark:hover:bg-areia-800',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Checkbox({ id, checked, onChange, children }) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium text-areia-800 dark:text-areia-200"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-areia-400 text-pinho-700 focus:ring-ocre-400 dark:border-areia-600 dark:bg-areia-900"
      />
      {children}
    </label>
  );
}

export default function Form({ quota = null, clients = [], products = [], destinations = [] }) {
  const isEdit = Boolean(quota);

  const initialAllocations = (quota?.allocations ?? []).map((a) => ({
    user_id: a.user_id,
    quantity: a.quantity ?? '',
  }));

  const [audience, setAudience] = useState(initialAllocations.length > 0 ? 'selected' : 'all');
  const [clientSearch, setClientSearch] = useState('');

  const form = useForm({
    product_name: quota?.product_name ?? '',
    destination: quota?.destination ?? '',
    operation_type: quota?.operation_type ?? 'unload',
    total_quantity: quota?.usage?.total ?? '',
    expected_weight_tons: quota?.expected_weight_kg
      ? String(Number(quota.expected_weight_kg) / 1000)
      : '',
    starts_on: quota?.starts_on?.slice(0, 10) ?? addDays(0),
    ends_on: quota?.ends_on?.slice(0, 10) ?? addDays(5),
    hours: quota ? sortHours((quota.hours ?? []).map((h) => String(h).slice(0, 5))) : DEFAULT_HOURS,
    slot_capacity: quota?.slot_capacity ?? '',
    allocations: initialAllocations,
    max_per_client: quota?.max_per_client ?? '',
    requires_invoice: quota?.requires_invoice ?? true,
    requires_weight_ticket: quota?.requires_weight_ticket ?? true,
    rules: quota?.rules ?? '',
  });

  const { data, setData, errors, processing } = form;

  const hourOptions = useMemo(
    () => sortHours(Array.from(new Set([...BASE_HOURS, ...data.hours]))),
    [data.hours],
  );

  const total = Number(data.total_quantity) || 0;
  const days = countDays(data.starts_on, data.ends_on);
  const hoursCount = data.hours.length;
  const windows = days * hoursCount;
  const manualCapacity = Number(data.slot_capacity) || 0;
  const autoCapacity = windows > 0 && total > 0 ? Math.ceil(total / windows) : 0;
  const capacity = manualCapacity > 0 ? manualCapacity : autoCapacity;
  const capacityTooLow =
    manualCapacity > 0 && windows > 0 && total > 0 && manualCapacity * windows < total;
  const canPreview = total > 0 && days > 0 && hoursCount > 0;

  const toggleHour = (hour) => {
    setData(
      'hours',
      sortHours(
        data.hours.includes(hour) ? data.hours.filter((h) => h !== hour) : [...data.hours, hour],
      ),
    );
  };

  const allocationIndex = (userId) => data.allocations.findIndex((a) => a.user_id === userId);

  const toggleClient = (userId) => {
    if (allocationIndex(userId) >= 0) {
      setData(
        'allocations',
        data.allocations.filter((a) => a.user_id !== userId),
      );
    } else {
      setData('allocations', [...data.allocations, { user_id: userId, quantity: '' }]);
    }
  };

  const setClientQuantity = (userId, quantity) => {
    setData(
      'allocations',
      data.allocations.map((a) => (a.user_id === userId ? { ...a, quantity } : a)),
    );
  };

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => `${c.name} ${c.email ?? ''}`.toLowerCase().includes(term));
  }, [clients, clientSearch]);

  const allocationErrors = Object.entries(errors)
    .filter(([key]) => key === 'allocations' || key.startsWith('allocations.'))
    .map(([, message]) => message);
  const hoursError =
    errors.hours || Object.entries(errors).find(([key]) => key.startsWith('hours.'))?.[1];

  const submit = (event) => {
    event.preventDefault();
    form.transform((current) => ({
      ...current,
      allocations:
        audience === 'selected'
          ? current.allocations.map((a) => ({
              user_id: a.user_id,
              quantity: a.quantity === '' ? null : a.quantity,
            }))
          : [],
      max_per_client:
        audience === 'all' && current.max_per_client !== '' ? current.max_per_client : null,
    }));

    if (isEdit) {
      form.put(route('admin.quotas.update', quota.id), { preserveScroll: true });
    } else {
      form.post(route('admin.quotas.store'), { preserveScroll: true });
    }
  };

  const cancelHref = isEdit ? route('admin.quotas.show', quota.id) : route('admin.quotas.index');
  const submitLabel = isEdit ? 'Salvar alterações' : 'Publicar cotas';

  const summary = canPreview
    ? `${plural(total, 'carga', 'cargas')} · ${data.product_name || 'Produto'} → ${data.destination || 'Destino'}`
    : 'Preencha produto, destino e quantidade';

  const fieldClass = 'mt-1 block w-full';

  return (
    <AuthenticatedLayout>
      <Head title={isEdit ? `Editar ${quota.code}` : 'Publicar cotas'} />
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <form onSubmit={submit}>
          <div className="mx-auto max-w-3xl">
            <FlashMessages />

            <PageHeader
              eyebrow={isEdit ? quota.code : null}
              title={isEdit ? 'Editar cota' : 'Publicar cotas'}
              subtitle={
                isEdit
                  ? 'Ajuste a cota. Agendamentos já feitos são mantidos.'
                  : 'Defina o que, para onde e quando. Os clientes já podem agendar assim que você publicar.'
              }
            />

            <div className="glass divide-y divide-areia-200 rounded-2xl dark:divide-areia-800">
              {/* 1. O quê */}
              <section className="p-5 sm:p-7" aria-label="O quê">
                <StepTitle number="1">O quê</StepTitle>
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="product_name"
                      label="Produto"
                      error={errors.product_name}
                      required
                    >
                      <input
                        id="product_name"
                        list="quota-products"
                        value={data.product_name}
                        onChange={(e) => setData('product_name', e.target.value)}
                        placeholder="Ex.: Soja"
                        autoComplete="off"
                        autoFocus={!isEdit}
                        className={`${fieldClass} ${FormField.inputClass(errors.product_name)}`}
                      />
                      <datalist id="quota-products">
                        {products.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                    </FormField>
                    <FormField id="destination" label="Destino" error={errors.destination} required>
                      <input
                        id="destination"
                        list="quota-destinations"
                        value={data.destination}
                        onChange={(e) => setData('destination', e.target.value)}
                        placeholder="Ex.: B&8"
                        autoComplete="off"
                        className={`${fieldClass} ${FormField.inputClass(errors.destination)}`}
                      />
                      <datalist id="quota-destinations">
                        {destinations.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </FormField>
                  </div>

                  <div>
                    <span className="block text-[15px] font-semibold text-areia-800 dark:text-areia-200">
                      Operação
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Operação"
                      className="mt-1 inline-flex rounded-xl bg-areia-200/60 p-1 dark:bg-areia-800/60"
                    >
                      {[
                        { key: 'load', label: 'Carga' },
                        { key: 'unload', label: 'Descarga' },
                      ].map((option) => {
                        const active = data.operation_type === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setData('operation_type', option.key)}
                            className={[
                              'min-h-10 min-w-[104px] rounded-lg px-5 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocre-400',
                              active
                                ? 'bg-white text-areia-900 shadow-sm dark:bg-areia-700 dark:text-white'
                                : 'text-areia-600 hover:text-areia-900 dark:text-areia-400 dark:hover:text-white',
                            ].join(' ')}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.operation_type && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm font-medium text-tijolo-700 dark:text-tijolo-300"
                      >
                        {errors.operation_type}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="total_quantity"
                      label="Quantidade de cargas"
                      error={errors.total_quantity}
                      required
                    >
                      <input
                        id="total_quantity"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={data.total_quantity}
                        onChange={(e) => setData('total_quantity', e.target.value)}
                        placeholder="Ex.: 30"
                        className={`${fieldClass} tabular-nums ${FormField.inputClass(errors.total_quantity)}`}
                      />
                    </FormField>
                    <FormField
                      id="expected_weight_tons"
                      label="Toneladas por carga"
                      error={errors.expected_weight_tons}
                      hint="Opcional. Peso esperado de cada carga."
                    >
                      <input
                        id="expected_weight_tons"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.1"
                        value={data.expected_weight_tons}
                        onChange={(e) => setData('expected_weight_tons', e.target.value)}
                        placeholder="Ex.: 32"
                        className={`${fieldClass} tabular-nums ${FormField.inputClass(errors.expected_weight_tons)}`}
                      />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* 2. Quando */}
              <section className="space-y-5 p-5 sm:p-7" aria-label="Quando">
                <StepTitle number="2">Quando</StepTitle>
                <div>
                  <SubTitle>Período</SubTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="starts_on" label="De" error={errors.starts_on} required>
                      <input
                        id="starts_on"
                        type="date"
                        value={data.starts_on}
                        onChange={(e) => setData('starts_on', e.target.value)}
                        className={`${fieldClass} ${FormField.inputClass(errors.starts_on)}`}
                      />
                    </FormField>
                    <FormField id="ends_on" label="Até" error={errors.ends_on} required>
                      <input
                        id="ends_on"
                        type="date"
                        min={data.starts_on || undefined}
                        value={data.ends_on}
                        onChange={(e) => setData('ends_on', e.target.value)}
                        className={`${fieldClass} ${FormField.inputClass(errors.ends_on)}`}
                      />
                    </FormField>
                  </div>
                </div>

                <div>
                  <SubTitle hint="Toque nos horários em que o pátio recebe veículos.">
                    Horários
                  </SubTitle>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        size="sm"
                        variant="soft"
                        onClick={() => setData('hours', preset.hours)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                    {hourOptions.map((hour) => (
                      <Chip
                        key={hour}
                        active={data.hours.includes(hour)}
                        onClick={() => toggleHour(hour)}
                      >
                        {hour}
                      </Chip>
                    ))}
                  </div>
                  {hoursError && (
                    <p
                      role="alert"
                      className="mt-2 text-sm font-medium text-tijolo-700 dark:text-tijolo-300"
                    >
                      {hoursError}
                    </p>
                  )}
                </div>

                <div>
                  <FormField
                    id="slot_capacity"
                    label="Veículos por horário"
                    error={errors.slot_capacity}
                    hint="Opcional. Se ficar vazio, calculamos para distribuir todas as cargas."
                    className="max-w-xs"
                  >
                    <input
                      id="slot_capacity"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={data.slot_capacity}
                      onChange={(e) => setData('slot_capacity', e.target.value)}
                      placeholder={autoCapacity > 0 ? `Automático (${autoCapacity})` : 'Automático'}
                      className={`${fieldClass} tabular-nums ${FormField.inputClass(errors.slot_capacity)}`}
                    />
                  </FormField>

                  <div
                    className={[
                      'mt-4 flex items-start gap-3 rounded-xl px-4 py-3.5 text-[15px]',
                      capacityTooLow
                        ? 'bg-ocre-50 text-ocre-900 ring-1 ring-inset ring-ocre-200 dark:bg-ocre-900/30 dark:text-ocre-100 dark:ring-ocre-800'
                        : 'bg-pinho-50 text-pinho-900 ring-1 ring-inset ring-pinho-100 dark:bg-pinho-950/40 dark:text-pinho-100 dark:ring-pinho-900',
                    ].join(' ')}
                    aria-live="polite"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {capacityTooLow ? (
                        <path d="M12 4 3 20h18L12 4zM12 10v4M12 17h.01" />
                      ) : (
                        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                      )}
                    </svg>
                    <div className="min-w-0">
                      {canPreview ? (
                        <>
                          <p>
                            <strong className="tabular-nums">{total}</strong>{' '}
                            {total === 1 ? 'carga' : 'cargas'} em{' '}
                            <strong className="tabular-nums">{days}</strong>{' '}
                            {days === 1 ? 'dia' : 'dias'} ×{' '}
                            <strong className="tabular-nums">{hoursCount}</strong>{' '}
                            {hoursCount === 1 ? 'horário' : 'horários'} ={' '}
                            <strong className="tabular-nums">{windows}</strong>{' '}
                            {windows === 1 ? 'janela' : 'janelas'} ·{' '}
                            <strong className="tabular-nums">{capacity}</strong>{' '}
                            {capacity === 1 ? 'veículo' : 'veículos'} por horário
                          </p>
                          {capacityTooLow && (
                            <p className="mt-1 font-semibold">
                              A capacidade dos horários não comporta todas as cotas.
                            </p>
                          )}
                        </>
                      ) : (
                        <p>
                          Informe a quantidade, o período e os horários para ver como as cargas
                          serão distribuídas.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Quem */}
              <section className="p-5 sm:p-7" aria-label="Quem">
                <StepTitle number="3">Quem</StepTitle>
                <div role="radiogroup" aria-label="Quem pode agendar" className="space-y-1">
                  {[
                    { key: 'all', label: 'Todos os clientes' },
                    { key: 'selected', label: 'Somente clientes selecionados' },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium text-areia-800 dark:text-areia-200"
                    >
                      <input
                        type="radio"
                        name="audience"
                        checked={audience === option.key}
                        onChange={() => setAudience(option.key)}
                        className="h-5 w-5 border-areia-400 text-pinho-700 focus:ring-ocre-400 dark:border-areia-600 dark:bg-areia-900"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                {audience === 'all' ? (
                  <FormField
                    id="max_per_client"
                    label="Limite por cliente"
                    error={errors.max_per_client}
                    hint="Opcional. Máximo de cargas que um mesmo cliente pode reservar."
                    className="mt-3 max-w-xs"
                  >
                    <input
                      id="max_per_client"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={data.max_per_client}
                      onChange={(e) => setData('max_per_client', e.target.value)}
                      placeholder="Sem limite"
                      className={`${fieldClass} tabular-nums ${FormField.inputClass(errors.max_per_client)}`}
                    />
                  </FormField>
                ) : (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="search"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente por nome ou e-mail"
                        aria-label="Buscar cliente"
                        className={`min-w-0 flex-1 ${FormField.inputClass(false)}`}
                      />
                      <span className="text-sm text-areia-600 dark:text-areia-400">
                        {plural(data.allocations.length, 'selecionado', 'selecionados')}
                      </span>
                    </div>

                    <ul className="mt-3 max-h-80 divide-y divide-areia-200 overflow-y-auto rounded-lg border border-areia-200 dark:divide-areia-800 dark:border-areia-800">
                      {filteredClients.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-areia-600 dark:text-areia-400">
                          {clients.length === 0
                            ? 'Nenhum cliente cadastrado.'
                            : 'Nenhum cliente encontrado.'}
                        </li>
                      )}
                      {filteredClients.map((client) => {
                        const index = allocationIndex(client.id);
                        const selected = index >= 0;
                        return (
                          <li
                            key={client.id}
                            className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 ${selected ? 'bg-pinho-50/60 dark:bg-pinho-950/30' : ''}`}
                          >
                            <div className="min-w-0 flex-1">
                              <Checkbox
                                id={`client-${client.id}`}
                                checked={selected}
                                onChange={() => toggleClient(client.id)}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate">{client.name}</span>
                                  {client.email && (
                                    <span className="block truncate text-[13px] font-normal text-areia-500 dark:text-areia-400">
                                      {client.email}
                                    </span>
                                  )}
                                </span>
                              </Checkbox>
                            </div>
                            {selected && (
                              <div className="ml-8 w-full sm:ml-0 sm:w-44">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  value={data.allocations[index].quantity}
                                  onChange={(e) => setClientQuantity(client.id, e.target.value)}
                                  placeholder="Saldo (sem limite)"
                                  aria-label={`Saldo de ${client.name}`}
                                  className={`w-full tabular-nums ${FormField.inputClass(errors[`allocations.${index}.quantity`])}`}
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-sm text-areia-600 dark:text-areia-400">
                      Deixe o saldo vazio para não limitar as cargas daquele cliente.
                    </p>
                    {allocationErrors.length > 0 && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm font-medium text-tijolo-700 dark:text-tijolo-300"
                      >
                        {Array.from(new Set(allocationErrors)).join(' ')}
                      </p>
                    )}
                    {data.allocations.length === 0 && (
                      <p className="mt-1.5 text-sm font-medium text-ocre-700 dark:text-ocre-300">
                        Selecione ao menos um cliente, ou volte para &quot;Todos os clientes&quot;.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* 4. Exigências */}
              <section className="space-y-5 p-5 sm:p-7" aria-label="Exigências">
                <StepTitle number="4">Exigências</StepTitle>
                <div>
                  <SubTitle hint="O cliente precisará enviar estes documentos no agendamento.">
                    Documentos exigidos
                  </SubTitle>
                  <div className="flex flex-col gap-x-8 sm:flex-row">
                    <Checkbox
                      id="requires_invoice"
                      checked={data.requires_invoice}
                      onChange={(e) => setData('requires_invoice', e.target.checked)}
                    >
                      Nota fiscal
                    </Checkbox>
                    <Checkbox
                      id="requires_weight_ticket"
                      checked={data.requires_weight_ticket}
                      onChange={(e) => setData('requires_weight_ticket', e.target.checked)}
                    >
                      Comprovante de peso
                    </Checkbox>
                  </div>
                </div>

                <FormField
                  id="rules"
                  label="Regras"
                  error={errors.rules}
                  hint="Opcional. Aparece para o cliente antes de agendar."
                >
                  <textarea
                    id="rules"
                    rows={3}
                    value={data.rules}
                    onChange={(e) => setData('rules', e.target.value)}
                    placeholder="Ex.: chegar com 30 min de antecedência; lona obrigatória"
                    className={`${fieldClass} ${FormField.inputClass(errors.rules)}`}
                  />
                </FormField>
              </section>
            </div>

            {/* Barra fixa de ação */}
            <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-areia-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-areia-800 dark:bg-areia-900/90 sm:mx-0 sm:rounded-2xl sm:border sm:shadow-[0_8px_30px_-8px_rgba(37,35,32,0.25)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={`min-w-0 truncate text-[15px] ${canPreview ? 'font-semibold text-areia-900 dark:text-white' : 'text-areia-600 dark:text-areia-400'}`}
                >
                  {summary}
                  {canPreview && (
                    <span className="ml-2 font-normal text-areia-600 dark:text-areia-400">
                      ·{' '}
                      {audience === 'selected'
                        ? plural(data.allocations.length, 'cliente', 'clientes')
                        : 'todos os clientes'}
                    </span>
                  )}
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Link href={cancelHref}>
                    <Button variant="ghost" className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" size="lg" loading={processing} className="w-full sm:w-auto">
                    {submitLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
