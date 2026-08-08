import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import FormActions from '@/Components/UI/FormActions';
import IconButton from '@/Components/UI/IconButton';
import TableShell from '@/Components/UI/TableShell';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { useClientValidation } from '@/hooks/useClientValidation';
import { isValidEmail, isValidWhatsApp } from '@/utils/validation';
import { Head, useForm, router } from '@inertiajs/react';
import Button from '@/Components/UI/Button';

const AVATAR_COLORS = [
  'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
];

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
      {initials}
    </span>
  );
}

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

  const confirm = useConfirm();
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

  const deleteClient = async (id) => {
    const ok = await confirm('Tem certeza que deseja excluir este cliente?');
    if (ok) {
      router.delete(route('clients.destroy', id), { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Clientes"
          subtitle="Cadastre e mantenha os clientes do pátio"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Cliente
            </Button>
          }
        />
      }
    >
      <Head title="Clientes" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <TableShell>
            {clientsList.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19.5a5 5 0 0 1 10 0M13 19.5a4 4 0 0 1 8 0" />
                  </svg>
                }
                title="Nenhum cliente cadastrado ainda."
                description="Clique em 'Novo Cliente' para adicionar o primeiro."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                        Cliente
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {clientsList.map((client, index) => (
                      <tr
                        key={client.id}
                        className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
                          index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={client.name} />
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {client.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {client.email}
                        </td>
                        <td className="px-6 py-4">
                          {client.whatsapp_phone ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                              </svg>
                              {client.whatsapp_phone}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <IconButton
                              onClick={() => startEdit(client)}
                              icon={<IconEdit />}
                              label="Editar cliente"
                              variant="secondary"
                            />
                            <IconButton
                              onClick={() => deleteClient(client.id)}
                              icon={<IconTrash />}
                              label="Excluir cliente"
                              variant="danger"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TableShell>
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

          <FormActions>
            <Button variant="secondary" className="flex-1" onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={processing}>
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </FormActions>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
