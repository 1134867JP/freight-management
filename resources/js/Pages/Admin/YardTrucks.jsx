import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, useForm, router } from '@inertiajs/react';

const STATUS_CFG = {
  available: { label: 'Disponível', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  busy:      { label: 'Em operação', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function YardTrucks({ trucks, operators }) {
  const confirm = useConfirm();
  const [editing, setEditing]   = useState(null);
  const [showCreate, setCreate] = useState(false);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    identificador: '', modelo: '', operador_id: '', notas: '', is_active: true,
  });

  const isEditing = Boolean(editing?.id);
  const resetForm = () => { setEditing(null); setCreate(false); clearErrors(); reset(); };

  const startEdit = t => {
    setEditing(t);
    setData({ identificador: t.identificador, modelo: t.modelo || '', operador_id: t.operador_id || '', notas: t.notas || '', is_active: t.is_active ?? true });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (isEditing) {
      patch(route('yard-trucks.update', editing.id), { onSuccess: resetForm, preserveScroll: true });
    } else {
      post(route('yard-trucks.store'), { onSuccess: resetForm, preserveScroll: true });
    }
  };

  const handleDeactivate = async t => {
    if (!(await confirm(`Desativar o cavalo "${t.identificador}"?`))) return;
    router.delete(route('yard-trucks.destroy', t.id), { preserveScroll: true });
  };

  const arrTrucks = trucks || [];
  const avail = arrTrucks.filter(t => t.status === 'available' && t.is_active).length;
  const busy  = arrTrucks.filter(t => t.status === 'busy').length;

  return (
    <AuthenticatedLayout header={
      <PageHeader
        title="Cavalos Mecânicos de Pátio"
        subtitle="Veículos internos para movimentação de trailers"
        actions={
          <button type="button" onClick={() => setCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            + Novo Cavalo
          </button>
        }
      />
    }>
      <Head title="Cavalos de Pátio" />
      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <FlashMessages />

          {arrTrucks.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{arrTrucks.length}</span>
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                <span className="text-2xl font-black text-green-700 dark:text-green-400">{avail}</span>
                <span className="text-sm text-green-600">Disponíveis</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{busy}</span>
                <span className="text-sm text-amber-600">Em operação</span>
              </div>
            </div>
          )}

          {arrTrucks.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <EmptyState title="Nenhum cavalo mecânico cadastrado." />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['ID', 'Modelo', 'Status', 'Operador', 'Ativa', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {arrTrucks.map(t => {
                    const cfg = STATUS_CFG[t.status] || STATUS_CFG.available;
                    return (
                      <tr key={t.id} className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/50 ${!t.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">{t.identificador}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.modelo || <span className="italic text-gray-400">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.operador?.name || <span className="italic text-gray-400">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                            {t.is_active ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(t)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              Editar
                            </button>
                            {t.is_active && (
                              <button onClick={() => handleDeactivate(t)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Desativar
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

      <ModalShell show={showCreate || isEditing} title={isEditing ? 'Editar Cavalo' : 'Novo Cavalo Mecânico'} onClose={resetForm}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Identificador" error={errors.identificador} required>
              <FormField.Input type="text" value={data.identificador} onChange={e => setData('identificador', e.target.value.toUpperCase())} error={errors.identificador} placeholder="Ex: YT-001" required />
            </FormField>
            <FormField label="Modelo" error={errors.modelo}>
              <FormField.Input type="text" value={data.modelo} onChange={e => setData('modelo', e.target.value)} error={errors.modelo} placeholder="Ex: Ford Cargo" />
            </FormField>
          </div>
          <FormField label="Operador responsável" error={errors.operador_id}>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.operador_id)}`} value={data.operador_id} onChange={e => setData('operador_id', e.target.value)}>
              <option value="">— Nenhum —</option>
              {(operators || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </FormField>
          <FormField label="Notas" error={errors.notas}>
            <textarea className={`mt-1 block w-full ${FormField.inputClass(errors.notas)}`} value={data.notas} onChange={e => setData('notas', e.target.value)} rows="2" />
          </FormField>
          <FormField label="Status">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativo</span>
            </label>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={resetForm} className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">Cancelar</button>
            <button type="submit" disabled={processing} className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
