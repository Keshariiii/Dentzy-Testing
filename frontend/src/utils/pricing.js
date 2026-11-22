import { parseTeeth } from './teeth';

export const FALLBACK_RATES = {
  Crown: 750,
  Bridge: 750,
  Denture: 1500,
  Implant: 1800,
  Veneer: 1800,
  Retainer: 1200,
  Other: 500,
};

export const getOrderPrice = (o) => {
  const val = Number(o?.amount) || Number(o?.paymentAmount) || 0;
  if (val > 0) return val;
  const matched = Object.keys(FALLBACK_RATES).find(
    (k) => k.toLowerCase() === (o?.serviceType || '').toLowerCase()
  ) || 'Other';
  const base = FALLBACK_RATES[matched] || 500;
  const teeth = parseTeeth(o);
  const units = teeth.length > 0 ? teeth.length : 1;
  return base * units;
};
