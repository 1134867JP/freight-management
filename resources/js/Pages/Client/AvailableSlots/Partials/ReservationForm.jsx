import React from 'react';
import { getTruckTypeLabel } from '@/Features/Truck/utils/truckTypes';

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

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de operação</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300"
            value={data.operation_type}
            onChange={(event) => onChangeOperationType(event.target.value)}
            required
          >
            {selectedSlot.operation_type !== 'unload' && <option value="load">Carga</option>}
            {selectedSlot.operation_type !== 'load' && <option value="unload">Descarga</option>}
          </select>
          {errors.operation_type && (
            <span className="text-sm text-red-500">{errors.operation_type}</span>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Caminhão</label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-md border-gray-300"
              value={data.truck_plate}
              onChange={(event) => setData('truck_plate', event.target.value)}
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
          {errors.truck_plate && <span className="text-sm text-red-500">{errors.truck_plate}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do Motorista</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300"
            value={data.driver_name}
            onChange={(event) => setData('driver_name', event.target.value)}
            required
          />
          {errors.driver_name && <span className="text-sm text-red-500">{errors.driver_name}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Carga (Descrição)</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300"
            value={data.cargo_description}
            onChange={(event) => setData('cargo_description', event.target.value)}
            required
          />
          {errors.cargo_description && (
            <span className="text-sm text-red-500">{errors.cargo_description}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Peso (Toneladas)</label>
          <input
            type="number"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300"
            value={data.weight}
            onChange={(event) => setData('weight', event.target.value)}
          />
          {errors.weight && <span className="text-sm text-red-500">{errors.weight}</span>}
        </div>

        {data.operation_type === 'unload' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nota Fiscal (obrigatória para descarga)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1 block w-full rounded-md border-gray-300"
              onChange={(event) => setData('nota_fiscal_path', event.target.files?.[0] || null)}
              required
            />
            {errors.nota_fiscal_path && (
              <span className="text-sm text-red-500">{errors.nota_fiscal_path}</span>
            )}
          </div>
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
