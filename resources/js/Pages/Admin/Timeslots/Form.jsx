import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import Button from '@/Components/UI/Button';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, router, useForm } from '@inertiajs/react';
import TimeslotForm from './Partials/TimeslotForm';

export default function Form({ timeslot, clients, addresses, produtos, docas, defaultDate }) {
  const isEditing = Boolean(timeslot?.id);

  const toDatetimeLocal = (value) => {
    if (!value) return '';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const form = useForm({
    start_time: toDatetimeLocal(timeslot?.start_time) || (defaultDate ? `${defaultDate}T00:00` : ''),
    end_time: toDatetimeLocal(timeslot?.end_time) || (defaultDate ? `${defaultDate}T01:00` : ''),
    capacity: timeslot?.capacity ?? 1,
    status: timeslot?.status ?? 'available',
    description: timeslot?.description ?? '',
    operation_type: timeslot?.operation_type ?? 'both',
    modelo: timeslot?.modelo ?? 'aberta',
    produto_id: timeslot?.produto_id ?? '',
    doca_id: timeslot?.doca_id ?? '',
    client_ids: timeslot?.clients?.map((objClient) => objClient.id) || [],
    dropoff_address_id: timeslot?.dropoff_address_id ?? '',
  });

  const submit = (event) => {
    event.preventDefault();

    if (isEditing) {
      form.patch(route('timeslots.update', timeslot.id), {
        preserveScroll: true,
      });
      return;
    }

    form.post(route('timeslots.store'), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title={isEditing ? 'Editar Horário' : 'Novo Horário'}
          subtitle={isEditing ? 'Altere os dados do horário e salve' : 'Preencha os dados para criar um novo horário'}
          actions={
            <Button variant="secondary" onClick={() => router.visit(route('timeslots.index'))}>
              ← Voltar
            </Button>
          }
        />
      }
    >
      <Head title={isEditing ? 'Editar Horário' : 'Novo Horário'} />

      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <TimeslotForm
              form={form}
              clients={clients}
              addresses={addresses}
              produtos={produtos}
              docas={docas}
              isEditing={isEditing}
              onSubmit={submit}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
