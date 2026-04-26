import React, { useEffect } from 'react';
import { getTruckTypeLabel, normalizeTruckPlate } from '@/Features/Truck/utils/truckTypes';
import FormField from '@/Components/UI/FormField';
import { useClientValidation } from '@/hooks/useClientValidation';
import { isValidBrPlate } from '@/utils/validation';

export default function ReservationForm({
  selectedSlot,
  data,
  setData,
  onChangeOperationType,
  errors,
  processing,
  trucks,
  onSubmit,
  onOpenTruckModal,
  className = '',
}) {
  if (!selectedSlot) return null;

  const blModeloAberta = !selectedSlot.modelo || selectedSlot.modelo === 'aberta';
  const blTemProduto = selectedSlot.modelo === 'por_produto' || selectedSlot.modelo === 'por_produto_doca';
  const blTemDoca = selectedSlot.modelo === 'por_produto_doca';

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
    cargo_description: (value, formData) => {
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

  const allErrors = { ...clientErrors, ...errors };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;
    onSubmit(event);
  };

  const nrRemaining = Math.max(selectedSlot.capacity - selectedSlot.current_reservations, 0);

  return (
    <div className={`h-fit w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Confirmação de Reserva</p>
        <h3 className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {new Date(selectedSlot.start_time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </h3>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Disponibilidade</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{nrRemaining}</span>
          <span className="text-sm text-emerald-700 dark:text-emerald-400">vaga(s) de {selectedSlot.capacity}</span>
        </div>
      </div>

      {/* Badge do modelo */}
      {blTemProduto && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-800 dark:text-purple-300">
            Produto: {selectedSlot.produto?.nome ?? '—'}
          </span>
          {blTemDoca && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
              Doca: {selectedSlot.doca?.nome ?? '—'}
            </span>
          )}
        </div>
      )}

      {selectedSlot.dropoff_address ? (
        <div className="mb-4 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Endereço de Descarga:</p>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{selectedSlot.dropoff_address.name}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {selectedSlot.dropoff_address.street}, {selectedSlot.dropoff_address.number}
            {selectedSlot.dropoff_address.complement &&
              ` (${selectedSlot.dropoff_address.complement})`}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {selectedSlot.dropoff_address.neighborhood} - {selectedSlot.dropoff_address.city}/
            {selectedSlot.dropoff_address.state}
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3">
          <p className="text-sm italic text-gray-600 dark:text-gray-400">Endereço de descarga não informado</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tipo de operação" error={allErrors.operation_type} required>
          <FormField.Select
            error={allErrors.operation_type}
            value={data.operation_type}
            onChange={(event) => onChangeOperationType(event.target.value)}
            required
          >
            {selectedSlot.operation_type !== 'unload' && <option value="load">Carga</option>}
            {selectedSlot.operation_type !== 'load' && <option value="unload">Descarga</option>}
          </FormField.Select>
        </FormField>

        <FormField label="Caminhão" error={allErrors.truck_plate} required>
          <div className="mt-1 flex gap-2">
            <select
              className={`flex-1 ${FormField.inputClass(allErrors.truck_plate)}`}
              aria-invalid={Boolean(allErrors.truck_plate)}
              value={data.truck_plate}
              onChange={(event) => {
                setData('truck_plate', normalizeTruckPlate(event.target.value));
                clearClientError('truck_plate');
              }}
              required
            >
              <option value="">Selecione um caminhão</option>
              {trucks.map((objTruck) => (
                <option key={objTruck.id} value={objTruck.plate}>
                  {objTruck.plate} - {getTruckTypeLabel(objTruck.type)}{' '}
                  {objTruck.model ? `(${objTruck.model})` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenTruckModal}
              title="Adicionar novo caminhão"
              className="inline-flex items-center justify-center rounded-md border border-green-600 bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              +
            </button>
          </div>
        </FormField>

        <FormField label="Nome do Motorista" error={allErrors.driver_name} required>
          <FormField.Input
            type="text"
            error={allErrors.driver_name}
            value={data.driver_name}
            onChange={(event) => {
              setData('driver_name', event.target.value);
              clearClientError('driver_name');
            }}
            required
          />
        </FormField>

        {/* Descrição da carga: apenas no modelo aberta */}
        {blModeloAberta && (
          <FormField label="Carga (Descrição)" error={allErrors.cargo_description} required>
            <FormField.Input
              type="text"
              error={allErrors.cargo_description}
              value={data.cargo_description}
              onChange={(event) => {
                setData('cargo_description', event.target.value);
                clearClientError('cargo_description');
              }}
              required
            />
          </FormField>
        )}

        <FormField label="Peso (Toneladas)" error={allErrors.weight}>
          <FormField.Input
            type="number"
            step="0.1"
            error={allErrors.weight}
            value={data.weight}
            onChange={(event) => setData('weight', event.target.value)}
          />
        </FormField>

        {data.operation_type === 'unload' && (
          <FormField
            label="Nota Fiscal (obrigatória para descarga)"
            error={allErrors.invoice_path}
            required
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className={`mt-1 block w-full ${FormField.inputClass(allErrors.invoice_path)}`}
              aria-invalid={Boolean(allErrors.invoice_path)}
              onChange={(event) => {
                setData('invoice_path', event.target.files?.[0] || null);
                clearClientError('invoice_path');
              }}
              required
            />
          </FormField>
        )}

        <button
          disabled={processing}
          className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {processing ? 'Enviando...' : 'Confirmar Reserva'}
        </button>
      </form>
    </div>
  );
}
