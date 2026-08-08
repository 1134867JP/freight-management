import React from 'react';
import Button from '@/Components/UI/Button';
import FormField from '@/Components/UI/FormField';

export default function TimeslotFilters({ filters, onChange, onReset }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Operação
          </label>
          <FormField.Select
            value={filters.operation}
            onChange={(event) => onChange('operation', event.target.value)}
            className="mt-0"
          >
            <option value="all">Todas</option>
            <option value="load">Carga</option>
            <option value="unload">Descarga</option>
            <option value="both">Ambos</option>
          </FormField.Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Período
          </label>
          <FormField.Select
            value={filters.period}
            onChange={(event) => onChange('period', event.target.value)}
            className="mt-0"
          >
            <option value="all">Todos</option>
            <option value="morning">Manhã</option>
            <option value="afternoon">Tarde</option>
            <option value="night">Noite</option>
          </FormField.Select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Endereço
          </label>
          <FormField.Input
            type="text"
            value={filters.address}
            onChange={(event) => onChange('address', event.target.value)}
            placeholder="Buscar por nome, rua, bairro, cidade ou estado"
            className="mt-0"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          onClick={onReset}
          variant="secondary"
          size="sm"
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
