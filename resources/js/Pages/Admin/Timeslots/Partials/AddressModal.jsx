import React from 'react';
import ModalShell from '@/Components/UI/ModalShell';
import { useForm } from '@inertiajs/react';

export default function AddressModal({ show, onClose }) {
  const form = useForm({
    name: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    is_active: true,
  });

  const submit = (event) => {
    event.preventDefault();

    form.post(route('dropoff-addresses.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  return (
    <ModalShell
      show={show}
      onClose={() => {
        onClose();
        form.reset();
      }}
      title="Adicionar Endereço de Descarga"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome/Identificador</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.name}
              onChange={(event) => form.setData('name', event.target.value)}
              required
            />
            {form.errors.name && <span className="text-sm text-red-500">{form.errors.name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Logradouro</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.street}
              onChange={(event) => form.setData('street', event.target.value)}
              required
            />
            {form.errors.street && (
              <span className="text-sm text-red-500">{form.errors.street}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.number}
              onChange={(event) => form.setData('number', event.target.value)}
              required
            />
            {form.errors.number && (
              <span className="text-sm text-red-500">{form.errors.number}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bairro</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.neighborhood}
              onChange={(event) => form.setData('neighborhood', event.target.value)}
              required
            />
            {form.errors.neighborhood && (
              <span className="text-sm text-red-500">{form.errors.neighborhood}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cidade</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.city}
              onChange={(event) => form.setData('city', event.target.value)}
              required
            />
            {form.errors.city && <span className="text-sm text-red-500">{form.errors.city}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">UF</label>
            <input
              type="text"
              maxLength={2}
              className="mt-1 block w-full rounded-md border-gray-300 uppercase"
              value={form.data.state}
              onChange={(event) => form.setData('state', event.target.value.toUpperCase())}
              required
            />
            {form.errors.state && <span className="text-sm text-red-500">{form.errors.state}</span>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Complemento</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.complement}
              onChange={(event) => form.setData('complement', event.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              form.reset();
            }}
            className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={form.processing}
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
