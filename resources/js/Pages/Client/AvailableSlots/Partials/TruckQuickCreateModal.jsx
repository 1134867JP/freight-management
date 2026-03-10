import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import {
  TRUCK_TYPE_OPTIONS,
  isValidTruckPlate,
  normalizeTruckPlate,
} from '@/Features/Truck/utils/truckTypes';

export default function TruckQuickCreateModal({ show, form, onClose, onSubmit }) {
  const submit = (event) => {
    event.preventDefault();

    const vlPlate = normalizeTruckPlate(form.data.plate);
    form.setData('plate', vlPlate);

    if (!isValidTruckPlate(vlPlate)) {
      form.setError('plate', 'Placa inválida. Use ABC1234 ou ABC1D23.');
      return;
    }

    onSubmit(event);
  };

  return (
    <ModalShell show={show} title="Adicionar Caminhão" onClose={onClose} maxWidthClass="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Placa</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300"
            placeholder="ABC1D23"
            value={form.data.plate}
            onChange={(event) => {
              form.clearErrors('plate');
              form.setData('plate', normalizeTruckPlate(event.target.value));
            }}
            maxLength={7}
            required
          />
          {form.errors.plate && <span className="text-sm text-red-500">{form.errors.plate}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300"
            value={form.data.type}
            onChange={(event) => form.setData('type', event.target.value)}
            required
          >
            <option value="">Selecione</option>
            {TRUCK_TYPE_OPTIONS.map((objOption) => (
              <option key={objOption.value} value={objOption.value}>
                {objOption.label}
              </option>
            ))}
          </select>
          {form.errors.type && <span className="text-sm text-red-500">{form.errors.type}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Modelo (Opcional)</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300"
            value={form.data.model}
            onChange={(event) => form.setData('model', event.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={form.processing}
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
