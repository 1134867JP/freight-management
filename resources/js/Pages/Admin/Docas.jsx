import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import FormActions from '@/Components/UI/FormActions';
import StatusBadge from '@/Components/UI/StatusBadge';
import TableShell from '@/Components/UI/TableShell';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, useForm, router } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import { getStatusPresentation } from '@/utils/statusPresentation';

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconOff() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64A9 9 0 1 1 5.64 19.36" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function Docas({ docas }) {
  const confirm = useConfirm();
  const [editingDoca, setEditingDoca] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const arrDocas = docas || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    nome: '',
    codigo: '',
    descricao: '',
    is_active: true,
    status: 'available',
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
      nome:      objDoca.nome || '',
      codigo:    objDoca.codigo || '',
      descricao: objDoca.descricao || '',
      is_active: objDoca.is_active ?? true,
      status:    objDoca.status || 'available',
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

  const handleDeactivate = async (objDoca) => {
    if (!(await confirm(`Desativar a doca "${objDoca.nome}"?`))) return;
    router.delete(route('docas.destroy', objDoca.id), { preserveScroll: true });
  };

  const strModalTitle = blIsEditing ? 'Editar Doca' : 'Nova Doca';

  const countByStatus = arrDocas.reduce((acc, d) => {
    const s = d.status || 'available';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Docas / Baias"
          subtitle="Gerencie as docas e baias do pátio"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Nova Doca
            </Button>
          }
        />
      }
    >
      <Head title="Docas" />

      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          {/* Contadores de status */}
          {arrDocas.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{arrDocas.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              </div>
              {countByStatus.available > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                  <span className="text-2xl font-black text-green-700 dark:text-green-400">{countByStatus.available}</span>
                  <span className="text-sm text-green-600 dark:text-green-500">Disponíveis</span>
                </div>
              )}
              {countByStatus.occupied > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{countByStatus.occupied}</span>
                  <span className="text-sm text-amber-600 dark:text-amber-500">Ocupadas</span>
                </div>
              )}
              {countByStatus.maintenance > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-700/40">
                  <span className="text-2xl font-black text-gray-500 dark:text-gray-400">{countByStatus.maintenance}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Manutenção</span>
                </div>
              )}
            </div>
          )}

          {/* Cards de status ao vivo */}
          {arrDocas.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Status ao vivo
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {arrDocas.filter(d => d.is_active).map((objDoca) => {
                  const presentation = getStatusPresentation('dock', objDoca.status);
                  return (
                    <div
                      key={objDoca.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{objDoca.codigo}</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{objDoca.nome}</p>
                        </div>
                        <StatusBadge label={presentation.label} tone={presentation.tone} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela de gerenciamento */}
          {arrDocas.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <EmptyState title="Nenhuma doca cadastrada." />
            </div>
          ) : (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Gerenciamento
              </h2>
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Código</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Nome</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Notas</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Ativa</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {arrDocas.map((objDoca) => (
                      <tr
                        key={objDoca.id}
                        className={`transition hover:bg-gray-50/70 dark:hover:bg-gray-700/50 ${!objDoca.is_active ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{objDoca.codigo}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{objDoca.nome}</td>
                        <td className="px-4 py-3">
                          <StatusBadge {...getStatusPresentation('dock', objDoca.status)} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {objDoca.descricao
                            ? <span className="line-clamp-1">{objDoca.descricao}</span>
                            : <span className="italic text-gray-400 dark:text-gray-500">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={objDoca.is_active ? 'Ativa' : 'Inativa'} tone={objDoca.is_active ? 'success' : 'neutral'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => startEdit(objDoca)}
                              size="sm"
                              variant="secondary"
                            >
                              <IconEdit />
                              Editar
                            </Button>
                            {objDoca.is_active && (
                              <Button
                                onClick={() => handleDeactivate(objDoca)}
                                size="sm"
                                variant="danger"
                              >
                                <IconOff />
                                Desativar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome" error={errors.nome} required>
              <FormField.Input
                type="text"
                error={errors.nome}
                value={data.nome}
                onChange={(e) => setData('nome', e.target.value)}
                required
              />
            </FormField>

            <FormField label="Código" error={errors.codigo} required>
              <FormField.Input
                type="text"
                error={errors.codigo}
                value={data.codigo}
                onChange={(e) => setData('codigo', e.target.value.toUpperCase())}
                placeholder="Ex: D01"
                required
              />
            </FormField>
          </div>

          <FormField label="Notas" error={errors.descricao}>
            <textarea
              className={`mt-1 block w-full ${FormField.inputClass(errors.descricao)}`}
              value={data.descricao}
              onChange={(e) => setData('descricao', e.target.value)}
              rows="2"
              placeholder="Ex: Reservada para carretas"
            />
          </FormField>

          {blIsEditing && (
            <FormField label="Status operacional" error={errors.status}>
              <select
                className={`mt-1 block w-full ${FormField.inputClass(errors.status)}`}
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
              >
                <option value="available">Disponível</option>
                <option value="maintenance">Manutenção</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">O status "Ocupada" é gerenciado automaticamente pelo sistema.</p>
            </FormField>
          )}

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

          <FormActions>
            <Button variant="secondary" className="flex-1" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={processing}>{blIsEditing ? 'Salvar' : 'Criar'}</Button>
          </FormActions>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
