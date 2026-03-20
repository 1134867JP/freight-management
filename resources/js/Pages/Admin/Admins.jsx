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

export default function Admins({ admins, currentUserId }) {
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
    whatsapp_phone: '',
  });

  const isEditing = Boolean(editingAdmin?.id);

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
      if (!isEditing && (!value || value.length < 8))
        return 'Senha deve ter ao menos 8 caracteres.';
      return null;
    },
  });

  const allErrors = { ...clientErrors, ...errors };

  const resetForm = () => {
    setEditingAdmin(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setData({
      name: admin.name,
      email: admin.email,
      password: '',
      whatsapp_phone: admin.whatsapp_phone ?? '',
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;

    if (isEditing) {
      patch(route('admins.update', editingAdmin.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('admins.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteAdmin = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este administrador?')) {
      router.delete(route('admins.destroy', id), { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Administradores"
          subtitle="Gerencie os administradores desta empresa"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Novo Admin
            </button>
          }
        />
      }
    >
      <Head title="Administradores" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8 dark:bg-gray-800">
            {admins.length === 0 ? (
              <EmptyState title="Nenhum administrador cadastrado" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {admin.name}
                          {admin.id === currentUserId && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Você
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {admin.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {admin.whatsapp_phone || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(admin)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Editar
                          </button>
                          {admin.id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => deleteAdmin(admin.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Excluir
                            </button>
                          )}
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
        title={isEditing ? 'Editar Administrador' : 'Novo Administrador'}
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
