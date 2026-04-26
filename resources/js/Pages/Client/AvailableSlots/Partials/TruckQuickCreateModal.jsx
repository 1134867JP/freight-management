import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import FormField from '@/Components/UI/FormField';
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
        <FormField label="Placa" error={form.errors.plate} required>
          <FormField.Input
            type="text"
            error={form.errors.plate}
            placeholder="ABC1D23"
            value={form.data.plate}
            onChange={(event) => {
              form.clearErrors('plate');
              form.setData('plate', normalizeTruckPlate(event.target.value));
            }}
            maxLength={7}
            required
          />
        </FormField>

        <FormField label="Tipo" error={form.errors.type} required>
          <FormField.Select
            error={form.errors.type}
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
          </FormField.Select>
        </FormField>

        <FormField label="Modelo (Opcional)" error={form.errors.model}>
          <FormField.Input
            type="text"
            error={form.errors.model}
            value={form.data.model}
            onChange={(event) => form.setData('model', event.target.value)}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={form.processing}
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Adicionar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
