import { getStatusPresentation } from '@/utils/statusPresentation';

export function translateFreightStatus(status) {
  return getFreightStatusPresentation(status).label;
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
  return getFreightStatusPresentation(status).tone;
}

export function getFreightStatusPresentation(status) {
  return getStatusPresentation('freight', status);
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
