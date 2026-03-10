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

export default function TimeslotList({
  timeslots,
  selectedSlot,
  onReserveSlot,
  className = '',
}) {
  const [filters, setFilters] = useState({
    operation: 'all',
    period: 'all',
    address: '',
  });

  const filteredTimeslots = useMemo(() => {
    const strAddress = filters.address.trim().toLowerCase();

    return (timeslots || []).filter((objSlot) => {
      if (filters.operation !== 'all') {
        if (filters.operation === 'both' && objSlot.operation_type !== 'both') {
          return false;
        }

        if (
          filters.operation !== 'both'
          && ![filters.operation, 'both'].includes(objSlot.operation_type)
        ) {
          return false;
        }
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
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

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

      if (!mapGroups.has(strDateKey)) {
        mapGroups.set(strDateKey, []);
      }

      mapGroups.get(strDateKey).push(objSlot);
    });

    return Array.from(mapGroups.entries()).map(([strDateKey, arrSlots]) => ({
      key: strDateKey,
      label: formatGroupLabel(strDateKey),
      slots: arrSlots,
    }));
  }, [filteredTimeslots]);

  const updateFilter = (key, value) => {
    setFilters((arrPrev) => ({
      ...arrPrev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      operation: 'all',
      period: 'all',
      address: '',
    });
  };

  return (
    <section className={`w-full space-y-4 ${className}`}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">Escolha um horário</h3>
        <p className="text-sm text-gray-600">
          {filteredTimeslots.length} opção(ões) em {groupedTimeslots.length} dia(s)
        </p>
      </div>

      {timeslots.length > 0 && (
        <TimeslotFilters filters={filters} onChange={updateFilter} onReset={resetFilters} />
      )}

      {timeslots.length === 0 && (
        <EmptyState
          title="Nenhum horário disponível no momento."
          className="border-yellow-200 bg-yellow-50 text-yellow-800"
        />
      )}

      {timeslots.length > 0 && filteredTimeslots.length === 0 && (
        <EmptyState
          title="Nenhum horário encontrado com os filtros atuais."
          description="Ajuste os filtros para visualizar mais opções."
        />
      )}

      {groupedTimeslots.length > 0 && (
        <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
          {groupedTimeslots.map((objGroup) => (
            <div key={objGroup.key} className="space-y-3">
              <h4 className="sticky top-0 z-10 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
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
    </section>
  );
}
