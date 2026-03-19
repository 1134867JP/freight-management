import { isValidTruckPlate } from '@/Features/Truck/utils/truckTypes';

export function isValidBrPlate(value) {
  return isValidTruckPlate(value);
}

export function normalizeWhatsApp(value) {
  return (value || '').replace(/\D/g, '');
}

export function isValidWhatsApp(value) {
  const digits = normalizeWhatsApp(value);
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidWeight(value) {
  return Number(value) > 0;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
}
