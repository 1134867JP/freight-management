import React from 'react';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import TableShell from '@/Components/UI/TableShell';
import { translateOperationType } from '@/Features/Freight/utils/freightPresentation';
import FreightActionsAdmin from './FreightActionsAdmin';
import FreightAttachmentsCell from './FreightAttachmentsCell';

export default function FreightsTable({
  freights,
  onCancelReservation,
  onStartOperation,
  onOpenFinalizeModal,
  onOpenAttachmentModal,
  onOpenAssignDocaModal,
}) {
  const getNormalizedStatus = (status) => {
    if (status === 'arrived') return 'arrived';
    if (status === 'loading') return 'loading';
    if (status === 'unloading') return 'unloading';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    return 'reserved';
  };

  const getStatusLabel = (status) => {
    const strStatus = getNormalizedStatus(status);
    const arrLabels = {
      reserved: 'RESERVADO',
      arrived: 'NO PÁTIO',
      loading: 'CARREGANDO',
      unloading: 'DESCARREGANDO',
      completed: 'FINALIZADO',
      cancelled: 'CANCELADO',
    };

    return arrLabels[strStatus];
  };

  const getStatusTone = (status) => {
    const strStatus = getNormalizedStatus(status);
    const arrTones = {
      reserved: 'neutral',
      arrived: 'violet',
      loading: 'warning',
      unloading: 'info',
      completed: 'success',
      cancelled: 'danger',
    };

    return arrTones[strStatus];
  };

  const formatDate = (vlDateTime) =>
    new Date(vlDateTime).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatTime = (vlDateTime) =>
    new Date(vlDateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  if (freights.length === 0) {
    return <EmptyState title="Nenhum frete encontrado para o filtro selecionado." />;
  }

  return (
    <TableShell>
      <table className="min-w-full table-fixed text-left">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="w-[16%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Cliente
            </th>
            <th className="w-[13%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Veículo
            </th>
            <th className="w-[11%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Agendamento
            </th>
            <th className="w-[12%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Pesos
            </th>
            <th className="w-[14%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Documentos
            </th>
            <th className="w-[10%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Status
            </th>
            <th className="w-[24%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {freights.map((freight, index) => (
            <tr
              key={freight.id}
              className={`align-middle transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
                index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
              }`}
            >
              <td className="w-[16%] px-4 py-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{freight.user?.name || '-'}</p>
                {freight.driver_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
                )}
              </td>

              <td className="w-[13%] px-4 py-3">
                <p className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
                <StatusBadge
                  label={translateOperationType(freight.operation_type)}
                  tone="neutral"
                  className="mt-1 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                />
              </td>

              <td className="w-[11%] px-4 py-3 text-sm">
                {freight.timeslot ? (
                  <>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(freight.timeslot.start_time)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(freight.timeslot.start_time)}</p>
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </td>

              <td className="w-[12%] px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                <p>B: <span className="font-medium text-gray-800 dark:text-gray-200">{freight.gross_weight ? `${freight.gross_weight} kg` : '—'}</span></p>
                <p>L: <span className="font-medium text-gray-800 dark:text-gray-200">{freight.net_weight ? `${freight.net_weight} kg` : '—'}</span></p>
              </td>

              <FreightAttachmentsCell
                freight={freight}
                onOpenAttachmentModal={onOpenAttachmentModal}
              />

              <td className="w-[10%] px-4 py-3">
                <StatusBadge
                  label={getStatusLabel(freight.status)}
                  tone={getStatusTone(freight.status)}
                  className="px-2 py-1 text-xs font-bold uppercase tracking-wide"
                />
              </td>

              <FreightActionsAdmin
                freight={freight}
                onCancel={onCancelReservation}
                onStart={onStartOperation}
                onOpenFinalize={onOpenFinalizeModal}
                onOpenAssignDoca={onOpenAssignDocaModal}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}
