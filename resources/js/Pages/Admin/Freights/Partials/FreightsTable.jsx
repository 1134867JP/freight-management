import React from 'react';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import { translateOperationType } from '@/Features/Freight/utils/freightPresentation';
import FreightActionsAdmin from './FreightActionsAdmin';
import FreightAttachmentsCell from './FreightAttachmentsCell';

export default function FreightsTable({
  freights,
  onCancelReservation,
  onStartOperation,
  onOpenFinalizeModal,
  onOpenAttachmentModal,
}) {
  const getNormalizedStatus = (status) => {
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

  const formatWeight = (weight) => {
    if (weight === null || weight === undefined || weight === '') {
      return 'Não informado';
    }

    return weight;
  };

  if (freights.length === 0) {
    return <EmptyState title="Nenhum frete encontrado para o filtro selecionado." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full table-fixed text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-[16%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Cliente
            </th>
            <th className="w-[10%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Veículo
            </th>
            <th className="w-[10%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Operação
            </th>
            <th className="w-[14%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Agendamento
            </th>
            <th className="w-[14%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Pesos
            </th>
            <th className="w-[18%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Documentos
            </th>
            <th className="w-[10%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Status
            </th>
            <th className="w-[18%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {freights.map((freight) => (
            <tr key={freight.id} className="align-top transition hover:bg-gray-50/70">
              <td className="w-[16%] px-4 py-4 align-top">
                <p className="text-sm font-semibold text-gray-900">{freight.user?.name || '-'}</p>
                <p className="text-xs text-gray-500">{freight.driver_name || 'Motorista não informado'}</p>
              </td>

              <td className="w-[10%] px-4 py-4 align-top">
                <p className="text-sm font-semibold tracking-wide text-gray-900">{freight.truck_plate}</p>
              </td>

              <td className="w-[10%] px-4 py-4 align-top">
                <StatusBadge
                  label={translateOperationType(freight.operation_type)}
                  tone="neutral"
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                />
              </td>

              <td className="w-[14%] px-4 py-4 align-top text-sm">
                {freight.timeslot ? (
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900">{formatDate(freight.timeslot.start_time)}</p>
                    <p className="text-gray-600">{formatTime(freight.timeslot.start_time)}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">Não informado</span>
                )}
              </td>

              <td className="w-[14%] px-4 py-4 align-top text-sm">
                <p className="text-gray-700">
                  Peso bruto: <span className="font-medium">{formatWeight(freight.gross_weight)}</span>
                </p>
                <p className="text-gray-700">
                  Peso líquido: <span className="font-medium">{formatWeight(freight.net_weight)}</span>
                </p>
              </td>

              <FreightAttachmentsCell
                freight={freight}
                onOpenAttachmentModal={onOpenAttachmentModal}
              />

              <td className="w-[10%] px-4 py-4 align-top">
                <StatusBadge
                  label={getStatusLabel(freight.status)}
                  tone={getStatusTone(freight.status)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                />
              </td>

              <FreightActionsAdmin
                freight={freight}
                onCancel={onCancelReservation}
                onStart={onStartOperation}
                onOpenFinalize={onOpenFinalizeModal}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
