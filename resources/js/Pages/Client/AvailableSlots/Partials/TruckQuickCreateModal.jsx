import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
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
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            loading={form.processing}
            className="flex-1"
          >
            Adicionar
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
