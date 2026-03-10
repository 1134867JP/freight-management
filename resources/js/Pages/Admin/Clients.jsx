import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

export default function Clients({ clients }) {
  const [editingClient, setEditingClient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const clientsList = clients?.data || clients || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
  });

  const isEditing = Boolean(editingClient?.id);

  const resetForm = () => {
    setEditingClient(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (client) => {
    setEditingClient(client);
    setData({
      name: client.name,
      email: client.email,
      password: '',
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
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
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
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={data.email}
              onChange={(event) => setData('email', event.target.value)}
              required
            />
            {errors.email && <span className="text-sm text-red-500">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {isEditing ? 'Nova senha (opcional)' : 'Senha'}
            </label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={data.password}
              onChange={(event) => setData('password', event.target.value)}
              required={!isEditing}
            />
            {errors.password && <span className="text-sm text-red-500">{errors.password}</span>}
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
