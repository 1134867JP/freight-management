const UNKNOWN_STATUS_PRESENTATION = {
  label: '—',
  tone: 'neutral',
};

/**
 * Frontend status metadata, kept separate by domain because equal status keys
 * can have different meanings (for example, `available` in a dock and a slot).
 */
export const STATUS_PRESENTATIONS = {
  freight: {
    // Progressão fixa: agendado (neutro) → aguardando (atenção) → operando (aço) → finalizado (verde).
    reserved: { label: 'Reservado', tone: 'neutral' },
    arrived: { label: 'No pátio', tone: 'warning' },
    loading: { label: 'Carregando', tone: 'info' },
    unloading: { label: 'Descarregando', tone: 'info' },
    completed: { label: 'Finalizado', tone: 'success' },
    cancelled: { label: 'Cancelado', tone: 'danger' },
    no_show: { label: 'Não compareceu', tone: 'danger' },
  },
  timeslot: {
    available: { label: 'Disponível', tone: 'success' },
    full: { label: 'Lotado', tone: 'warning' },
    closed: { label: 'Fechado', tone: 'danger' },
  },
  dock: {
    available: { label: 'Disponível', tone: 'success' },
    occupied: { label: 'Ocupada', tone: 'info' },
    maintenance: { label: 'Manutenção', tone: 'neutral' },
  },
  moveOrder: {
    pending: { label: 'Pendente', tone: 'warning' },
    in_progress: { label: 'Em execução', tone: 'info' },
    completed: { label: 'Concluída', tone: 'success' },
    cancelled: { label: 'Cancelada', tone: 'danger' },
  },
  yardSpot: {
    available: { label: 'Disponível', tone: 'success' },
    occupied: { label: 'Ocupada', tone: 'warning' },
    blocked: { label: 'Bloqueada', tone: 'danger' },
  },
  yardTruck: {
    available: { label: 'Disponível', tone: 'success' },
    busy: { label: 'Em operação', tone: 'info' },
  },
};

export const FREIGHT_STATUS_CONFIG = STATUS_PRESENTATIONS.freight;
export const TIMESLOT_STATUS_CONFIG = STATUS_PRESENTATIONS.timeslot;

export function getStatusPresentation(domain, status) {
  const presentation = STATUS_PRESENTATIONS[domain]?.[status];

  if (presentation) return presentation;

  return {
    ...UNKNOWN_STATUS_PRESENTATION,
    label: status || UNKNOWN_STATUS_PRESENTATION.label,
  };
}
