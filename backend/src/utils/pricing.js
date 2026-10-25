/**
 * Official Dentzy Rate Card & Pricing Utility
 * Based on further plans.md §4.2 and CreateOrderModal catalog.
 */

export const RATE_CARD = [
  // Ceramic
  { id: 'pfm', name: 'PFM (Porcelain Fused to Metal)', category: 'Ceramic', price: 750, metric: 'unit', serviceType: 'Crown' },
  { id: 'pfm_facing', name: 'PFM Facing', category: 'Ceramic', price: 650, metric: 'unit', serviceType: 'Crown' },
  { id: 'ceramobond', name: 'Ceramobond Full Crown Metal', category: 'Ceramic', price: 400, metric: 'unit', serviceType: 'Crown' },
  { id: 'white_metal', name: 'White Metal', category: 'Ceramic', price: 250, metric: 'unit', serviceType: 'Crown' },
  { id: 'white_metal_facing', name: 'White Metal Facing', category: 'Ceramic', price: 400, metric: 'unit', serviceType: 'Crown' },

  // Zirconia
  { id: 'zircon_zahn', name: 'Zircon Zahn Metal Free', category: 'Zirconia', price: 1800, metric: 'unit', serviceType: 'Crown' },

  // Acrylic
  { id: 'acrylic_jc', name: 'Acrylic J/C (heat cure)', category: 'Acrylic', price: 250, metric: 'unit', serviceType: 'Crown' },
  { id: 'acrylic_full_set', name: 'Acrylic Full Set', category: 'Acrylic', price: 1500, metric: 'set', serviceType: 'Denture' },
  { id: 'fibre_full_set', name: 'Fibre Full Set', category: 'Acrylic', price: 2000, metric: 'set', serviceType: 'Denture' },
  { id: 'indian_teeth_lucitone', name: 'Indian Teeth Lucitone Full Set', category: 'Acrylic', price: 3000, metric: 'set', serviceType: 'Denture' },
  { id: 'imported_teeth_lucitone', name: 'Imported Teeth Lucitone Full Set', category: 'Acrylic', price: 3500, metric: 'set', serviceType: 'Denture' },
  { id: 'rpd', name: 'R.P.D (Removable Partial Denture)', category: 'Acrylic', price: 350, metric: 'case', serviceType: 'Denture' },
  { id: 'denture_repair', name: 'Denture Repair', category: 'Acrylic', price: 300, metric: 'case', serviceType: 'Other' },
  { id: 'teeth_addition', name: 'Teeth Addition', category: 'Acrylic', price: 250, metric: 'clasp_case', serviceType: 'Other' },

  // Ortho & Aux
  { id: 'orthoplate', name: 'Orthoplate', category: 'Ortho & Aux', price: 800, metric: 'arch', serviceType: 'Other' },
  { id: 'bleaching_tray', name: 'Bleaching Tray U/L', category: 'Ortho & Aux', price: 800, metric: 'arch', serviceType: 'Other' },
  { id: 'night_guard', name: 'Night Guard U/L', category: 'Ortho & Aux', price: 1200, metric: 'arch', serviceType: 'Retainer' },
];

export const SERVICE_TYPE_RATES = {
  Crown: 750,
  Bridge: 750,
  Denture: 1500,
  Implant: 1800,
  Veneer: 1800,
  Retainer: 1200,
  Other: 500,
};

/**
 * Calculates order price and tooth count fallback.
 * @param {Object} order - Order record or payload
 * @returns {{ amount: number, teethCount: number }}
 */
export function calculateOrderAmount(order = {}) {
  let teethCount = 1;

  const rawTeeth = order.teeth_data ?? order.teethData ?? order.teeth;
  if (Array.isArray(rawTeeth)) {
    teethCount = rawTeeth.length > 0 ? rawTeeth.length : 1;
  } else if (typeof rawTeeth === 'string' && rawTeeth.trim()) {
    try {
      const parsed = JSON.parse(rawTeeth);
      if (Array.isArray(parsed) && parsed.length > 0) {
        teethCount = parsed.length;
      }
    } catch {
      teethCount = 1;
    }
  }

  // 1. Check if order references a known product ID
  if (order.productId) {
    const prod = RATE_CARD.find(p => p.id === order.productId);
    if (prod && prod.price > 0) {
      return {
        amount: prod.metric === 'unit' ? prod.price * teethCount : prod.price,
        teethCount,
      };
    }
  }

  // 2. Base rate by serviceType or restoration_type
  const serviceKey = (order.restoration_type || order.serviceType || order.service_category || 'Other').trim();
  const matchedKey = Object.keys(SERVICE_TYPE_RATES).find(
    k => k.toLowerCase() === serviceKey.toLowerCase()
  ) || 'Other';

  const baseRate = SERVICE_TYPE_RATES[matchedKey] || 500;
  const calculatedAmount = Math.max(baseRate * teethCount, baseRate);

  return {
    amount: calculatedAmount,
    teethCount,
  };
}
