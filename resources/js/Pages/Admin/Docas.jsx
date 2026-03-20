import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

export default function Docas({ docas }) {
  const [editingDoca, setEditingDoca] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const arrDocas = docas || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    nome: '',
    descricao: '',
    is_active: true,
  });

  const blIsEditing = Boolean(editingDoca?.id);

  const resetForm = () => {
    setEditingDoca(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (objDoca) => {
    setEditingDoca(objDoca);
    setData({
      nome: objDoca.nome || '',
      descricao: objDoca.descricao || '',
      is_active: objDoca.is_active ?? true,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (blIsEditing) {
      patch(route('docas.update', editingDoca.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('docas.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const handleDelete = (objDoca) => {
    if (!confirmAction(`Excluir doca "${objDoca.nome}"?`)) return;
    router.delete(route('docas.destroy', objDoca.id), { preserveScroll: true });
  };

  const strModalTitle = blIsEditing ? 'Editar Doca' : 'Nova Doca';

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Docas / Baias"
          subtitle="Gerencie as docas e baias do pátio"
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              + Nova Doca
            </button>
          }
        />
      }
    >
      <Head title="Docas" />

      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <FlashMessages />

          {arrDocas.length === 0 ? (
            <EmptyState title="Nenhuma doca cadastrada." />
          ) : (
            <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {arrDocas.map((objDoca) => (
                    <tr key={objDoca.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {objDoca.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {objDoca.descricao || <span className="italic text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            objDoca.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {objDoca.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => startEdit(objDoca)}
                          className="mr-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(objDoca)}
                          className="text-sm text-red-600 hover:underline dark:text-red-400"
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

      <ModalShell
        show={showCreateModal || blIsEditing}
        title={strModalTitle}
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nome" error={errors.nome} required>
            <FormField.Input
              type="text"
              error={errors.nome}
              value={data.nome}
              onChange={(e) => setData('nome', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Descrição" error={errors.descricao}>
            <textarea
              className={`mt-1 block w-full ${FormField.inputClass(errors.descricao)}`}
              value={data.descricao}
              onChange={(e) => setData('descricao', e.target.value)}
              rows="3"
            />
          </FormField>

          <FormField label="Status">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={data.is_active}
                onChange={(e) => setData('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativa</span>
            </label>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {blIsEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
