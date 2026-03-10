import React from 'react';
import { translateTimeslotOperationType } from '@/Features/Timeslot/utils/timeslotPresentation';

function getOccupationPercent(objSlot) {
  if (!objSlot.capacity) return 0;
  return Math.min(Math.round((objSlot.current_reservations / objSlot.capacity) * 100), 100);
}

function getProgressClass(percent) {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function TimeslotCard({ slot, selected, onReserve }) {
  const vlStart = new Date(slot.start_time);
  const vlEnd = new Date(slot.end_time);
  const nrOccupationPercent = getOccupationPercent(slot);
  const nrRemaining = Math.max(slot.capacity - slot.current_reservations, 0);

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm transition ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {vlStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {vlEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500">
            {vlStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {translateTimeslotOperationType(slot.operation_type)}
        </span>
      </div>

      <div className="mb-3">
        {slot.dropoff_address ? (
          <div>
            <p className="text-sm font-medium text-gray-900">{slot.dropoff_address.name}</p>
            <p className="text-xs text-gray-500">
              {slot.dropoff_address.city}/{slot.dropoff_address.state}
            </p>
          </div>
        ) : (
          <p className="text-sm italic text-gray-500">Endereço não informado</p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{nrRemaining}</span>{' '}
          vaga(s) disponível(is) de <span className="font-semibold text-gray-900">{slot.capacity}</span>
        </p>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full ${getProgressClass(nrOccupationPercent)}`}
            style={{ width: `${nrOccupationPercent}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onReserve(slot)}
        className={`mt-4 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition ${
          selected
            ? 'bg-blue-700 text-white hover:bg-blue-800'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {selected ? 'Horário selecionado' : 'Reservar horário'}
      </button>
    </article>
  );
}
