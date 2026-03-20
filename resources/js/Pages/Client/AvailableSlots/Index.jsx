import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, useForm } from '@inertiajs/react';
import ReservationForm from './Partials/ReservationForm';
import TimeslotList from './Partials/TimeslotList';
import TruckQuickCreateModal from './Partials/TruckQuickCreateModal';

export default function Index({ timeslots, trucks }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const hasSelectedSlot = Boolean(selectedSlot);

  const { data, setData, post, processing, errors, reset } = useForm({
    truck_plate: '',
    driver_name: '',
    cargo_description: '',
    weight: '',
    operation_type: 'load',
    invoice_path: null,
  });

  const truckForm = useForm({
    plate: '',
    type: 'cavalo',
    model: '',
    notes: '',
    is_active: true,
  });

  const handleSelectSlot = (objSlot) => {
    setSelectedSlot(objSlot);

    if (objSlot.operation_type !== 'both') {
      setData('operation_type', objSlot.operation_type);
    }

    if (objSlot.operation_type === 'load') {
      setData('invoice_path', null);
    }
  };

  const handleOperationTypeChange = (vlOperationType) => {
    setData('operation_type', vlOperationType);

    if (vlOperationType !== 'unload') {
      setData('invoice_path', null);
    }
  };

  const submitReservation = (event) => {
    event.preventDefault();
    if (!selectedSlot) return;

    post(route('client.reserve', selectedSlot.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setSelectedSlot(null);
      },
    });
  };

  const submitTruck = () => {
    truckForm.post(route('client.trucks.store'), {
      preserveScroll: true,
      onSuccess: () => {
        truckForm.reset();
        setShowTruckModal(false);
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Horários Disponíveis"
          subtitle="Selecione um horário futuro e reserve sua operação"
        />
      }
    >
      <Head title="Horários Disponíveis" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <div className={`flex flex-col gap-6 ${hasSelectedSlot ? 'xl:flex-row' : ''}`}>
            <TimeslotList
              timeslots={timeslots}
              selectedSlot={selectedSlot}
              onReserveSlot={handleSelectSlot}
              className={hasSelectedSlot ? 'xl:w-7/12' : 'w-full'}
            />

            {hasSelectedSlot && (
              <ReservationForm
                selectedSlot={selectedSlot}
                data={data}
                setData={setData}
                onChangeOperationType={handleOperationTypeChange}
                errors={errors}
                processing={processing}
                trucks={trucks}
                onSubmit={submitReservation}
                onOpenTruckModal={() => setShowTruckModal(true)}
                className="xl:w-5/12"
              />
            )}
          </div>
        </div>
      </div>

      <TruckQuickCreateModal
        show={showTruckModal}
        form={truckForm}
        onSubmit={submitTruck}
        onClose={() => {
          setShowTruckModal(false);
          truckForm.reset();
        }}
      />
    </AuthenticatedLayout>
  );
}
