import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Peso Bruto</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={grossWeight}
            onChange={(event) => onChangeGrossWeight(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Peso Líquido descarregado
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={netWeight}
            onChange={(event) => onChangeNetWeight(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Observações</label>
          <textarea
            rows={3}
            value={adminNotes}
            onChange={(event) => onChangeAdminNotes(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-white">
            Salvar
          </button>

          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
