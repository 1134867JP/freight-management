import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

function DocaIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
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

function IconOff() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64A9 9 0 1 1 5.64 19.36" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

const STATUS_CONFIG = {
  available:   { label: 'Disponível', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', ring: 'ring-green-300 dark:ring-green-700', dot: 'bg-green-500' },
  occupied:    { label: 'Ocupada',    bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-300 dark:ring-amber-700',  dot: 'bg-amber-500' },
  maintenance: { label: 'Manutenção', bg: 'bg-gray-100 dark:bg-gray-700/40',   text: 'text-gray-600 dark:text-gray-400',  ring: 'ring-gray-300 dark:ring-gray-600',   dot: 'bg-gray-400' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function Docas({ docas }) {
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

  const handleDeactivate = (objDoca) => {
    if (!confirmAction(`Desativar a doca "${objDoca.nome}"?`)) return;
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
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Nova Doca
            </button>
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
                  const cfg = STATUS_CONFIG[objDoca.status] ?? STATUS_CONFIG.available;
                  const freightInfo = objDoca.status === 'occupied' && objDoca.freights?.[0];
                  return (
                    <div
                      key={objDoca.id}
                      className={`rounded-xl border p-4 shadow-sm ${cfg.bg} border-opacity-50`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{objDoca.codigo}</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{objDoca.nome}</p>
                        </div>
                        <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${cfg.dot}`} />
                      </div>
                      <p className={`mt-2 text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
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
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                          <StatusBadge status={objDoca.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {objDoca.descricao
                            ? <span className="line-clamp-1">{objDoca.descricao}</span>
                            : <span className="italic text-gray-400 dark:text-gray-500">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${objDoca.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {objDoca.is_active ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(objDoca)}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            >
                              <IconEdit />
                              Editar
                            </button>
                            {objDoca.is_active && (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(objDoca)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                              >
                                <IconOff />
                                Desativar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              {blIsEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
