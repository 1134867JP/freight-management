import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { useClientValidation } from '@/hooks/useClientValidation';
import { isValidEmail, isValidWhatsApp } from '@/utils/validation';
import { Head, useForm, router } from '@inertiajs/react';

export default function Clients({ clients }) {
  const [editingClient, setEditingClient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const clientsList = clients?.data || clients || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
    whatsapp_phone: '',
  });

  const isEditing = Boolean(editingClient?.id);

  const { clientErrors, validate, clearClientError } = useClientValidation({
    name: (value) =>
      !value || value.trim().length < 2 ? 'Nome deve ter ao menos 2 caracteres.' : null,
    email: (value) => {
      if (!value) return 'Email é obrigatório.';
      if (!isValidEmail(value)) return 'Email inválido.';
      return null;
    },
    whatsapp_phone: (value) => {
      if (value && !isValidWhatsApp(value)) return 'WhatsApp inválido (10–15 dígitos).';
      return null;
    },
    password: (value) => {
      if (!isEditing && (!value || value.length < 6))
        return 'Senha deve ter ao menos 6 caracteres.';
      return null;
    },
  });

  const allErrors = { ...clientErrors, ...errors };

  const resetForm = () => {
    setEditingClient(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;
    submit(event);
  };

  const startEdit = (client) => {
    setEditingClient(client);
    setData({
      name: client.name,
      email: client.email,
      password: '',
      whatsapp_phone: client.whatsapp_phone ?? '',
    });
  };

  const submit = (event) => {
    event.preventDefault();

    if (isEditing) {
      patch(route('clients.update', editingClient.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('clients.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteClient = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este cliente?')) {
      router.delete(route('clients.destroy', id), { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Gerenciar Clientes"
          subtitle="Cadastre e mantenha os clientes do pátio"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Novo Cliente
            </button>
          }
        />
      }
    >
      <Head title="Clientes" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8">
            {clientsList.length === 0 ? (
              <EmptyState title="Nenhum cliente cadastrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {clientsList.map((client) => (
                      <tr key={client.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {client.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {client.whatsapp_phone || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(client)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClient(client.id)}
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
        onClose={resetForm}
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nome" error={allErrors.name} required>
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

          <FormField label="Email" error={allErrors.email} required>
            <FormField.Input
              type="email"
              error={allErrors.email}
              value={data.email}
              onChange={(event) => {
                setData('email', event.target.value);
                clearClientError('email');
              }}
              required
            />
          </FormField>

          <FormField
            label="WhatsApp"
            error={allErrors.whatsapp_phone}
            hint="Informe com DDI e apenas números."
          >
            <FormField.Input
              type="tel"
              inputMode="numeric"
              placeholder="5511999999999"
              error={allErrors.whatsapp_phone}
              value={data.whatsapp_phone}
              onChange={(event) => {
                setData('whatsapp_phone', event.target.value);
                clearClientError('whatsapp_phone');
              }}
            />
          </FormField>

          <FormField
            label={isEditing ? 'Nova senha (opcional)' : 'Senha'}
            error={allErrors.password}
            required={!isEditing}
          >
            <FormField.Input
              type="password"
              error={allErrors.password}
              value={data.password}
              onChange={(event) => {
                setData('password', event.target.value);
                clearClientError('password');
              }}
              required={!isEditing}
            />
          </FormField>

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
