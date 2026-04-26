import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { confirmAction } from '@/Components/UI/confirmAction';
import {
  TRUCK_TYPE_OPTIONS,
  getTruckTypeLabel,
  isValidTruckPlate,
  normalizeTruckPlate,
} from '@/Features/Truck/utils/truckTypes';
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

function TruckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h11v7H3V8Zm11 2h3l3 3v2h-6v-5ZM7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  );
}

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

export default function Trucks({ trucks }) {
  const trucksList = useMemo(() => (Array.isArray(trucks) ? trucks : trucks?.data || []), [trucks]);

  const [editingTruck, setEditingTruck] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [plateError, setPlateError] = useState('');

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    plate: '',
    type: 'cavalo',
    model: '',
    notes: '',
    is_active: true,
  });

  const isEditing = Boolean(editingTruck?.id);

  const resetForm = () => {
    setEditingTruck(null);
    setShowCreateModal(false);
    setPlateError('');
    clearErrors();
    reset();
  };

  const startEdit = (truck) => {
    setEditingTruck(truck);
    clearErrors();
    setPlateError('');
    setData({
      plate: truck.plate ?? '',
      type: truck.type ?? 'cavalo',
      model: truck.model ?? '',
      notes: truck.notes ?? '',
      is_active: Boolean(truck.is_active),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedPlate = (data.plate || '').toUpperCase().trim();

    if (!isValidTruckPlate(normalizedPlate)) {
      setPlateError('Placa inválida. Use ABC1234 ou ABC1D23.');
      return;
    }

    const payload = { ...data, plate: normalizedPlate };

    if (isEditing) {
      patch(route('client.trucks.update', editingTruck.id), {
        data: payload,
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('client.trucks.store'), {
      data: payload,
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const deleteTruck = (id) => {
    if (confirmAction('Tem certeza que deseja excluir este caminhão?')) {
      router.delete(route('client.trucks.destroy', id), { preserveScroll: true });
    }
  };

  const activeCount = trucksList.filter((t) => t.is_active).length;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Meus Caminhões"
          subtitle="Cadastre e mantenha seus veículos ativos"
          actions={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Caminhão
            </button>
          }
        />
      }
    >
      <Head title="Caminhões" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          {trucksList.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{trucksList.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                <span className="text-2xl font-black text-green-700 dark:text-green-400">{activeCount}</span>
                <span className="text-sm text-green-600 dark:text-green-500">Ativos</span>
              </div>
              {trucksList.length - activeCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-700/40">
                  <span className="text-2xl font-black text-gray-500 dark:text-gray-400">{trucksList.length - activeCount}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Inativos</span>
                </div>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {trucksList.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Nenhum caminhão cadastrado ainda." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/60">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Placa
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Tipo
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Modelo
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
                    {trucksList.map((truck) => (
                      <tr key={truck.id} className="transition hover:bg-gray-50/70 dark:hover:bg-gray-700/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              <TruckIcon />
                            </span>
                            <span className="font-mono text-sm font-semibold tracking-wider text-gray-900 dark:text-gray-100">
                              {truck.plate}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {getTruckTypeLabel(truck.type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {truck.model || <span className="text-gray-400 dark:text-gray-500">—</span>}
                        </td>
                        <td className="max-w-[240px] px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {truck.notes ? (
                            <span className="truncate block" title={truck.notes}>{truck.notes}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={truck.is_active ? 'Ativo' : 'Inativo'}
                            tone={truck.is_active ? 'success' : 'neutral'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(truck)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            >
                              <IconEdit />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTruck(truck.id)}
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
        title={isEditing ? `Editar Caminhão — ${editingTruck?.plate}` : 'Novo Caminhão'}
        onClose={resetForm}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Placa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={data.plate}
              onChange={(e) => {
                const vlPlate = normalizeTruckPlate(e.target.value);
                setData('plate', vlPlate);
                setPlateError(
                  vlPlate.length === 7 && !isValidTruckPlate(vlPlate)
                    ? 'Placa inválida. Use ABC1234 ou ABC1D23.'
                    : '',
                );
              }}
              placeholder="ABC1234 ou ABC1D23"
              maxLength={7}
              required
            />
            <p className="mt-1 text-xs">
              {data.plate.length === 7 ? (
                isValidTruckPlate(data.plate) ? (
                  <span className="text-green-600 dark:text-green-400">Placa válida</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Placa inválida (ABC1234 ou ABC1D23)</span>
                )
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Digite 7 caracteres (ABC1234 ou ABC1D23)</span>
              )}
            </p>
            {plateError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{plateError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClass}
              value={data.type}
              onChange={(e) => setData('type', e.target.value)}
              required
            >
              {TRUCK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.type}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Modelo <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={data.model}
              onChange={(e) => setData('model', e.target.value)}
              placeholder="Ex.: Volvo FH 540"
            />
            {errors.model && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.model}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Observações <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
              placeholder="Ex.: restrições, informações adicionais, etc."
            />
            {errors.notes && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.notes}</p>}
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600"
                checked={data.is_active}
                onChange={(e) => setData('is_active', e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Caminhão ativo</span>
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
              {isEditing ? 'Salvar alterações' : 'Adicionar caminhão'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
