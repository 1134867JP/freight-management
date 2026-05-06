import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

const TYPE_COLORS = {
  parking:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  staging:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  hazmat:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  refrigerated: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  inspection:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gate:         'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function YardZones({ zones, tipos }) {
  const [editing, setEditing]     = useState(null);
  const [showCreate, setCreate]   = useState(false);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    nome: '', codigo: '', tipo: 'parking', descricao: '', ordem: 0, is_active: true,
  });

  const isEditing = Boolean(editing?.id);

  const resetForm = () => { setEditing(null); setCreate(false); clearErrors(); reset(); };

  const startEdit = z => {
    setEditing(z);
    setData({ nome: z.nome, codigo: z.codigo, tipo: z.tipo, descricao: z.descricao || '', ordem: z.ordem || 0, is_active: z.is_active ?? true });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (isEditing) {
      patch(route('yard-zones.update', editing.id), { onSuccess: resetForm, preserveScroll: true });
    } else {
      post(route('yard-zones.store'), { onSuccess: resetForm, preserveScroll: true });
    }
  };

  const handleDeactivate = z => {
    if (!confirmAction(`Desativar a zona "${z.nome}"?`)) return;
    router.delete(route('yard-zones.destroy', z.id), { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout header={
      <PageHeader
        title="Zonas do Pátio"
        subtitle="Defina as áreas físicas do seu pátio"
        actions={
          <div className="flex gap-2">
            <a href={route('admin.yard-map')} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Ver Mapa
            </a>
            <button type="button" onClick={() => setCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              + Nova Zona
            </button>
          </div>
        }
      />
    }>
      <Head title="Zonas do Pátio" />
      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="mb-4 flex gap-2">
            <a href={route('yard-spots.index')} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              Gerenciar Vagas →
            </a>
          </div>

          {zones.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <EmptyState title="Nenhuma zona cadastrada." />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Código', 'Nome', 'Tipo', 'Vagas', 'Ordem', 'Ativa', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {zones.map(z => (
                    <tr key={z.id} className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/50 ${!z.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{z.codigo}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{z.nome}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[z.tipo] || TYPE_COLORS.gate}`}>
                          {tipos?.find(t => t.value === z.tipo)?.label || z.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{z.spots_count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{z.ordem}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${z.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                          {z.is_active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(z)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Editar
                          </button>
                          {z.is_active && (
                            <button onClick={() => handleDeactivate(z)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
          )}
        </div>
      </div>

      <ModalShell show={showCreate || isEditing} title={isEditing ? 'Editar Zona' : 'Nova Zona'} onClose={resetForm}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome" error={errors.nome} required>
              <FormField.Input type="text" value={data.nome} onChange={e => setData('nome', e.target.value)} error={errors.nome} required />
            </FormField>
            <FormField label="Código" error={errors.codigo} required>
              <FormField.Input type="text" value={data.codigo} onChange={e => setData('codigo', e.target.value.toUpperCase())} error={errors.codigo} placeholder="Ex: EST-A" required />
            </FormField>
          </div>
          <FormField label="Tipo" error={errors.tipo} required>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.tipo)}`} value={data.tipo} onChange={e => setData('tipo', e.target.value)}>
              {(tipos || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ordem de exibição" error={errors.ordem}>
              <FormField.Input type="number" value={data.ordem} onChange={e => setData('ordem', parseInt(e.target.value) || 0)} error={errors.ordem} min={0} />
            </FormField>
            <FormField label="Status">
              <label className="mt-3 flex items-center gap-2">
                <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ativa</span>
              </label>
            </FormField>
          </div>
          <FormField label="Descrição" error={errors.descricao}>
            <textarea className={`mt-1 block w-full ${FormField.inputClass(errors.descricao)}`} value={data.descricao} onChange={e => setData('descricao', e.target.value)} rows="2" />
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
