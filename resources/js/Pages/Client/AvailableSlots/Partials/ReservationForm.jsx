import React from 'react';
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
      if (!value || value.trim().length < 3)
        return 'Descrição da carga deve ter ao menos 3 caracteres.';
      return null;
    },
    nota_fiscal_path: (value, formData) => {
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
    <div className={`h-fit w-full bg-white p-6 shadow sm:rounded-lg ${className}`}>
      <h3 className="mb-4 text-lg font-medium text-gray-900">
        Reservar para {new Date(selectedSlot.start_time).toLocaleString('pt-BR')}
      </h3>

      <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-medium text-emerald-900">Resumo da cota</p>
        <p className="text-sm text-emerald-800">
          Ocupação: {selectedSlot.current_reservations} / {selectedSlot.capacity}
        </p>
        <p className="text-sm font-semibold text-emerald-800">Vagas restantes: {nrRemaining}</p>
      </div>

      {selectedSlot.dropoff_address ? (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-900">Endereço de Descarga:</p>
          <p className="text-sm font-semibold text-blue-800">{selectedSlot.dropoff_address.name}</p>
          <p className="text-xs text-blue-700">
            {selectedSlot.dropoff_address.street}, {selectedSlot.dropoff_address.number}
            {selectedSlot.dropoff_address.complement &&
              ` (${selectedSlot.dropoff_address.complement})`}
          </p>
          <p className="text-xs text-blue-700">
            {selectedSlot.dropoff_address.neighborhood} - {selectedSlot.dropoff_address.city}/
            {selectedSlot.dropoff_address.state}
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm italic text-gray-600">Endereço de descarga não informado</p>
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
              className="rounded-md bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
              title="Adicionar novo caminhão"
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
            error={allErrors.nota_fiscal_path}
            required
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className={`mt-1 block w-full ${FormField.inputClass(allErrors.nota_fiscal_path)}`}
              aria-invalid={Boolean(allErrors.nota_fiscal_path)}
              onChange={(event) => {
                setData('nota_fiscal_path', event.target.files?.[0] || null);
                clearClientError('nota_fiscal_path');
              }}
              required
            />
          </FormField>
        )}

        <button
          disabled={processing}
          className="mt-4 w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Confirmar Solicitação
        </button>
      </form>
    </div>
  );
}
