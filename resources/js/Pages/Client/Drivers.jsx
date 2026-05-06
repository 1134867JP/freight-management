import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

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

function DriverIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

function formatPhone(raw) {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function formatCpf(raw) {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

export default function Drivers({ drivers }) {
  const driversList = useMemo(() => (Array.isArray(drivers) ? drivers : drivers?.data || []), [drivers]);

  const [editingDriver, setEditingDriver] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    nome: '',
    phone: '',
    cpf: '',
    notas: '',
    is_active: true,
  });

  const isEditing = Boolean(editingDriver?.id);

  const resetForm = () => {
    setEditingDriver(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (driver) => {
    setEditingDriver(driver);
    clearErrors();
    setData({
      nome: driver.nome ?? '',
      phone: driver.phone ?? '',
      cpf: driver.cpf ?? '',
      notas: driver.notas ?? '',
      is_active: Boolean(driver.is_active),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing) {
      patch(route('client.drivers.update', editingDriver.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('client.drivers.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteDriver = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este motorista?')) {
      router.delete(route('client.drivers.destroy', id), { preserveScroll: true });
    }
  };

  const activeCount = driversList.filter((d) => d.is_active).length;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Meus Motoristas"
          subtitle="Cadastre os motoristas vinculados às suas operações"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Motorista
            </button>
          }
        />
      }
    >
      <Head title="Motoristas" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          {driversList.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{driversList.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                <span className="text-2xl font-black text-green-700 dark:text-green-400">{activeCount}</span>
                <span className="text-sm text-green-600 dark:text-green-500">Ativos</span>
              </div>
              {driversList.length - activeCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-700/40">
                  <span className="text-2xl font-black text-gray-500 dark:text-gray-400">{driversList.length - activeCount}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Inativos</span>
                </div>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {driversList.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Nenhum motorista cadastrado ainda." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/60">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Nome
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        WhatsApp
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        CPF
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Observações
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
                    {driversList.map((driver) => (
                      <tr key={driver.id} className="transition hover:bg-gray-50/70 dark:hover:bg-gray-700/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              <DriverIcon />
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {driver.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {driver.phone ? formatPhone(driver.phone) : <span className="text-gray-400 dark:text-gray-500">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {driver.cpf ? formatCpf(driver.cpf) : <span className="text-gray-400 dark:text-gray-500">—</span>}
                        </td>
                        <td className="max-w-[240px] px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {driver.notas ? (
                            <span className="block truncate" title={driver.notas}>{driver.notas}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={driver.is_active ? 'Ativo' : 'Inativo'}
                            tone={driver.is_active ? 'success' : 'neutral'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(driver)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            >
                              <IconEdit />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDriver(driver.id)}
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
        title={isEditing ? `Editar Motorista — ${editingDriver?.nome}` : 'Novo Motorista'}
        onClose={resetForm}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={data.nome}
              onChange={(e) => setData('nome', e.target.value)}
              placeholder="Ex.: João da Silva"
              maxLength={100}
              required
            />
            {errors.nome && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nome}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              WhatsApp <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="tel"
              className={inputClass}
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              placeholder="Ex.: 11999990000"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              O QR Code de entrada será enviado para este número ao reservar uma cota.
            </p>
            {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CPF <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={data.cpf}
              onChange={(e) => setData('cpf', e.target.value)}
              placeholder="Ex.: 000.000.000-00"
              maxLength={14}
            />
            {errors.cpf && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cpf}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observações <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={data.notas}
              onChange={(e) => setData('notas', e.target.value)}
              placeholder="Ex.: habilitação categoria E, restrições, etc."
            />
            {errors.notas && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.notas}</p>}
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600"
                checked={data.is_active}
                onChange={(e) => setData('is_active', e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motorista ativo</span>
            </label>
          </div>

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
              {isEditing ? 'Salvar alterações' : 'Adicionar motorista'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
