import React from 'react';
import Button from '@/Components/UI/Button';
import FormField from '@/Components/UI/FormField';

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
        <FormField.Input
          type="text"
          value={filters.search}
          onChange={(event) => onChangeFilter('search', event.target.value)}
          placeholder="Buscar por endereço, cidade, estado ou operação"
          className="mt-0"
        />

        <FormField.Select
          value={filters.status}
          onChange={(event) => onChangeFilter('status', event.target.value)}
          className="mt-0"
        >
          <option value="all">Status: Todos</option>
          <option value="available">Status: Disponível</option>
          <option value="full">Status: Lotado</option>
          <option value="closed">Status: Fechado</option>
        </FormField.Select>

        <FormField.Select
          value={filters.operation}
          onChange={(event) => onChangeFilter('operation', event.target.value)}
          className="mt-0"
        >
          <option value="all">Operação: Todas</option>
          <option value="load">Operação: Carga</option>
          <option value="unload">Operação: Descarga</option>
          <option value="both">Operação: Ambos</option>
        </FormField.Select>

        <FormField.Select
          value={filters.visibility}
          onChange={(event) => onChangeFilter('visibility', event.target.value)}
          className="mt-0"
        >
          <option value="all">Visibilidade: Todas</option>
          <option value="public">Visibilidade: Público</option>
          <option value="restricted">Visibilidade: Restrito</option>
        </FormField.Select>

        <FormField.Select
          value={filters.dateRange}
          onChange={(event) => onChangeFilter('dateRange', event.target.value)}
          className="mt-0"
        >
          <option value="all">Data: Todas</option>
          <option value="today">Data: Hoje</option>
          <option value="upcoming">Data: Próximos dias</option>
        </FormField.Select>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por</label>

          <div className="flex gap-2">
            <FormField.Select
              value={sort.by}
              onChange={(event) => onChangeSort('by', event.target.value)}
              className="mt-0"
            >
              <option value="datetime">Data/Hora</option>
              <option value="capacity">Cota</option>
              <option value="reservations">Reservas</option>
              <option value="status">Status</option>
            </FormField.Select>

            <Button
              onClick={() => onChangeSort('direction', sort.direction === 'asc' ? 'desc' : 'asc')}
              variant="secondary"
              size="sm"
            >
              {sort.direction === 'asc' ? 'Crescente' : 'Decrescente'}
            </Button>
          </div>
        </div>

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
