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
import Button from '@/Components/UI/Button';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, useForm, router } from '@inertiajs/react';
import { getStatusPresentation } from '@/utils/statusPresentation';

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
          <Button onClick={() => setCreate(true)}>
            + Novo Cavalo
          </Button>
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
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['ID', 'Modelo', 'Status', 'Operador', 'Ativa', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {arrTrucks.map(t => (
                      <tr key={t.id} className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/50 ${!t.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-gray-100">{t.identificador}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.modelo || <span className="italic text-gray-400">—</span>}</td>
                        <td className="px-4 py-3">
                          <StatusBadge {...getStatusPresentation('yardTruck', t.status)} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.operador?.name || <span className="italic text-gray-400">—</span>}</td>
                        <td className="px-4 py-3">
                          <StatusBadge label={t.is_active ? 'Ativo' : 'Inativo'} tone={t.is_active ? 'success' : 'neutral'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => startEdit(t)}>
                              Editar
                            </Button>
                            {t.is_active && (
                              <Button size="sm" variant="danger" onClick={() => handleDeactivate(t)}>
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
          <FormActions>
            <Button variant="secondary" className="flex-1" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" loading={processing} className="flex-1">
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </FormActions>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
