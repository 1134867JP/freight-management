const LOCALE = 'pt-BR';

/** "2026-10-10" → "10/10" (sem deslocamento de fuso). */
export function formatShortDate(isoDate) {
  if (!isoDate) return '—';
  const [, month, day] = String(isoDate).slice(0, 10).split('-');
  return `${day}/${month}`;
}

/** "2026-10-10" → "sex., 10/10". */
export function formatWeekdayDate(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = String(isoDate).slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(date);
  return `${weekday} ${formatShortDate(isoDate)}`;
}

export function formatPeriod(startsOn, endsOn) {
  if (!startsOn) return '—';
  if (!endsOn || startsOn === endsOn) return formatShortDate(startsOn);
  return `${formatShortDate(startsOn)} → ${formatShortDate(endsOn)}`;
}

/** Data/hora ISO → "10/10 às 09:00". */
export function formatSchedule(iso) {
  if (!iso) return 'Horário a definir';
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' }).format(date);
  const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' }).format(date);
  return `${day} às ${time}`;
}

export function formatClock(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/** Quilos → "20 t" / "20,5 t". */
export function formatTons(kg, emptyValue = '—') {
  if (kg === null || kg === undefined || kg === '') return emptyValue;
  const tons = Number(kg) / 1000;
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(tons)} t`;
}

export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Data/hora ISO → partes para blocos de calendário ({ day:"08", month:"out", short:"08/10", weekday:"quarta-feira" }). */
export function dateParts(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  const fmt = (options) => new Intl.DateTimeFormat(LOCALE, options).format(date);
  return {
    day: fmt({ day: '2-digit' }),
    month: fmt({ month: 'short' }).replace('.', ''),
    short: fmt({ day: '2-digit', month: '2-digit' }),
    weekday: fmt({ weekday: 'long' }),
  };
}
