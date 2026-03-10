export const TRUCK_TYPE_OPTIONS = [
  { value: 'cavalo', label: 'Cavalo' },
  { value: 'carreta', label: 'Carreta' },
  { value: 'truck', label: 'Truck' },
  { value: 'outro', label: 'Outro' },
];

export function getTruckTypeLabel(type) {
  const objType = TRUCK_TYPE_OPTIONS.find((objOption) => objOption.value === type);
  return objType?.label || type;
}

export function normalizeTruckPlate(value) {
  return (value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
}

export function isValidTruckPlate(plate) {
  return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plate || '');
}
