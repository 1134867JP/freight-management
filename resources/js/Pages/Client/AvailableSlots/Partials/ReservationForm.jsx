import React, { useState } from 'react';
import { getTruckTypeLabel, normalizeTruckPlate } from '@/Features/Truck/utils/truckTypes';
import FormField from '@/Components/UI/FormField';
import ModalShell from '@/Components/UI/ModalShell';
import Button from '@/Components/UI/Button';
import { useClientValidation } from '@/hooks/useClientValidation';
import { isValidBrPlate } from '@/utils/validation';

function StepIndicator({ step }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        step >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
      }`}>1</div>
      <div className={`h-px flex-1 ${step >= 2 ? 'bg-brand-400' : 'bg-gray-200'}`} />
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        step >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
      }`}>2</div>
      <span className="ml-1 text-xs text-gray-400">
        {step === 1 ? 'Veículo & Motorista' : 'Detalhes da Carga'}
      </span>
    </div>
  );
}

export default function ReservationForm({
  show,
  selectedSlot,
  data,
  setData,
  onChangeOperationType,
  errors,
  processing,
  trucks,
  drivers,
  onSubmit,
  onClose,
  onOpenTruckModal,
}) {
  const [step, setStep] = useState(1);
  const [step1Errors, setStep1Errors] = useState({});

  const blModeloAberta = !selectedSlot?.modelo || selectedSlot?.modelo === 'aberta';
  const blTemProduto = selectedSlot?.modelo === 'por_produto' || selectedSlot?.modelo === 'por_produto_doca';
  const blTemDoca = selectedSlot?.modelo === 'por_produto_doca';
  const blNeedsStep2 = blModeloAberta || data.operation_type === 'unload';

  const activeDrivers = Array.isArray(drivers) ? drivers.filter((d) => d.is_active) : [];

  const { clientErrors, validate, clearClientError } = useClientValidation({
    truck_plate: (value) => {
      if (!value) return 'Selecione um caminhão.';
      if (!isValidBrPlate(value)) return 'Placa inválida.';
      return null;
    },
    driver_name: (value) => {
      if (!value || value.trim().length < 3)
        return 'Nome do motorista deve ter ao menos 3 caracteres.';
      return null;
    },
    cargo_description: (value) => {
      if (!blModeloAberta) return null;
      if (!value || value.trim().length < 3)
        return 'Descrição da carga deve ter ao menos 3 caracteres.';
      return null;
    },
    invoice_path: (value, formData) => {
      if (formData.operation_type === 'unload' && !value)
        return 'Nota fiscal é obrigatória para descarga.';
      return null;
    },
  });

  if (!selectedSlot) return null;

  const allErrors = { ...clientErrors, ...step1Errors, ...errors };

  const handleDriverSelect = (driverId) => {
    if (!driverId) return;
    const driver = activeDrivers.find((d) => String(d.id) === String(driverId));
    if (!driver) return;
    setData((prev) => ({
      ...prev,
      driver_name: driver.nome,
      driver_phone: driver.phone ?? '',
    }));
    clearClientError('driver_name');
    clearClientError('driver_phone');
  };

  const handleNext = () => {
    const errs = {};
    if (!data.truck_plate || !isValidBrPlate(data.truck_plate))
      errs.truck_plate = data.truck_plate ? 'Placa inválida.' : 'Selecione um caminhão.';
    if (!data.driver_name || data.driver_name.trim().length < 3)
      errs.driver_name = 'Nome do motorista deve ter ao menos 3 caracteres.';
    setStep1Errors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;
    onSubmit(event);
  };

  const handleClose = () => {
    setStep(1);
    setStep1Errors({});
    onClose();
  };

  const nrRemaining = Math.max(selectedSlot.capacity - selectedSlot.current_reservations, 0);
  const slotTime = new Date(selectedSlot.start_time).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <ModalShell
      show={show}
      title="Confirmar Reserva"
      onClose={handleClose}
      maxWidthClass="max-w-lg"
    >
      {/* slot summary */}
      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Horário selecionado
            </p>
            <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{slotTime}</p>
            {blTemProduto && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  {selectedSlot.produto?.nome}
                </span>
                {blTemDoca && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {selectedSlot.doca?.nome}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{nrRemaining}</p>
            <p className="text-[11px] text-gray-500">vaga(s)</p>
          </div>
        </div>
      </div>

      <StepIndicator step={step} />

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            {/* operation type */}
            <FormField label="Tipo de operação" error={allErrors.operation_type} required>
              <FormField.Select
                error={allErrors.operation_type}
                value={data.operation_type}
                onChange={(e) => onChangeOperationType(e.target.value)}
                required
              >
                {selectedSlot.operation_type !== 'unload' && <option value="load">↑ Carga</option>}
                {selectedSlot.operation_type !== 'load' && <option value="unload">↓ Descarga</option>}
              </FormField.Select>
            </FormField>

            {/* truck selector */}
            <FormField label="Caminhão" error={allErrors.truck_plate} required>
              <div className="flex gap-2">
                <FormField.Select
                  error={allErrors.truck_plate}
                  className="mt-0 flex-1"
                  value={data.truck_plate}
                  onChange={(e) => {
                    setData('truck_plate', normalizeTruckPlate(e.target.value));
                    clearClientError('truck_plate');
                  }}
                  required
                >
                  <option value="">Selecione um caminhão</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.plate}>
                      {t.plate} — {getTruckTypeLabel(t.type)}{t.model ? ` (${t.model})` : ''}
                    </option>
                  ))}
                </FormField.Select>
                <Button
                  onClick={onOpenTruckModal}
                  title="Adicionar novo caminhão"
                  className="shrink-0"
                >
                  +
                </Button>
              </div>
            </FormField>

            {/* driver quick-select */}
            {activeDrivers.length > 0 && (
              <FormField label="Motorista cadastrado" hint="Preenche nome e WhatsApp automaticamente">
                <FormField.Select
                  value=""
                  onChange={(e) => handleDriverSelect(e.target.value)}
                >
                  <option value="">— selecione para preencher —</option>
                  {activeDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}{d.phone ? ` · ${d.phone}` : ''}
                    </option>
                  ))}
                </FormField.Select>
              </FormField>
            )}

            {/* driver name */}
            <FormField label="Nome do Motorista" error={allErrors.driver_name} required>
              <FormField.Input
                type="text"
                error={allErrors.driver_name}
                value={data.driver_name}
                onChange={(e) => {
                  setData('driver_name', e.target.value);
                  clearClientError('driver_name');
                }}
                required
              />
            </FormField>

            {/* driver phone */}
            <FormField label="WhatsApp do Motorista" error={allErrors.driver_phone} hint="QR Code será enviado para este número">
              <FormField.Input
                type="tel"
                error={allErrors.driver_phone}
                value={data.driver_phone}
                onChange={(e) => {
                  setData('driver_phone', e.target.value);
                  clearClientError('driver_phone');
                }}
                placeholder="Ex: 11999990000"
              />
            </FormField>

            {/* navigation */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleClose}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              {blNeedsStep2 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1"
                >
                  Próximo →
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={processing}
                  className="flex-1"
                >
                  Confirmar Reserva
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* cargo description — only for "aberta" model */}
            {blModeloAberta && (
              <FormField label="Descrição da Carga" error={allErrors.cargo_description} required>
                <FormField.Input
                  type="text"
                  error={allErrors.cargo_description}
                  value={data.cargo_description}
                  onChange={(e) => {
                    setData('cargo_description', e.target.value);
                    clearClientError('cargo_description');
                  }}
                  placeholder="Ex: Bobinas de aço"
                  required
                />
              </FormField>
            )}

            {/* weight */}
            <FormField label="Peso (Toneladas)" error={allErrors.weight} hint="Opcional">
              <FormField.Input
                type="number"
                step="0.1"
                min="0"
                error={allErrors.weight}
                value={data.weight}
                onChange={(e) => setData('weight', e.target.value)}
                placeholder="Ex: 25.5"
              />
            </FormField>

            {/* invoice — only for unload */}
            {data.operation_type === 'unload' && (
              <FormField label="Nota Fiscal" error={allErrors.invoice_path} required hint="PDF, JPG ou PNG — máx. 10MB">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={`mt-1 block w-full ${FormField.inputClass(allErrors.invoice_path)}`}
                  onChange={(e) => {
                    setData('invoice_path', e.target.files?.[0] || null);
                    clearClientError('invoice_path');
                  }}
                  required
                />
              </FormField>
            )}

            {/* navigation */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setStep(1)}
                variant="secondary"
                className="flex-1"
              >
                ← Voltar
              </Button>
              <Button
                type="submit"
                loading={processing}
                className="flex-1"
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
