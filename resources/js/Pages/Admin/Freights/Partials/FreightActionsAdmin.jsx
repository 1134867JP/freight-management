import React from 'react';

export default function FreightActionsAdmin({ freight, onCancel, onStart, onOpenFinalize, onOpenAssignDoca }) {
  const strStatus = freight.status;
  const blInProgress = strStatus === 'loading' || strStatus === 'unloading';
  const blTerminal = strStatus === 'completed' || strStatus === 'cancelled';
  const blReserved = !blInProgress && !blTerminal;

  const canStart = blReserved;
  const canFinalize = blInProgress;
  const canCancel = blReserved || blInProgress;
  const canAssignDoca = blInProgress;
  const hasOperationalActions = canStart || canFinalize || canCancel || canAssignDoca;

  const baseButtonClass =
    'inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 whitespace-nowrap';

  const startLabel = freight.operation_type === 'load' ? 'Iniciar carga' : 'Iniciar descarga';
  const finalizeLabel = freight.operation_type === 'load' ? 'Finalizar carga' : 'Finalizar descarga';

  return (
    <td className="w-[24%] px-4 py-3 align-middle">
      <div className="flex flex-wrap gap-2">
        {canStart && (
          <button
            type="button"
            onClick={() => onStart(freight)}
            className={`${baseButtonClass} border-amber-500 bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500`}
          >
            {startLabel}
          </button>
        )}

        {canFinalize && (
          <button
            type="button"
            onClick={() => onOpenFinalize(freight)}
            className={`${baseButtonClass} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500`}
          >
            {finalizeLabel}
          </button>
        )}

        {canAssignDoca && (
          <button
            type="button"
            onClick={() => onOpenAssignDoca(freight)}
            className={`${baseButtonClass} border-teal-500 bg-white text-teal-700 hover:bg-teal-50 focus:ring-teal-500 dark:bg-transparent dark:text-teal-400 dark:hover:bg-teal-950/40`}
          >
            {freight.doca ? `Doca: ${freight.doca.codigo || freight.doca.nome}` : 'Atribuir doca'}
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel(freight.id)}
            className={`${baseButtonClass} border-red-600 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500 dark:bg-transparent dark:hover:bg-red-950/40`}
          >
            Cancelar
          </button>
        )}

        {!hasOperationalActions && (
          <span className="text-xs text-gray-400 dark:text-gray-500">Sem ações</span>
        )}
      </div>
    </td>
  );
}
