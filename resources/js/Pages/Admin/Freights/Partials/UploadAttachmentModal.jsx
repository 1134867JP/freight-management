import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';

export default function UploadAttachmentModal({
  open,
  freight,
  file,
  onChangeFile,
  onSubmit,
  onClose,
  processing = false,
}) {
  return (
    <ModalShell
      show={open}
      title="Adicionar anexo"
      onClose={onClose}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {freight && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-800">Frete #{freight.id}</p>
            <p className="text-gray-600">
              Cliente: <span className="font-medium">{freight.user?.name || '-'}</span>
            </p>
            <p className="text-gray-600">
              Placa: <span className="font-medium">{freight.truck_plate}</span>
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Arquivo do anexo
          </label>
          <input
            type="file"
            className="block w-full text-sm"
            onChange={(event) => onChangeFile(event.target.files?.[0] || null)}
            required
          />
        </div>

        {file && (
          <p className="text-xs text-gray-600">
            Arquivo selecionado: <span className="font-medium">{file.name}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={processing || !file}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar anexo
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
