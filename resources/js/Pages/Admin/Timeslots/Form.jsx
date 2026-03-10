import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';
import TimeslotForm from './Partials/TimeslotForm';

export default function Form({ timeslot, clients, addresses }) {
  const isEditing = Boolean(timeslot?.id);

  const toDatetimeLocal = (value) => {
    if (!value) return '';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const form = useForm({
    start_time: toDatetimeLocal(timeslot?.start_time),
    end_time: toDatetimeLocal(timeslot?.end_time),
    capacity: timeslot?.capacity ?? 1,
    status: timeslot?.status ?? 'available',
    description: timeslot?.description ?? '',
    operation_type: timeslot?.operation_type ?? 'both',
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
          title={isEditing ? 'Editar Horario' : 'Novo Horario'}
          actions={
            <Link
              href={route('timeslots.index')}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Voltar
            </Link>
          }
        />
      }
    >
      <Head title={isEditing ? 'Editar Horário' : 'Novo Horário'} />

      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8">
            <TimeslotForm
              form={form}
              clients={clients}
              addresses={addresses}
              isEditing={isEditing}
              onSubmit={submit}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
