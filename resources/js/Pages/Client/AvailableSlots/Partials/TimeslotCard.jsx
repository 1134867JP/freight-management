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

function getModeloBadge(strModelo) {
  switch (strModelo) {
    case 'por_produto':
      return { label: 'Produto fixo', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' };
    case 'por_produto_doca':
      return { label: 'Produto + Doca', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' };
    default:
      return { label: 'Cota aberta', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
  }
}

export default function TimeslotCard({ slot, selected, onReserve }) {
  const vlStart = new Date(slot.start_time);
  const vlEnd = new Date(slot.end_time);
  const nrOccupationPercent = getOccupationPercent(slot);
  const nrRemaining = Math.max(slot.capacity - slot.current_reservations, 0);
  const objModeloBadge = getModeloBadge(slot.modelo);

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm transition ${
        selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {vlStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {vlEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {vlStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {translateTimeslotOperationType(slot.operation_type)}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${objModeloBadge.className}`}>
            {objModeloBadge.label}
          </span>
        </div>
      </div>

      {/* Produto / Doca info para cotas por_produto */}
      {slot.produto && (
        <div className="mb-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300">
            {slot.produto.nome}
          </span>
          {slot.doca && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300">
              {slot.doca.nome}
            </span>
          )}
        </div>
      )}

      <div className="mb-3">
        {slot.dropoff_address ? (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{slot.dropoff_address.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {slot.dropoff_address.city}/{slot.dropoff_address.state}
            </p>
          </div>
        ) : (
          <p className="text-sm italic text-gray-500 dark:text-gray-400">Endereço não informado</p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{nrRemaining}</span>{' '}
          <span className="text-gray-700 dark:text-gray-300">vaga(s) disponível(is) de</span> <span className="font-semibold text-gray-900 dark:text-gray-100">{slot.capacity}</span>
        </p>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
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
