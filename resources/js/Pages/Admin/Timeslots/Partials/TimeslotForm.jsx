import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AddressModal from './AddressModal';
import FormField from '@/Components/UI/FormField';
import Button from '@/Components/UI/Button';
import { useClientValidation } from '@/hooks/useClientValidation';

export default function TimeslotForm({ form, clients, addresses, produtos, docas, isEditing, onSubmit }) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  const arrClients = useMemo(() => clients || [], [clients]);
  const arrAddresses = useMemo(() => addresses || [], [addresses]);
  const arrProdutos = useMemo(() => produtos || [], [produtos]);
  const arrDocas = useMemo(() => docas || [], [docas]);

  const usesDocks = usePage().props.auth?.company?.uses_docks ?? true;
  const blTemProduto = form.data.modelo === 'por_produto' || form.data.modelo === 'por_produto_doca';
  const blTemDoca = form.data.modelo === 'por_produto_doca' && usesDocks;

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
        {/* Basic Section */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Data e Hora</h3>
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
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 dark:border-gray-700" />

        {/* Capacity Section */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Capacidade</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <FormField label="Tipo de Operação" error={allErrors.operation_type} required>
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
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 dark:border-gray-700" />

        {/* Configuration Section */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Configuração</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Status" error={allErrors.status} required>
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

            <FormField label="Modelo da Cota" error={allErrors.modelo} required>
              <FormField.Select
                error={allErrors.modelo}
                value={form.data.modelo}
                onChange={(event) => form.setData('modelo', event.target.value)}
                required
              >
                <option value="aberta">Cota Aberta</option>
                <option value="por_produto">Por Produto</option>
                {usesDocks && <option value="por_produto_doca">Por Produto + Doca</option>}
              </FormField.Select>
            </FormField>

            {blTemProduto && (
              <FormField label="Produto" error={allErrors.produto_id} required>
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

            {blTemDoca && (
              <FormField label="Doca / Baia" error={allErrors.doca_id} required>
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
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 dark:border-gray-700" />

        {/* Location & Description */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Localização e Descrição</h3>
          <FormField
            label="Endereço de Descarga"
            error={allErrors.dropoff_address_id}
            className="mb-4"
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
              <Button
                onClick={() => setShowAddressModal(true)}
                title="Adicionar novo endereço"
                className="shrink-0"
              >
                +
              </Button>
            </div>
          </FormField>

          <FormField label="Descrição" error={allErrors.description}>
            <textarea
              className={`mt-1 block w-full ${FormField.inputClass(allErrors.description)}`}
              aria-invalid={Boolean(allErrors.description)}
              value={form.data.description}
              onChange={(event) => form.setData('description', event.target.value)}
              rows="2"
              placeholder="Informações adicionais sobre esta cota..."
            />
          </FormField>
        </div>

        <div className="border-t border-gray-100 pt-6 dark:border-gray-700" />

        {/* Visibility Section */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Visibilidade</h3>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${
                form.data.client_ids.length === 0
                  ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800'
                  : 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:ring-sky-800'
              }`}>
                {form.data.client_ids.length === 0 ? 'Público' : `Restrito (${form.data.client_ids.length})`}
              </span>
            </div>

            <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
              Deixe sem selecionar para tornar <strong>público</strong>. Selecione clientes para <strong>restringir</strong>.
            </p>

            {arrClients.length === 0 ? (
              <p className="italic text-sm text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado</p>
            ) : (
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                {arrClients.map((objClient) => (
                  <label
                    key={objClient.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-white dark:hover:bg-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={form.data.client_ids.includes(objClient.id)}
                      onChange={() => toggleClient(objClient.id)}
                      className="rounded border-gray-300 text-teal-600 dark:border-gray-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {objClient.name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {allErrors.client_ids && (
              <span className="mt-2 block text-sm text-red-600">{allErrors.client_ids}</span>
            )}
          </div>
        </div>

        {/* Form Footer */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-6 dark:border-gray-700">
          <Button
            type="submit"
            loading={form.processing}
            size="lg"
          >
            {isEditing ? 'Salvar alterações' : 'Criar Horário'}
          </Button>
          {allErrors.submit && (
            <span className="text-sm text-red-600">{allErrors.submit}</span>
          )}
        </div>
      </form>

      <AddressModal show={showAddressModal} onClose={() => setShowAddressModal(false)} />
    </>
  );
}
