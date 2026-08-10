import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import Button from '@/Components/UI/Button';
import { Head, router } from '@inertiajs/react';
import { formatDate, formatTime } from '@/utils/formatters';
import { getStatusPresentation } from '@/utils/statusPresentation';

const pad = (n) => String(n).padStart(2, '0');

const dayKeyFromDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Retorna todas as chaves de dia que um slot "toca" (inclui virada de dia)
const expandSlotDays = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [dayKeyFromDate(start)];

  // normaliza para 00:00:00 para iterar dia a dia
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const keys = [];
  while (cur <= endDay) {
    keys.push(dayKeyFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
};

export default function Agenda({ timeslots }) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(null);


  const monthLabel = (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Agrupa slots por dia considerando slots que atravessam a meia-noite (aparecem nos dois dias)
  const slotsByDay = useMemo(() => {
    const list = Array.isArray(timeslots) ? timeslots : [];
    const map = new Map();

    list.forEach((slot) => {
      const keys = expandSlotDays(slot.start_time, slot.end_time);
      keys.forEach((key) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(slot);
      });
    });

    // Ordena slots por start_time dentro do dia
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      map.set(key, arr);
    }

    return map;
  }, [timeslots]);

  // Monta grid do mês (6 semanas)
  const monthGrid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // domingo

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKeyFromDate(d);
      cells.push({
        date: d,
        key,
        inMonth: d.getMonth() === month,
        isToday: dayKeyFromDate(new Date()) === key,
      });
    }
    return cells;
  }, [monthCursor]);

  // Seleção inicial (preferir hoje se estiver no grid)
  React.useEffect(() => {
    if (selectedDayKey) return;
    const todayKey = dayKeyFromDate(new Date());
    const hasTodayInGrid = monthGrid.some((c) => c.key === todayKey);
    setSelectedDayKey(hasTodayInGrid ? todayKey : monthGrid.find((c) => c.inMonth)?.key || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthGrid]);

  const selectedSlots = useMemo(() => {
    if (!selectedDayKey) return [];
    return slotsByDay.get(selectedDayKey) || [];
  }, [selectedDayKey, slotsByDay]);

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayKey) return '';
    const d = new Date(`${selectedDayKey}T00:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDayKey]);

  // Contagem do dia: como o mesmo slot pode aparecer em 2 dias, evita contar duplicado por ID
  const dayCounts = (dayKey) => {
    const slots = slotsByDay.get(dayKey) || [];
    const uniq = new Map();
    slots.forEach((s) => uniq.set(s.id, s));

    let totalSlots = uniq.size;
    let totalCapacity = 0;
    let totalReservations = 0;

    uniq.forEach((s) => {
      totalCapacity += Number(s.capacity ?? 0);
      totalReservations += Number(s.current_reservations ?? 0);
    });

    return { totalSlots, totalCapacity, totalReservations };
  };


  const handleDayDoubleClick = (dayKey) => {
    router.get(route('timeslots.create'), { date: dayKey });
  };

  const prevMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    setMonthCursor(d);
    setSelectedDayKey(null);
  };

  const nextMonth = () => {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    setMonthCursor(d);
    setSelectedDayKey(null);
  };

  // Exibe intervalo com indicação quando atravessa dia
  const formatRange = (slot) => {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const crossesDay = dayKeyFromDate(start) !== dayKeyFromDate(end);

    if (!crossesDay) return `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;

    return `${formatDate(slot.start_time, { year: undefined })} ${formatTime(slot.start_time)} → ${formatDate(slot.end_time, { year: undefined })} ${formatTime(slot.end_time)}`;
  };

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Agenda" subtitle="Horários anunciados e reservas por dia" />}
    >
      <Head title="Agenda" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header / navegação mês */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mês</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {monthLabel(monthCursor)}
              </h3>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={prevMonth}
                variant="secondary"
              >
                ← Anterior
              </Button>
              <Button
                onClick={nextMonth}
                variant="secondary"
              >
                Próximo →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Calendário */}
            <div className="lg:col-span-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((w) => (
                  <div key={w} className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center py-2">
                    {w}
                  </div>
                ))}
              </div>

              <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
                Clique para ver os detalhes do dia · <span className="font-medium">Duplo clique para adicionar uma janela</span>
              </p>

              <div className="grid grid-cols-7 gap-2">
                {monthGrid.map((cell) => {
                  const { totalSlots, totalCapacity, totalReservations } = dayCounts(cell.key);
                  const isSelected = selectedDayKey === cell.key;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDayKey(cell.key)}
                      onDoubleClick={() => handleDayDoubleClick(cell.key)}
                      className={[
                        'rounded-lg border p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition',
                        cell.inMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50',
                        isSelected ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-gray-200 dark:border-gray-700',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            'text-sm font-semibold',
                            cell.inMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600',
                          ].join(' ')}
                        >
                          {cell.date.getDate()}
                        </span>

                        {cell.isToday && (
                          <span className="text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {totalSlots > 0 ? (
                          <>
                            <div className="text-[11px] text-gray-600 dark:text-gray-400">{totalSlots} horário(s)</div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-400">
                              Ocupação {totalReservations}/{totalCapacity}
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-gray-400 dark:text-gray-600">Sem janelas</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detalhe do dia */}
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <div className="mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Dia selecionado</p>
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {selectedDayLabel || '-'}
                </h4>
              </div>

              {selectedSlots.length === 0 ? (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 text-sm text-gray-600 dark:text-gray-400">
                  Nenhum horário para este dia.
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                  {selectedSlots.map((slot) => {
                    const reservations = (slot.freights || []).filter(
                      (f) => f.status !== 'cancelled',
                    );

                    return (
                      <div
                        key={`${selectedDayKey}-${slot.id}`}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatRange(slot)}
                              </p>
                              <StatusBadge {...getStatusPresentation('timeslot', slot.status)} />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Capacidade: {slot.current_reservations}/{slot.capacity}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {slot.description || 'Sem descrição'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Reservas
                          </p>

                          {reservations.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não reservado.</p>
                          ) : (
                            <div className="space-y-2">
                              {reservations.map((freight) => (
                                <div key={freight.id} className="rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                      {freight.user?.name || 'Cliente não informado'}
                                    </p>
                                    <StatusBadge {...getStatusPresentation('freight', freight.status)} />
                                  </div>

                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-semibold">Motorista:</span>{' '}
                                      {freight.driver_name}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      <span className="font-semibold">Placa:</span>{' '}
                                      {freight.truck_plate}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {(!Array.isArray(timeslots) || timeslots.length === 0) && (
            <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-6 text-gray-500 dark:text-gray-400 shadow-sm">
              Nenhum horário anunciado ainda.
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
