import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

export default function DropoffAddresses({ addresses }) {
  const [editingAddress, setEditingAddress] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const addressesList = addresses?.data || addresses || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    notes: '',
    is_active: true,
  });

  const isEditing = Boolean(editingAddress?.id);

  const resetForm = () => {
    setEditingAddress(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (address) => {
    setEditingAddress(address);
    setData({
      name: address.name || '',
      street: address.street || '',
      number: address.number || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      complement: address.complement || '',
      notes: address.notes || '',
      is_active: address.is_active ?? true,
    });
  };

  const submit = (event) => {
    event.preventDefault();

    if (isEditing) {
      patch(route('dropoff-addresses.update', editingAddress.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('dropoff-addresses.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteAddress = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este endereço?')) {
      router.delete(route('dropoff-addresses.destroy', id), { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Gerenciar Endereços de Descarga"
          subtitle="Cadastre e mantenha os pontos de descarga do pátio"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Novo Endereço
            </button>
          }
        />
      }
    >
      <Head title="Endereços de Descarga" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8">
            {addressesList.length === 0 ? (
              <EmptyState title="Nenhum endereço cadastrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Endereço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Cidade/UF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {addressesList.map((address) => (
                      <tr key={address.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {address.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            {address.street}, {address.number}
                          </div>
                          {address.complement && (
                            <div className="text-xs text-gray-400">({address.complement})</div>
                          )}
                          <div className="text-xs text-gray-400">{address.neighborhood}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {address.city}/{address.state}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge
                            label={address.is_active ? 'Ativo' : 'Inativo'}
                            tone={address.is_active ? 'success' : 'neutral'}
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(address)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAddress(address.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalShell
        show={showCreateModal || isEditing}
        title={isEditing ? 'Editar Endereço' : 'Novo Endereço'}
        onClose={resetForm}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nome/Identificador</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                required
              />
              {errors.name && <span className="text-sm text-red-500">{errors.name}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Logradouro</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.street}
                onChange={(event) => setData('street', event.target.value)}
                required
              />
              {errors.street && <span className="text-sm text-red-500">{errors.street}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.number}
                onChange={(event) => setData('number', event.target.value)}
                required
              />
              {errors.number && <span className="text-sm text-red-500">{errors.number}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bairro</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.neighborhood}
                onChange={(event) => setData('neighborhood', event.target.value)}
                required
              />
              {errors.neighborhood && (
                <span className="text-sm text-red-500">{errors.neighborhood}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cidade</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.city}
                onChange={(event) => setData('city', event.target.value)}
                required
              />
              {errors.city && <span className="text-sm text-red-500">{errors.city}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">UF</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 uppercase"
                maxLength={2}
                value={data.state}
                onChange={(event) => setData('state', event.target.value.toUpperCase())}
                required
              />
              {errors.state && <span className="text-sm text-red-500">{errors.state}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Complemento</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300"
                value={data.complement}
                onChange={(event) => setData('complement', event.target.value)}
              />
              {errors.complement && (
                <span className="text-sm text-red-500">{errors.complement}</span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300"
                rows="3"
                value={data.notes}
                onChange={(event) => setData('notes', event.target.value)}
              />
              {errors.notes && <span className="text-sm text-red-500">{errors.notes}</span>}
            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600"
                  checked={data.is_active}
                  onChange={(event) => setData('is_active', event.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Endereço ativo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
