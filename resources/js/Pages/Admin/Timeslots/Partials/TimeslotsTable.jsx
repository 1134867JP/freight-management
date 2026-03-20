import React from 'react';
import EmptyState from '@/Components/UI/EmptyState';
import StatusBadge from '@/Components/UI/StatusBadge';
import {
  getTimeslotStatusTone,
  translateTimeslotOperationType,
  translateTimeslotStatus,
} from '@/Features/Timeslot/utils/timeslotPresentation';

function getOccupancyPercent(objSlot) {
  if (!objSlot.capacity) return 0;
  return Math.min(Math.round((objSlot.current_reservations / objSlot.capacity) * 100), 100);
}

function getOccupancyToneClass(percent) {
  if (percent >= 100) return 'bg-amber-500';
  if (percent >= 70) return 'bg-blue-500';
  return 'bg-emerald-500';
}

export default function TimeslotsTable({ timeslots, onEdit, onDelete }) {
  if (!timeslots.length) {
    return (
      <EmptyState
        title="Nenhum horário encontrado com os filtros atuais."
        description="Ajuste os filtros para visualizar mais horários."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <table className="min-w-[980px] w-full table-fixed text-left">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
            <th className="w-[19%] px-4 py-3 font-semibold">Horário</th>
            <th className="w-[11%] px-4 py-3 font-semibold">Operação</th>
            <th className="w-[22%] px-4 py-3 font-semibold">Endereço</th>
            <th className="w-[20%] px-4 py-3 font-semibold">Cota / Reservas</th>
            <th className="w-[10%] px-4 py-3 font-semibold">Status</th>
            <th className="w-[10%] px-4 py-3 font-semibold">Visibilidade</th>
            <th className="w-[8%] px-4 py-3 text-right font-semibold">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {timeslots.map((objSlot) => {
            const vlStart = new Date(objSlot.start_time);
            const vlEnd = new Date(objSlot.end_time);
            const nrOccupancyPercent = getOccupancyPercent(objSlot);
            const strOccupancyToneClass = getOccupancyToneClass(nrOccupancyPercent);
            const blIsFull = objSlot.current_reservations >= objSlot.capacity;
            const blIsRestricted = objSlot.clients && objSlot.clients.length > 0;

            return (
              <tr
                key={objSlot.id}
                onClick={() => onEdit(objSlot.id)}
                className="cursor-pointer align-top transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-4 py-5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {vlStart.toLocaleDateString('pt-BR')} {vlStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    até {vlEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <StatusBadge
                    label={translateTimeslotOperationType(objSlot.operation_type)}
                    tone="neutral"
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  />
                </td>

                <td className="px-4 py-5">
                  {objSlot.dropoff_address ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{objSlot.dropoff_address.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {objSlot.dropoff_address.city}/{objSlot.dropoff_address.state}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">Não informado</p>
                  )}
                </td>

                <td className="px-4 py-5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Reservas:{' '}
                    <span className={`font-semibold ${blIsFull ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {objSlot.current_reservations} de {objSlot.capacity}
                    </span>
                  </p>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                    <div
                      className={`h-full ${strOccupancyToneClass}`}
                      style={{ width: `${nrOccupancyPercent}%` }}
                    />
                  </div>
                </td>

                <td className="px-4 py-5">
                  <StatusBadge
                    label={translateTimeslotStatus(objSlot.status)}
                    tone={getTimeslotStatusTone(objSlot.status)}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  />
                </td>

                <td className="px-4 py-5">
                  {!blIsRestricted ? (
                    <StatusBadge label="Público" tone="success" className="px-3 py-1.5 text-xs font-bold" />
                  ) : (
                    <StatusBadge
                      label={`Restrito (${objSlot.clients.length})`}
                      tone="info"
                      className="px-3 py-1.5 text-xs font-bold"
                    />
                  )}
                </td>

                <td className="px-4 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(objSlot.id);
                      }}
                      className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(event, objSlot.id);
                      }}
                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
