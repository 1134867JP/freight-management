import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import FormField from '@/Components/UI/FormField';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useClientValidation } from '@/hooks/useClientValidation';
import { Head, useForm, router } from '@inertiajs/react';
import Button from '@/Components/UI/Button';

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

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
    is_active: true,
  });

  const confirm = useConfirm();
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
      is_active: address.is_active ?? true,
    });
  };

  const deleteAddress = async (id) => {
    const ok = await confirm('Tem certeza que deseja excluir este endereço?');
    if (ok) {
      router.delete(route('dropoff-addresses.destroy', id), { preserveScroll: true });
    }
  };

  const activeCount = addressesList.filter((a) => a.is_active).length;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Endereços de Descarga"
          subtitle="Cadastre e mantenha os pontos de descarga do pátio"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Endereço
            </Button>
          }
        />
      }
    >
      <Head title="Endereços de Descarga" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          {addressesList.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{addressesList.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                <span className="text-2xl font-black text-green-700 dark:text-green-400">{activeCount}</span>
                <span className="text-sm text-green-600 dark:text-green-500">Ativos</span>
              </div>
              {addressesList.length - activeCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-700/40">
                  <span className="text-2xl font-black text-gray-500 dark:text-gray-400">{addressesList.length - activeCount}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Inativos</span>
                </div>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {addressesList.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Nenhum endereço cadastrado." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/60">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Nome / Identificador
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Endereço
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Cidade / UF
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {addressesList.map((address) => (
                      <tr key={address.id} className="transition hover:bg-gray-50/70 dark:hover:bg-gray-700/40">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{address.name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <p>{address.street}{address.number ? `, ${address.number}` : ''}</p>
                          {address.complement && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">({address.complement})</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">{address.neighborhood}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {address.city} / {address.state}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={address.is_active ? 'Ativo' : 'Inativo'}
                            tone={address.is_active ? 'success' : 'neutral'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(address)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
                            >
                              <IconEdit />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAddress(address.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                            >
                              <IconTrash />
                              Excluir
                            </button>
                          </div>
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
              label="Nome / Identificador"
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

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-700"
                  checked={data.is_active}
                  onChange={(event) => setData('is_active', event.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Endereço ativo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={processing}>{isEditing ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
