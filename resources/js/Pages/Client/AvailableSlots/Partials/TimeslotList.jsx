import React, { useMemo, useState } from 'react';
import EmptyState from '@/Components/UI/EmptyState';
import TimeslotCard from './TimeslotCard';
import TimeslotFilters from './TimeslotFilters';

function getPeriodByHour(hour) {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

function formatDateKey(dateValue) {
  const vlDate = new Date(dateValue);
  const nrYear = vlDate.getFullYear();
  const nrMonth = String(vlDate.getMonth() + 1).padStart(2, '0');
  const nrDay = String(vlDate.getDate()).padStart(2, '0');
  return `${nrYear}-${nrMonth}-${nrDay}`;
}

function formatGroupLabel(dateKey) {
  const vlDate = new Date(`${dateKey}T00:00:00`);
  const strLabel = vlDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return strLabel.charAt(0).toUpperCase() + strLabel.slice(1);
}

function CalendarIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z" />
    </svg>
  );
}

export default function TimeslotList({ timeslots, selectedSlot, onReserveSlot, className = '' }) {
  const [filters, setFilters] = useState({
    operation: 'all',
    period: 'all',
    address: '',
  });

  const filteredTimeslots = useMemo(() => {
    const strAddress = filters.address.trim().toLowerCase();
    return (timeslots || []).filter((objSlot) => {
      if (filters.operation !== 'all') {
        if (filters.operation === 'both' && objSlot.operation_type !== 'both') return false;
        if (filters.operation !== 'both' && ![filters.operation, 'both'].includes(objSlot.operation_type)) return false;
      }
      if (filters.period !== 'all') {
        const strPeriod = getPeriodByHour(new Date(objSlot.start_time).getHours());
        if (strPeriod !== filters.period) return false;
      }
      if (strAddress) {
        const strAddressTarget = [
          objSlot.dropoff_address?.name,
          objSlot.dropoff_address?.street,
          objSlot.dropoff_address?.neighborhood,
          objSlot.dropoff_address?.city,
          objSlot.dropoff_address?.state,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!strAddressTarget.includes(strAddress)) return false;
      }
      return true;
    });
  }, [timeslots, filters]);

  const groupedTimeslots = useMemo(() => {
    const arrSorted = [...filteredTimeslots].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time),
    );
    const mapGroups = new Map();
    arrSorted.forEach((objSlot) => {
      const strDateKey = formatDateKey(objSlot.start_time);
      if (!mapGroups.has(strDateKey)) mapGroups.set(strDateKey, []);
      mapGroups.get(strDateKey).push(objSlot);
    });
    return Array.from(mapGroups.entries()).map(([strDateKey, arrSlots]) => ({
      key: strDateKey,
      label: formatGroupLabel(strDateKey),
      slots: arrSlots,
    }));
  }, [filteredTimeslots]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ operation: 'all', period: 'all', address: '' });

  return (
    <section className={`w-full ${className}`}>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Escolha um horário</h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {filteredTimeslots.length} opção(ões) em {groupedTimeslots.length} dia(s)
            </p>
          </div>
          {(timeslots || []).length > 0 && (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
              {(timeslots || []).length} disponíve{(timeslots || []).length === 1 ? 'l' : 'is'}
            </span>
          )}
        </div>

        {/* Filters */}
        {(timeslots || []).length > 0 && (
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <TimeslotFilters filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">
          {(timeslots || []).length === 0 && (
            <EmptyState
              icon={<CalendarIcon />}
              title="Nenhum horário disponível no momento."
              description="Aguarde novas janelas serem abertas pelo administrador."
            />
          )}

          {(timeslots || []).length > 0 && filteredTimeslots.length === 0 && (
            <EmptyState
              title="Nenhum horário encontrado com os filtros atuais."
              description="Ajuste os filtros para visualizar mais opções."
            />
          )}

          {groupedTimeslots.length > 0 && (
            <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
              {groupedTimeslots.map((objGroup) => (
                <div key={objGroup.key} className="space-y-3">
                  <h4 className="sticky top-0 z-10 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {objGroup.label}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {objGroup.slots.map((objSlot) => (
                      <TimeslotCard
                        key={objSlot.id}
                        slot={objSlot}
                        selected={selectedSlot?.id === objSlot.id}
                        onReserve={onReserveSlot}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
