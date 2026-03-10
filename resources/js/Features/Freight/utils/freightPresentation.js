export function translateFreightStatus(status) {
  const arrTranslations = {
    cancelled: 'Cancelado',
    loading: 'Carregando',
    unloading: 'Descarregando',
    completed: 'Finalizado',
  };

  return arrTranslations[status] || status;
}

export function translateOperationType(operationType) {
  const arrTranslations = {
    load: 'Carga',
    unload: 'Descarga',
    both: 'Ambos',
  };

  return arrTranslations[operationType] || operationType || '-';
}

export function getFreightStatusTone(status) {
  if (status === 'loading') return 'warning';
  if (status === 'unloading') return 'info';
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

export function getStartButtonLabel(operationType) {
  if (operationType === 'load') return 'Iniciar carregamento';
  if (operationType === 'unload') return 'Iniciar descarga';
  return 'Iniciar operação';
}

export function getFinalizeButtonLabel(operationType) {
  if (operationType === 'load') return 'Finalizar carregamento';
  if (operationType === 'unload') return 'Finalizar descarga';
  return 'Finalizar operação';
}
