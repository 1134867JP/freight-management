import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';

const STATUS_BADGE = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  occupied:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blocked:   'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const STATUS_LABEL = { available: 'Disponível', occupied: 'Ocupada', blocked: 'Bloqueada' };

function SpotRow({ spot, onEdit, onDeactivate }) {
  return (
    <tr className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/50 ${!spot.is_active ? 'opacity-50' : ''}`}>
      <td className="px-4 py-2.5 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{spot.nome}</td>
      <td className="px-4 py-2.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[spot.status] || STATUS_BADGE.available}`}>
          {STATUS_LABEL[spot.status] || spot.status}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex gap-1">
          {spot.suporta_reefer    && <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">Reefer</span>}
          {spot.suporta_hazmat    && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">Hazmat</span>}
          {spot.suporta_oversized && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Oversized</span>}
          {!spot.suporta_reefer && !spot.suporta_hazmat && !spot.suporta_oversized && <span className="text-gray-400">—</span>}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <button onClick={() => onEdit(spot)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Editar
          </button>
          {spot.is_active && spot.status !== 'occupied' && (
            <button onClick={() => onDeactivate(spot)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              Desativar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function YardSpots({ zones }) {
  const [editing, setEditing]   = useState(null);
  const [showCreate, setCreate] = useState(false);

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    yard_zone_id: zones[0]?.id || '', nome: '', suporta_reefer: false,
    suporta_oversized: false, suporta_hazmat: false, notas: '', is_active: true,
  });

  const isEditing = Boolean(editing?.id);
  const resetForm = () => { setEditing(null); setCreate(false); clearErrors(); reset(); };

  const startEdit = s => {
    setEditing(s);
    setData({
      yard_zone_id: s.yard_zone_id, nome: s.nome,
      suporta_reefer: s.suporta_reefer, suporta_oversized: s.suporta_oversized,
      suporta_hazmat: s.suporta_hazmat, notas: s.notas || '', is_active: s.is_active ?? true,
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (isEditing) {
      patch(route('yard-spots.update', editing.id), { onSuccess: resetForm, preserveScroll: true });
    } else {
      post(route('yard-spots.store'), { onSuccess: resetForm, preserveScroll: true });
    }
  };

  const handleDeactivate = s => {
    if (!confirmAction(`Desativar a vaga "${s.nome}"?`)) return;
    router.delete(route('yard-spots.destroy', s.id), { preserveScroll: true });
  };

  const allSpots = zones.flatMap(z => z.spots || []);

  return (
    <AuthenticatedLayout header={
      <PageHeader
        title="Vagas do Pátio"
        subtitle="Vagas individuais dentro das zonas"
        actions={
          <div className="flex gap-2">
            <a href={route('yard-zones.index')} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              ← Zonas
            </a>
            <a href={route('admin.yard-map')} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Ver Mapa
            </a>
            <button type="button" onClick={() => setCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              + Nova Vaga
            </button>
          </div>
        }
      />
    }>
      <Head title="Vagas do Pátio" />
      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          {/* Stats */}
          {allSpots.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              {[
                { label: 'Total', value: allSpots.length, cls: 'border-gray-200 dark:border-gray-700' },
                { label: 'Disponíveis', value: allSpots.filter(s => s.status === 'available').length, cls: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' },
                { label: 'Ocupadas', value: allSpots.filter(s => s.status === 'occupied').length, cls: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' },
                { label: 'Bloqueadas', value: allSpots.filter(s => s.status === 'blocked').length, cls: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/40' },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 shadow-sm ${s.cls} bg-white dark:bg-gray-800`}>
                  <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{s.value}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {zones.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <EmptyState title="Nenhuma zona cadastrada. Crie zonas primeiro." />
            </div>
          ) : (
            zones.map(zone => (
              <div key={zone.id} className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {zone.nome} <span className="font-mono text-xs">({zone.codigo})</span>
                </h3>
                {(zone.spots || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center dark:border-gray-600 dark:bg-gray-800">
                    <p className="text-sm text-gray-400">Nenhuma vaga nesta zona.</p>
                    <button onClick={() => { setCreate(true); setData(d => ({ ...d, yard_zone_id: zone.id })); }} className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">
                      + Adicionar vaga aqui
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {['Vaga', 'Status', 'Suporta', 'Ações'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {zone.spots.map(spot => (
                          <SpotRow key={spot.id} spot={spot} onEdit={startEdit} onDeactivate={handleDeactivate} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ModalShell show={showCreate || isEditing} title={isEditing ? 'Editar Vaga' : 'Nova Vaga'} onClose={resetForm}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Zona" error={errors.yard_zone_id} required>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.yard_zone_id)}`} value={data.yard_zone_id} onChange={e => setData('yard_zone_id', e.target.value)}>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nome} ({z.codigo})</option>)}
            </select>
          </FormField>
          <FormField label="Nome da vaga" error={errors.nome} required>
            <FormField.Input type="text" value={data.nome} onChange={e => setData('nome', e.target.value.toUpperCase())} error={errors.nome} placeholder="Ex: A-01, B-12" required />
          </FormField>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Capacidades especiais</label>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'suporta_reefer', label: 'Reefer (refrigerado)' },
                { key: 'suporta_oversized', label: 'Oversized (extra-large)' },
                { key: 'suporta_hazmat', label: 'Hazmat (carga perigosa)' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={data[opt.key]} onChange={e => setData(opt.key, e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <FormField label="Notas" error={errors.notas}>
            <textarea className={`mt-1 block w-full ${FormField.inputClass(errors.notas)}`} value={data.notas} onChange={e => setData('notas', e.target.value)} rows="2" />
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
