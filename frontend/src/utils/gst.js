/**
 * Dentzy GST — All India tax logic for dental prosthetics.
 * HSN 9021 21 00 | 5% GST | Maharashtra (27) supplier.
 *
 * ponytail: frontend-only, no DB columns. Store when filing returns matters.
 */

const LAB_STATE_CODE = '27';

/** Extract 2-digit state code from "MAHARASHTRA (27)" or similar */
function extractCode(place) {
  if (!place) return null;
  const m = place.match(/\((\d{2})\)\s*$/);
  return m ? m[1] : null;
}

function round2(n) { return Math.round(n * 100) / 100; }

/**
 * @param {number} baseAmount — pre-tax amount (from existing pricing)
 * @param {string} placeOfDelivery — e.g. "MAHARASHTRA (27)" or "GUJARAT (24)"
 * @returns {Object} full GST breakdown
 */
export function calculateGST(baseAmount, placeOfDelivery) {
  const amt = Number(baseAmount) || 0;
  const destCode = extractCode(placeOfDelivery);
  const intra = !destCode || destCode === LAB_STATE_CODE;

  if (intra) {
    const half = round2(amt * 2.5 / 100);
    return {
      baseAmount: amt, hsnCode: '90212100', taxRate: 5,
      isIntraState: true, taxType: 'CGST+SGST',
      cgstRate: 2.5, sgstRate: 2.5, igstRate: 0,
      cgstAmount: half, sgstAmount: half, igstAmount: 0,
      totalTax: round2(half + half), totalAmount: round2(amt + half + half),
    };
  }
  const igst = round2(amt * 5 / 100);
  return {
    baseAmount: amt, hsnCode: '90212100', taxRate: 5,
    isIntraState: false, taxType: 'IGST',
    cgstRate: 0, sgstRate: 0, igstRate: 5,
    cgstAmount: 0, sgstAmount: 0, igstAmount: igst,
    totalTax: igst, totalAmount: round2(amt + igst),
  };
}
