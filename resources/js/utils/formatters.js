const DEFAULT_LOCALE = 'pt-BR';
const EMPTY_VALUE = '—';

function toValidDate(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWithDate(value, formatter, emptyValue) {
  const date = toValidDate(value);
  return date ? formatter.format(date) : emptyValue;
}

export function formatDate(value, options = {}, emptyValue = EMPTY_VALUE) {
  return formatWithDate(
    value,
    new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options,
    }),
    emptyValue,
  );
}

export function formatTime(value, options = {}, emptyValue = EMPTY_VALUE) {
  return formatWithDate(
    value,
    new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }),
    emptyValue,
  );
}

export function formatDateTime(value, options = {}, emptyValue = EMPTY_VALUE) {
  return formatWithDate(
    value,
    new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      dateStyle: 'short',
      timeStyle: 'short',
      ...options,
    }),
    emptyValue,
  );
}

export function formatCurrency(value, currency = 'BRL', emptyValue = EMPTY_VALUE) {
  const amount = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(amount)) return emptyValue;

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatWeight(value, options = {}) {
  const amount = Number(value);
  const emptyValue = options.emptyValue ?? EMPTY_VALUE;

  if (value === null || value === undefined || value === '' || Number.isNaN(amount)) return emptyValue;

  const numberOptions = { ...options };
  const unit = numberOptions.unit ?? 'kg';
  delete numberOptions.emptyValue;
  delete numberOptions.unit;
  const formattedAmount = new Intl.NumberFormat(DEFAULT_LOCALE, numberOptions).format(amount);

  return unit ? `${formattedAmount} ${unit}` : formattedAmount;
}

export function formatPhone(value, emptyValue = EMPTY_VALUE) {
  if (!value) return emptyValue;

  const digits = String(value).replace(/\D/g, '');
  const nationalNumber = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;

  if (nationalNumber.length === 11) {
    return `(${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 7)}-${nationalNumber.slice(7)}`;
  }

  if (nationalNumber.length === 10) {
    return `(${nationalNumber.slice(0, 2)}) ${nationalNumber.slice(2, 6)}-${nationalNumber.slice(6)}`;
  }

  return String(value);
}

export function formatPlate(value, emptyValue = EMPTY_VALUE) {
  if (!value) return emptyValue;

  const plate = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return plate.length === 7 ? `${plate.slice(0, 3)}-${plate.slice(3)}` : String(value);
}

export function formatDateKey(value) {
  const date = toValidDate(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
