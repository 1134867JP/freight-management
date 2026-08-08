import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import Button from '@/Components/UI/Button';
import PageHeader from '@/Components/UI/PageHeader';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { translateTimeslotOperationType } from '@/Features/Timeslot/utils/timeslotPresentation';
import { Head, router } from '@inertiajs/react';
import TimeslotSummaryCards from './Partials/TimeslotSummaryCards';
import TimeslotFilters from './Partials/TimeslotFilters';
import TimeslotsTable from './Partials/TimeslotsTable';
import TimeslotsPagination from './Partials/TimeslotsPagination';

export default function Index({ timeslots }) {
  const confirm = useConfirm();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    operation: 'all',
    visibility: 'all',
    dateRange: 'all',
  });
  const [sort, setSort] = useState({
    by: 'datetime',
    direction: 'asc',
  });

  const arrTimeslots = useMemo(() => timeslots?.data || [], [timeslots]);
  const dtToday = useMemo(() => {
    const vlNow = new Date();
    vlNow.setHours(0, 0, 0, 0);
    return vlNow;
  }, []);

  const getVisibilityType = (objSlot) =>
    !objSlot.clients || objSlot.clients.length === 0 ? 'public' : 'restricted';

  const normalizeText = (value) => String(value || '').toLowerCase().trim();

  const summary = useMemo(
    () =>
      arrTimeslots.reduce(
        (arrAccumulator, objSlot) => {
          arrAccumulator.total += 1;
          arrAccumulator[objSlot.status] = (arrAccumulator[objSlot.status] || 0) + 1;
          arrAccumulator[getVisibilityType(objSlot)] += 1;
          return arrAccumulator;
        },
        {
          total: 0,
          available: 0,
          full: 0,
          closed: 0,
          public: 0,
          restricted: 0,
        },
      ),
    [arrTimeslots],
  );

  const filteredAndSortedTimeslots = useMemo(() => {
    const strSearch = normalizeText(filters.search);

    const arrFiltered = arrTimeslots.filter((objSlot) => {
      if (filters.status !== 'all' && objSlot.status !== filters.status) return false;
      if (filters.operation !== 'all' && objSlot.operation_type !== filters.operation) return false;
      if (filters.visibility !== 'all' && getVisibilityType(objSlot) !== filters.visibility) {
        return false;
      }

      if (filters.dateRange !== 'all') {
        const dtStart = new Date(objSlot.start_time);
        dtStart.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today' && dtStart.getTime() !== dtToday.getTime()) return false;
        if (filters.dateRange === 'upcoming' && dtStart.getTime() <= dtToday.getTime()) return false;
      }

      if (strSearch) {
        const strAddress = `${objSlot.dropoff_address?.name || ''} ${objSlot.dropoff_address?.city || ''} ${objSlot.dropoff_address?.state || ''}`;
        const strOperationLabel = translateTimeslotOperationType(objSlot.operation_type);
        const strSearchBase = `${strAddress} ${strOperationLabel} ${objSlot.operation_type}`.toLowerCase();

        if (!strSearchBase.includes(strSearch)) return false;
      }

      return true;
    });

    const arrStatusOrder = {
      available: 1,
      full: 2,
      closed: 3,
    };

    const arrSorted = [...arrFiltered].sort((objA, objB) => {
      if (sort.by === 'datetime') {
        return new Date(objA.start_time) - new Date(objB.start_time);
      }

      if (sort.by === 'capacity') {
        return objA.capacity - objB.capacity;
      }

      if (sort.by === 'reservations') {
        return objA.current_reservations - objB.current_reservations;
      }

      if (sort.by === 'status') {
        return (arrStatusOrder[objA.status] || 99) - (arrStatusOrder[objB.status] || 99);
      }

      return 0;
    });

    return sort.direction === 'asc' ? arrSorted : arrSorted.reverse();
  }, [arrTimeslots, dtToday, filters, sort]);

  const onChangeFilter = (key, value) => {
    setFilters((arrPrev) => ({ ...arrPrev, [key]: value }));
  };

  const onChangeSort = (key, value) => {
    setSort((arrPrev) => ({ ...arrPrev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      operation: 'all',
      visibility: 'all',
      dateRange: 'all',
    });
    setSort({
      by: 'datetime',
      direction: 'asc',
    });
  };

  const deleteSlot = async (event, id) => {
    event.stopPropagation();

    if (!(await confirm('Tem certeza que deseja excluir este horário?'))) {
      return;
    }

    router.delete(route('timeslots.destroy', id), {
      preserveScroll: true,
    });
  };

  const goToEdit = (id) => {
    router.visit(route('timeslots.edit', id));
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Cotas"
          subtitle="Gerencie os Cotas disponíveis do pátio"
          actions={
            <Button onClick={() => router.visit(route('timeslots.create'))}>
              Novo horário
            </Button>
          }
        />
      }
    >
      <Head title="Cotas" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="space-y-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <TimeslotSummaryCards summary={summary} />

            <TimeslotFilters
              filters={filters}
              onChangeFilter={onChangeFilter}
              sort={sort}
              onChangeSort={onChangeSort}
              onReset={resetFilters}
            />

            <TimeslotsTable
              timeslots={filteredAndSortedTimeslots}
              onEdit={goToEdit}
              onDelete={deleteSlot}
            />

            <TimeslotsPagination links={timeslots?.links} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
