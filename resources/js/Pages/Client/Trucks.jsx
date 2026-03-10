import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { confirmAction } from '@/Components/UI/confirmAction';
import {
  TRUCK_TYPE_OPTIONS,
  getTruckTypeLabel,
  isValidTruckPlate,
  normalizeTruckPlate,
} from '@/Features/Truck/utils/truckTypes';
import { Head, useForm, router } from '@inertiajs/react';

export default function Trucks({ trucks }) {
  const trucksList = useMemo(() => (Array.isArray(trucks) ? trucks : trucks?.data || []), [trucks]);
  const [editingTruck, setEditingTruck] = useState(null);
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
    setPlateError('');
    clearErrors();
    reset();
    setData({
      plate: '',
      type: 'cavalo',
      model: '',
      notes: '',
      is_active: true,
    });
  };

  const startEdit = (truck) => {
    setEditingTruck(truck);
    clearErrors();
    setData({
      plate: truck.plate ?? '',
      type: truck.type ?? 'cavalo',
      model: truck.model ?? '',
      notes: truck.notes ?? '',
      is_active: Boolean(truck.is_active),
    });
  };

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      ...data,
      plate: (data.plate || '').toUpperCase().trim(),
    };

    if (!isValidTruckPlate(payload.plate)) {
      setPlateError('Placa inválida. Use ABC1234 ou ABC1D23.');
      return;
    }

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

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Caminhões" subtitle="Cadastre e mantenha seus veículos ativos" />}
    >
      <Head title="Caminhões" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
          <FlashMessages />

          {/* Formulário (Criar/Editar) */}
          <div className="p-4 bg-white shadow sm:p-8 sm:rounded-lg">
            <section>
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {isEditing ? 'Editar Caminhão' : 'Novo Caminhão'}
                  </h2>
                  {isEditing && (
                    <p className="text-sm text-gray-500 mt-1">Editando ID #{editingTruck.id}</p>
                  )}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancelar edição
                  </button>
                )}
              </header>

              <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Placa</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300"
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
                      inputMode="text"
                      required
                    />
                    <p className="text-xs mt-1">
                      {data.plate.length === 7 ? (
                        isValidTruckPlate(data.plate) ? (
                          <span className="text-green-700">Placa válida</span>
                        ) : (
                          <span className="text-red-600">Placa inválida (ABC1234 ou ABC1D23)</span>
                        )
                      ) : (
                        <span className="text-gray-500">
                          Digite 7 caracteres (ABC1234 ou ABC1D23)
                        </span>
                      )}
                    </p>
                    {plateError && <span className="text-red-500 text-sm">{plateError}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300"
                      value={data.type}
                      onChange={(e) => setData('type', e.target.value)}
                      required
                    >
                      {TRUCK_TYPE_OPTIONS.map((objOption) => (
                        <option key={objOption.value} value={objOption.value}>
                          {objOption.label}
                        </option>
                      ))}
                    </select>
                    {errors.type && <span className="text-red-500 text-sm">{errors.type}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Modelo (opcional)
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300"
                      value={data.model}
                      onChange={(e) => setData('model', e.target.value)}
                      placeholder="Ex.: Volvo FH 540"
                    />
                    {errors.model && <span className="text-red-500 text-sm">{errors.model}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ativo</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300"
                      value={data.is_active ? '1' : '0'}
                      onChange={(e) => setData('is_active', e.target.value === '1')}
                      required
                    >
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                    {errors.is_active && (
                      <span className="text-red-500 text-sm">{errors.is_active}</span>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Observações (opcional)
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300"
                      rows={3}
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Ex.: restrições, informações do veículo, etc."
                    />
                    {errors.notes && <span className="text-red-500 text-sm">{errors.notes}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className={`px-4 py-2 rounded-md font-medium text-white ${
                      isEditing
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {processing
                      ? isEditing
                        ? 'Salvando...'
                        : 'Adicionando...'
                      : isEditing
                        ? 'Salvar alterações'
                        : 'Adicionar caminhão'}
                  </button>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-md font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>

          {/* Lista */}
          <div className="p-4 bg-white shadow sm:p-8 sm:rounded-lg overflow-x-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Meus Caminhões</h3>

            {trucksList.length === 0 ? (
              <p className="text-gray-500">Nenhum caminhão cadastrado ainda.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b py-2 px-2">Placa</th>
                    <th className="border-b py-2 px-2">Tipo</th>
                    <th className="border-b py-2 px-2">Modelo</th>
                    <th className="border-b py-2 px-2">Ativo</th>
                    <th className="border-b py-2 px-2">Observações</th>
                    <th className="border-b py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trucksList.map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50">
                      <td className="py-2 px-2 font-semibold">{truck.plate}</td>
                      <td className="py-2 px-2">{getTruckTypeLabel(truck.type)}</td>
                      <td className="py-2 px-2 text-sm text-gray-700">{truck.model || '-'}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            truck.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {truck.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td
                        className="py-2 px-2 text-sm text-gray-600 max-w-[320px] truncate"
                        title={truck.notes || ''}
                      >
                        {truck.notes || '-'}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(truck)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTruck(truck.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
