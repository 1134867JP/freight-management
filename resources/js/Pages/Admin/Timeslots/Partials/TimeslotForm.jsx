import React, { useEffect, useMemo, useState } from 'react';
import AddressModal from './AddressModal';
import FormField from '@/Components/UI/FormField';
import { useClientValidation } from '@/hooks/useClientValidation';

export default function TimeslotForm({ form, clients, addresses, produtos, docas, isEditing, onSubmit }) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  const arrClients = useMemo(() => clients || [], [clients]);
  const arrAddresses = useMemo(() => addresses || [], [addresses]);
  const arrProdutos = useMemo(() => produtos || [], [produtos]);
  const arrDocas = useMemo(() => docas || [], [docas]);

  const blTemProduto = form.data.modelo === 'por_produto' || form.data.modelo === 'por_produto_doca';
  const blTemDoca = form.data.modelo === 'por_produto_doca';

  // Limpar produto/doca quando o modelo não os exige
  useEffect(() => {
    if (!blTemProduto) {
      form.setData('produto_id', '');
    }
    if (!blTemDoca) {
      form.setData('doca_id', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data.modelo]);

  const { clientErrors, validate, clearClientError } = useClientValidation({
    start_time: (value) => (!value ? 'Horário de início é obrigatório.' : null),
    end_time: (value, data) => {
      if (!value) return 'Horário de fim é obrigatório.';
      if (data.start_time && value <= data.start_time)
        return 'Horário de fim deve ser posterior ao início.';
      return null;
    },
    capacity: (value) => {
      const n = Number(value);
      if (!value || !Number.isInteger(n) || n < 1) return 'Capacidade deve ser um inteiro >= 1.';
      return null;
    },
  });

  const allErrors = { ...clientErrors, ...form.errors };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate(form.data)) return;
    onSubmit(event);
  };

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Início" error={allErrors.start_time} required>
            <FormField.Input
              type="datetime-local"
              error={allErrors.start_time}
              value={form.data.start_time}
              onChange={(event) => {
                form.setData('start_time', event.target.value);
                clearClientError('start_time');
              }}
              required
            />
          </FormField>

          <FormField label="Fim" error={allErrors.end_time} required>
            <FormField.Input
              type="datetime-local"
              error={allErrors.end_time}
              value={form.data.end_time}
              onChange={(event) => {
                form.setData('end_time', event.target.value);
                clearClientError('end_time');
              }}
              required
            />
          </FormField>

          <FormField label="Cota (Capacidade)" error={allErrors.capacity} required>
            <FormField.Input
              type="number"
              min="1"
              error={allErrors.capacity}
              value={form.data.capacity}
              onChange={(event) => {
                form.setData('capacity', event.target.value);
                clearClientError('capacity');
              }}
              required
            />
          </FormField>

          <FormField label="Tipo de Operação" error={allErrors.operation_type}>
            <FormField.Select
              error={allErrors.operation_type}
              value={form.data.operation_type}
              onChange={(event) => form.setData('operation_type', event.target.value)}
              required
            >
              <option value="both">Ambos (Carga e Descarga)</option>
              <option value="load">Apenas Carga</option>
              <option value="unload">Apenas Descarga</option>
            </FormField.Select>
          </FormField>

          <FormField label="Status" error={allErrors.status}>
            <FormField.Select
              error={allErrors.status}
              value={form.data.status}
              onChange={(event) => form.setData('status', event.target.value)}
              required
            >
              <option value="available">Disponível</option>
              <option value="full">Lotado</option>
              <option value="closed">Fechado</option>
            </FormField.Select>
          </FormField>

          {/* Modelo da Cota */}
          <FormField label="Modelo da Cota" error={allErrors.modelo} required>
            <FormField.Select
              error={allErrors.modelo}
              value={form.data.modelo}
              onChange={(event) => form.setData('modelo', event.target.value)}
              required
            >
              <option value="aberta">Cota Aberta (cliente descreve a carga)</option>
              <option value="por_produto">Por Produto (produto fixo)</option>
              <option value="por_produto_doca">Por Produto + Doca (produto e doca fixos)</option>
            </FormField.Select>
          </FormField>

          {/* Produto — aparece nos modelos por_produto e por_produto_doca */}
          {blTemProduto && (
            <FormField
              label="Produto"
              error={allErrors.produto_id}
              required
            >
              <FormField.Select
                error={allErrors.produto_id}
                value={form.data.produto_id}
                onChange={(event) => form.setData('produto_id', event.target.value)}
                required
              >
                <option value="">Selecione um produto</option>
                {arrProdutos.map((objProduto) => (
                  <option key={objProduto.id} value={objProduto.id}>
                    {objProduto.nome}
                  </option>
                ))}
              </FormField.Select>
              {arrProdutos.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Nenhum produto ativo cadastrado. Cadastre em Produtos primeiro.
                </p>
              )}
            </FormField>
          )}

          {/* Doca — aparece apenas no modelo por_produto_doca */}
          {blTemDoca && (
            <FormField
              label="Doca / Baia"
              error={allErrors.doca_id}
              required
            >
              <FormField.Select
                error={allErrors.doca_id}
                value={form.data.doca_id}
                onChange={(event) => form.setData('doca_id', event.target.value)}
                required
              >
                <option value="">Selecione uma doca</option>
                {arrDocas.map((objDoca) => (
                  <option key={objDoca.id} value={objDoca.id}>
                    {objDoca.nome}
                  </option>
                ))}
              </FormField.Select>
              {arrDocas.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Nenhuma doca ativa cadastrada. Cadastre em Docas primeiro.
                </p>
              )}
            </FormField>
          )}

          <FormField
            label="Endereço de Descarga"
            error={allErrors.dropoff_address_id}
            className="md:col-span-2"
          >
            <div className="mt-1 flex gap-2">
              <select
                className={`flex-1 ${FormField.inputClass(allErrors.dropoff_address_id)}`}
                aria-invalid={Boolean(allErrors.dropoff_address_id)}
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
          </FormField>

          <FormField label="Descrição" error={allErrors.description} className="md:col-span-2">
            <textarea
              className={`mt-1 block w-full ${FormField.inputClass(allErrors.description)}`}
              aria-invalid={Boolean(allErrors.description)}
              value={form.data.description}
              onChange={(event) => form.setData('description', event.target.value)}
              rows="2"
            />
          </FormField>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Visibilidade do Horário
            </label>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                <strong>Nenhum cliente selecionado</strong> = Horário PÚBLICO
                <br />
                <strong>Clientes selecionados</strong> = Horário RESTRITO
              </p>

              {arrClients.length === 0 ? (
                <p className="italic text-sm text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado</p>
              ) : (
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
                  {arrClients.map((objClient) => (
                    <label
                      key={objClient.id}
                      className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={form.data.client_ids.includes(objClient.id)}
                        onChange={() => toggleClient(objClient.id)}
                        className="rounded border-gray-300 text-blue-600 dark:border-gray-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {objClient.name} ({objClient.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {form.data.client_ids.length === 0
                  ? 'Horário PÚBLICO - Visível para TODOS os clientes'
                  : `Horário RESTRITO - Visível para ${form.data.client_ids.length} cliente(s)`}
              </p>
            </div>

            {allErrors.client_ids && (
              <span className="text-sm text-red-500">{allErrors.client_ids}</span>
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
