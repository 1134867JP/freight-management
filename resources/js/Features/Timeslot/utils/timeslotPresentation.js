import { getStatusPresentation } from '@/utils/statusPresentation';

export function translateTimeslotStatus(status) {
  return getTimeslotStatusPresentation(status).label;
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
  return getTimeslotStatusPresentation(status).tone;
}

export function getTimeslotStatusPresentation(status) {
  return getStatusPresentation('timeslot', status);
}
