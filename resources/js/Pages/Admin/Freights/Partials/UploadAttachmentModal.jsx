import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import Button from '@/Components/UI/Button';

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
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-700/50">
            <p className="font-medium text-gray-800 dark:text-gray-100">Frete #{freight.id}</p>
            <p className="text-gray-600 dark:text-gray-400">
              Cliente: <span className="font-medium">{freight.user?.name || '-'}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Placa: <span className="font-medium">{freight.truck_plate}</span>
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Arquivo do anexo
          </label>
          <input
            type="file"
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 dark:file:bg-gray-600 dark:file:text-gray-200"
            onChange={(event) => onChangeFile(event.target.files?.[0] || null)}
            required
          />
        </div>

        {file && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Arquivo selecionado: <span className="font-medium">{file.name}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={!file}
            loading={processing}
            size="sm"
          >
            Enviar anexo
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
