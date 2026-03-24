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

const PERMISSION_LABELS = {
  view_audit_logs: { label: 'Logs de auditoria', description: 'Visualizar o histórico de ações do sistema.' },
  manage_admins: { label: 'Gerenciar administradores', description: 'Criar, editar e excluir administradores.' },
  manage_employees: { label: 'Gerenciar funcionários', description: 'Criar, editar e excluir outros funcionários e suas permissões.' },
};

export default function Employees({ employees, currentUserId }) {
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [permissionsEmployee, setPermissionsEmployee] = useState(null);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    password: '',
    whatsapp_phone: '',
  });

  const isEditing = Boolean(editingEmployee?.id);

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
    setEditingEmployee(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (employee) => {
    setEditingEmployee(employee);
    setData({
      name: employee.name,
      email: employee.email,
      password: '',
      whatsapp_phone: employee.whatsapp_phone ?? '',
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(data)) return;

    if (isEditing) {
      patch(route('employees.update', editingEmployee.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('employees.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteEmployee = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este funcionário?')) {
      router.delete(route('employees.destroy', id), { preserveScroll: true });
    }
  };

  const openPermissions = (employee) => {
    setPermissionsEmployee({
      ...employee,
      permissions: {
        view_audit_logs: false,
        manage_admins: false,
        manage_employees: false,
        ...(employee.permissions ?? {}),
      },
    });
  };

  const handlePermissionToggle = (key) => {
    setPermissionsEmployee((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const savePermissions = () => {
    router.patch(
      route('employees.permissions', permissionsEmployee.id),
      { permissions: permissionsEmployee.permissions },
      {
        preserveScroll: true,
        onSuccess: () => setPermissionsEmployee(null),
      },
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Funcionários"
          subtitle="Gerencie os funcionários e suas permissões"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Novo Funcionário
            </button>
          }
        />
      }
    >
      <Head title="Funcionários" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8 dark:bg-gray-800">
            {employees.length === 0 ? (
              <EmptyState title="Nenhum funcionário cadastrado." />
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
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {employee.name}
                          {employee.id === currentUserId && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Você
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {employee.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {employee.whatsapp_phone || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => openPermissions(employee)}
                            className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
                          >
                            Permissões
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(employee)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Editar
                          </button>
                          {employee.id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => deleteEmployee(employee.id)}
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

      {/* Modal criar/editar */}
      <ModalShell
        show={showCreateModal || isEditing}
        onClose={resetForm}
        title={isEditing ? 'Editar funcionário' : 'Novo funcionário'}
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

      {/* Modal permissões */}
      <ModalShell
        show={Boolean(permissionsEmployee)}
        onClose={() => setPermissionsEmployee(null)}
        title={`Permissões — ${permissionsEmployee?.name ?? ''}`}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Por padrão, funcionários têm acesso a todas as operações. As permissões abaixo estão
            desabilitadas por padrão e podem ser habilitadas individualmente.
          </p>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.entries(PERMISSION_LABELS).map(([permKey, meta]) => (
              <div key={permKey} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{meta.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePermissionToggle(permKey)}
                  className={[
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                    permissionsEmployee?.permissions[permKey]
                      ? 'bg-teal-600'
                      : 'bg-gray-200 dark:bg-gray-600',
                  ].join(' ')}
                  role="switch"
                  aria-checked={permissionsEmployee?.permissions[permKey]}
                >
                  <span
                    className={[
                      'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200',
                      permissionsEmployee?.permissions[permKey] ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPermissionsEmployee(null)}
              className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={savePermissions}
              className="flex-1 rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              Salvar permissões
            </button>
          </div>
        </div>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
