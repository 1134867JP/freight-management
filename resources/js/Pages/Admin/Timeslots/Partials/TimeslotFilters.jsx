import React from 'react';

export default function TimeslotFilters({
  filters,
  onChangeFilter,
  sort,
  onChangeSort,
  onReset,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChangeFilter('search', event.target.value)}
          placeholder="Buscar por endereço, cidade, estado ou operação"
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />

        <select
          value={filters.status}
          onChange={(event) => onChangeFilter('status', event.target.value)}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Status: Todos</option>
          <option value="available">Status: Disponível</option>
          <option value="full">Status: Lotado</option>
          <option value="closed">Status: Fechado</option>
        </select>

        <select
          value={filters.operation}
          onChange={(event) => onChangeFilter('operation', event.target.value)}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Operação: Todas</option>
          <option value="load">Operação: Carga</option>
          <option value="unload">Operação: Descarga</option>
          <option value="both">Operação: Ambos</option>
        </select>

        <select
          value={filters.visibility}
          onChange={(event) => onChangeFilter('visibility', event.target.value)}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Visibilidade: Todas</option>
          <option value="public">Visibilidade: Público</option>
          <option value="restricted">Visibilidade: Restrito</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(event) => onChangeFilter('dateRange', event.target.value)}
          className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Data: Todas</option>
          <option value="today">Data: Hoje</option>
          <option value="upcoming">Data: Próximos dias</option>
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por</label>

          <div className="flex gap-2">
            <select
              value={sort.by}
              onChange={(event) => onChangeSort('by', event.target.value)}
              className="rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="datetime">Data/Hora</option>
              <option value="capacity">Cota</option>
              <option value="reservations">Reservas</option>
              <option value="status">Status</option>
            </select>

            <button
              type="button"
              onClick={() => onChangeSort('direction', sort.direction === 'asc' ? 'desc' : 'asc')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {sort.direction === 'asc' ? 'Crescente' : 'Decrescente'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
