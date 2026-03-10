export function translateTimeslotStatus(status) {
  const arrTranslations = {
    available: 'Disponível',
    full: 'Lotado',
    closed: 'Fechado',
  };

  return arrTranslations[status] || status;
}

export function translateTimeslotOperationType(type) {
  const arrTranslations = {
    load: 'Carga',
    unload: 'Descarga',
    both: 'Ambos',
  };

  return arrTranslations[type] || type;
}

export function getTimeslotStatusTone(status) {
  if (status === 'available') return 'success';
  if (status === 'full') return 'warning';
  if (status === 'closed') return 'danger';
  return 'neutral';
}
