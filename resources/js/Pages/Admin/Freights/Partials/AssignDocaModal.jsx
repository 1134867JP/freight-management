import React, { useState } from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import { router } from '@inertiajs/react';

export default function AssignDocaModal({ open, freight, docasDisponiveis, onClose }) {
  const [selectedDocaId, setSelectedDocaId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleClose = () => {
    setSelectedDocaId(null);
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedDocaId || !freight) return;

    setProcessing(true);
    router.patch(
      route('freights.assignDoca', freight.id),
      { doca_id: selectedDocaId },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedDocaId(null);
          onClose();
        },
        onFinish: () => setProcessing(false),
      },
    );
  };

  const arrDocas = docasDisponiveis || [];
  const currentDocaId = freight?.doca?.id ?? freight?.doca_id ?? null;

  return (
    <ModalShell show={open} title="Atribuir Doca" onClose={handleClose} maxWidthClass="max-w-md">
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Frete: <span className="font-semibold text-gray-900 dark:text-gray-100">{freight?.truck_plate}</span>
          {freight?.driver_name && (
            <> &mdash; <span className="font-medium">{freight.driver_name}</span></>
          )}
        </p>
        {currentDocaId && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Doca atual: <span className="font-semibold">{freight?.doca?.nome ?? '—'}</span> (será liberada automaticamente)
          </p>
        )}
      </div>

      {arrDocas.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-700/30">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma doca disponível no momento.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {arrDocas.map((doca) => (
              <label
                key={doca.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  selectedDocaId === doca.id
                    ? 'border-teal-500 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="doca_id"
                  value={doca.id}
                  checked={selectedDocaId === doca.id}
                  onChange={() => setSelectedDocaId(doca.id)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{doca.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Código: {doca.codigo}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedDocaId || processing}
              className="flex-1 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {processing ? 'Atribuindo...' : 'Atribuir'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
