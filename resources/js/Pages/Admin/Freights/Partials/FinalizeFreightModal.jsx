import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import FormField from '@/Components/UI/FormField';
import { getFinalizeButtonLabel } from '@/Features/Freight/utils/freightPresentation';

export default function FinalizeFreightModal({
  open,
  freight,
  grossWeight,
  netWeight,
  adminNotes,
  onChangeGrossWeight,
  onChangeNetWeight,
  onChangeAdminNotes,
  onSubmit,
  onClose,
}) {
  return (
    <ModalShell
      show={open}
      title={getFinalizeButtonLabel(freight?.operation_type)}
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Peso Bruto (kg)" required>
          <FormField.Input
            type="number"
            step="0.01"
            min="0.01"
            value={grossWeight}
            onChange={(event) => onChangeGrossWeight(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Peso Líquido descarregado (kg)" required>
          <FormField.Input
            type="number"
            step="0.01"
            min="0.01"
            value={netWeight}
            onChange={(event) => onChangeNetWeight(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Observações">
          <textarea
            rows={3}
            value={adminNotes}
            onChange={(event) => onChangeAdminNotes(event.target.value)}
            className={`mt-1 block w-full ${FormField.inputClass(null)}`}
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
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Finalizar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
