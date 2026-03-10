import React from 'react';

export default function TimeslotFilters({ filters, onChange, onReset }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Operação
          </label>
          <select
            value={filters.operation}
            onChange={(event) => onChange('operation', event.target.value)}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="all">Todas</option>
            <option value="load">Carga</option>
            <option value="unload">Descarga</option>
            <option value="both">Ambos</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Período
          </label>
          <select
            value={filters.period}
            onChange={(event) => onChange('period', event.target.value)}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="all">Todos</option>
            <option value="morning">Manhã</option>
            <option value="afternoon">Tarde</option>
            <option value="night">Noite</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Endereço
          </label>
          <input
            type="text"
            value={filters.address}
            onChange={(event) => onChange('address', event.target.value)}
            placeholder="Buscar por nome, rua, bairro, cidade ou estado"
            className="w-full rounded-md border-gray-300 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
