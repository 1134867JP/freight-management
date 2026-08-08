import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
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
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            Finalizar
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
