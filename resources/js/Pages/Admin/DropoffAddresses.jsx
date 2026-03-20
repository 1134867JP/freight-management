import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { useClientValidation } from '@/hooks/useClientValidation';
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

  const { clientErrors, validate, clearClientError } = useClientValidation({
    street: (value) => (!value || !value.trim() ? 'Logradouro é obrigatório.' : null),
    neighborhood: (value) => (!value || !value.trim() ? 'Bairro é obrigatório.' : null),
    city: (value) => (!value || !value.trim() ? 'Cidade é obrigatória.' : null),
    state: (value) =>
      !/^[A-Z]{2}$/.test(value || '') ? 'UF deve ter exatamente 2 letras maiúsculas.' : null,
  });

  const allErrors = { ...clientErrors, ...errors };

  const resetForm = () => {
    setEditingAddress(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;
    submit(event);
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

          <div className="rounded-lg bg-white p-4 shadow sm:p-8 dark:bg-gray-800">
            {addressesList.length === 0 ? (
              <EmptyState title="Nenhum endereço cadastrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Endereço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Cidade/UF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {addressesList.map((address) => (
                      <tr key={address.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {address.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            {address.street}, {address.number}
                          </div>
                          {address.complement && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">({address.complement})</div>
                          )}
                          <div className="text-xs text-gray-400 dark:text-gray-500">{address.neighborhood}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Nome/Identificador"
              error={allErrors.name}
              required
              className="md:col-span-2"
            >
              <FormField.Input
                type="text"
                error={allErrors.name}
                value={data.name}
                onChange={(event) => {
                  setData('name', event.target.value);
                  clearClientError('name');
                }}
                required
              />
            </FormField>

            <FormField label="Logradouro" error={allErrors.street} required>
              <FormField.Input
                type="text"
                error={allErrors.street}
                value={data.street}
                onChange={(event) => {
                  setData('street', event.target.value);
                  clearClientError('street');
                }}
                required
              />
            </FormField>

            <FormField label="Número" error={allErrors.number}>
              <FormField.Input
                type="text"
                error={allErrors.number}
                value={data.number}
                onChange={(event) => setData('number', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Bairro" error={allErrors.neighborhood} required>
              <FormField.Input
                type="text"
                error={allErrors.neighborhood}
                value={data.neighborhood}
                onChange={(event) => {
                  setData('neighborhood', event.target.value);
                  clearClientError('neighborhood');
                }}
                required
              />
            </FormField>

            <FormField label="Cidade" error={allErrors.city} required>
              <FormField.Input
                type="text"
                error={allErrors.city}
                value={data.city}
                onChange={(event) => {
                  setData('city', event.target.value);
                  clearClientError('city');
                }}
                required
              />
            </FormField>

            <FormField label="UF" error={allErrors.state} required>
              <FormField.Input
                type="text"
                className="uppercase"
                maxLength={2}
                error={allErrors.state}
                value={data.state}
                onChange={(event) => {
                  setData('state', event.target.value.toUpperCase());
                  clearClientError('state');
                }}
                required
              />
            </FormField>

            <FormField label="Complemento" error={allErrors.complement} className="md:col-span-2">
              <FormField.Input
                type="text"
                error={allErrors.complement}
                value={data.complement}
                onChange={(event) => setData('complement', event.target.value)}
              />
            </FormField>

            <FormField label="Observações" error={allErrors.notes} className="md:col-span-2">
              <textarea
                className={`mt-1 block w-full ${FormField.inputClass(allErrors.notes)}`}
                aria-invalid={Boolean(allErrors.notes)}
                rows="3"
                value={data.notes}
                onChange={(event) => setData('notes', event.target.value)}
              />
            </FormField>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600"
                  checked={data.is_active}
                  onChange={(event) => setData('is_active', event.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Endereço ativo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
