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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
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

function IconShield() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

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

  const enabledCount = (employee) =>
    Object.values(employee.permissions ?? {}).filter(Boolean).length;

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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Funcionário
            </button>
          }
        />
      }
    >
      <Head title="Funcionários" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {employees.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Nenhum funcionário cadastrado." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/60">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Funcionário
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Permissões
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {employees.map((employee) => {
                      const nrEnabled = enabledCount(employee);
                      return (
                        <tr key={employee.id} className="transition hover:bg-gray-50/70 dark:hover:bg-gray-700/40">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={employee.name} />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {employee.name}
                                </p>
                                {employee.id === currentUserId && (
                                  <span className="mt-0.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    Você
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {employee.email}
                          </td>
                          <td className="px-6 py-4">
                            {employee.whatsapp_phone ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                </svg>
                                {employee.whatsapp_phone}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {nrEnabled > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-800">
                                {nrEnabled} habilitada{nrEnabled > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Padrão</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openPermissions(employee)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
                              >
                                <IconShield />
                                Permissões
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(employee)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                              >
                                <IconEdit />
                                Editar
                              </button>
                              {employee.id !== currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => deleteEmployee(employee.id)}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                >
                                  <IconTrash />
                                  Excluir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={savePermissions}
              className="flex-1 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Salvar permissões
            </button>
          </div>
        </div>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
