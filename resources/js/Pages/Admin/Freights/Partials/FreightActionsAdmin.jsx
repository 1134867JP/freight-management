import React from 'react';
import Button from '@/Components/UI/Button';

export default function FreightActionsAdmin({
  freight,
  onCancel,
  onStart,
  onOpenFinalize,
  onOpenAssignDoca,
}) {
  const strStatus = freight.status;
  const blInProgress = strStatus === 'loading' || strStatus === 'unloading';
  const blReserved = strStatus === 'reserved';
  const blArrived = strStatus === 'arrived';

  const canStart = blArrived;
  const canFinalize = blInProgress;
  const canCancel = blReserved || blArrived || blInProgress;
  const canAssignDoca = (blArrived || blInProgress) && Boolean(onOpenAssignDoca);
  const hasOperationalActions = canStart || canFinalize || canCancel || canAssignDoca;

  const startLabel = freight.operation_type === 'load' ? 'Iniciar carga' : 'Iniciar descarga';
  const finalizeLabel =
    freight.operation_type === 'load' ? 'Finalizar carga' : 'Finalizar descarga';

  return (
    <td className="w-[24%] px-4 py-3 align-middle">
      <div className="flex flex-wrap gap-2">
        {blReserved && (
          <span className="self-center text-xs font-medium text-gray-500 dark:text-gray-400">
            Aguardando check-in
          </span>
        )}

        {canStart && (
          <Button onClick={() => onStart(freight)} size="sm">
            {startLabel}
          </Button>
        )}

        {canFinalize && (
          <Button onClick={() => onOpenFinalize(freight)} size="sm">
            {finalizeLabel}
          </Button>
        )}

        {canAssignDoca && (
          <Button onClick={() => onOpenAssignDoca(freight)} variant="soft" size="sm">
            {freight.doca ? `Doca: ${freight.doca.codigo || freight.doca.nome}` : 'Atribuir doca'}
          </Button>
        )}

        {canCancel && (
          <Button onClick={() => onCancel(freight.id)} variant="danger" size="sm">
            Cancelar
          </Button>
        )}

        {!hasOperationalActions && (
          <span className="text-xs text-gray-400 dark:text-gray-500">Sem ações</span>
        )}
      </div>
    </td>
  );
}
