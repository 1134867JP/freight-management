import React, { useMemo, useState } from 'react';
import AddressModal from './AddressModal';

export default function TimeslotForm({ form, clients, addresses, isEditing, onSubmit }) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  const arrClients = useMemo(() => clients || [], [clients]);
  const arrAddresses = useMemo(() => addresses || [], [addresses]);

  const toggleClient = (clientId) => {
    const arrCurrent = [...form.data.client_ids];
    const nrIndex = arrCurrent.indexOf(clientId);

    if (nrIndex > -1) {
      arrCurrent.splice(nrIndex, 1);
    } else {
      arrCurrent.push(clientId);
    }

    form.setData('client_ids', arrCurrent);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Início</label>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.start_time}
              onChange={(event) => form.setData('start_time', event.target.value)}
              required
            />
            {form.errors.start_time && (
              <span className="text-sm text-red-500">{form.errors.start_time}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fim</label>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.end_time}
              onChange={(event) => form.setData('end_time', event.target.value)}
              required
            />
            {form.errors.end_time && (
              <span className="text-sm text-red-500">{form.errors.end_time}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cota (Capacidade)</label>
            <input
              type="number"
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.capacity}
              onChange={(event) => form.setData('capacity', event.target.value)}
              required
            />
            {form.errors.capacity && (
              <span className="text-sm text-red-500">{form.errors.capacity}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Operação</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.operation_type}
              onChange={(event) => form.setData('operation_type', event.target.value)}
              required
            >
              <option value="both">Ambos (Carga e Descarga)</option>
              <option value="load">Apenas Carga</option>
              <option value="unload">Apenas Descarga</option>
            </select>
            {form.errors.operation_type && (
              <span className="text-sm text-red-500">{form.errors.operation_type}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.status}
              onChange={(event) => form.setData('status', event.target.value)}
              required
            >
              <option value="available">Disponível</option>
              <option value="full">Lotado</option>
              <option value="closed">Fechado</option>
            </select>
            {form.errors.status && (
              <span className="text-sm text-red-500">{form.errors.status}</span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Endereço de Descarga
            </label>

            <div className="flex gap-2">
              <select
                className="flex-1 rounded-md border-gray-300"
                value={form.data.dropoff_address_id}
                onChange={(event) => form.setData('dropoff_address_id', event.target.value)}
              >
                <option value="">Nenhum endereço selecionado</option>
                {arrAddresses.map((objAddress) => (
                  <option key={objAddress.id} value={objAddress.id}>
                    {objAddress.name} - {objAddress.street}, {objAddress.number}, {objAddress.city}/
                    {objAddress.state}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="rounded-md bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
              >
                +
              </button>
            </div>

            {form.errors.dropoff_address_id && (
              <span className="text-sm text-red-500">{form.errors.dropoff_address_id}</span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300"
              value={form.data.description}
              onChange={(event) => form.setData('description', event.target.value)}
              rows="2"
            />
            {form.errors.description && (
              <span className="text-sm text-red-500">{form.errors.description}</span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Visibilidade do Horário
            </label>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm text-gray-600">
                <strong>Nenhum cliente selecionado</strong> = Horário PÚBLICO
                <br />
                <strong>Clientes selecionados</strong> = Horário RESTRITO
              </p>

              {arrClients.length === 0 ? (
                <p className="italic text-sm text-gray-500">Nenhum cliente cadastrado</p>
              ) : (
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
                  {arrClients.map((objClient) => (
                    <label
                      key={objClient.id}
                      className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={form.data.client_ids.includes(objClient.id)}
                        onChange={() => toggleClient(objClient.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {objClient.name} ({objClient.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                {form.data.client_ids.length === 0
                  ? '🌍 Horário PÚBLICO - Visível para TODOS os clientes'
                  : `🔒 Horário RESTRITO - Visível para ${form.data.client_ids.length} cliente(s)`}
              </p>
            </div>

            {form.errors.client_ids && (
              <span className="text-sm text-red-500">{form.errors.client_ids}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={form.processing}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isEditing ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>

      <AddressModal show={showAddressModal} onClose={() => setShowAddressModal(false)} />
    </>
  );
}
