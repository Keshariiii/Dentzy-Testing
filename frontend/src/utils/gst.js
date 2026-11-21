/**
 * Dentzy GST — All India tax logic for dental prosthetics.
 * HSN 9021 21 00 | 5% GST | Maharashtra (27) supplier.
 *
 * PRICES ARE GST-INCLUSIVE. ₹1500 means ₹1428.57 base + ₹71.43 GST.
 * The dentist always pays the catalog price — invoice just shows the split.
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
 * @param {number} inclusiveAmount — GST-inclusive price (what dentist pays)
 * @param {string} placeOfDelivery — e.g. "MAHARASHTRA (27)" or "GUJARAT (24)"
 * @returns {Object} full GST breakdown extracted from inclusive price
 */
export function calculateGST(inclusiveAmount, placeOfDelivery) {
  const total = Number(inclusiveAmount) || 0;
  const destCode = extractCode(placeOfDelivery);
  const intra = !destCode || destCode === LAB_STATE_CODE;

  // Extract tax from inclusive price: base = total / (1 + rate/100)
  const baseAmount = round2(total / 1.05);
  const totalTax = round2(total - baseAmount);

  if (intra) {
    const half = round2(totalTax / 2);
    return {
      baseAmount, totalAmount: total, hsnCode: '90212100', taxRate: 5,
      isIntraState: true, taxType: 'CGST+SGST',
      cgstRate: 2.5, sgstRate: 2.5, igstRate: 0,
      cgstAmount: half, sgstAmount: round2(totalTax - half), igstAmount: 0,
      totalTax,
    };
  }
  return {
    baseAmount, totalAmount: total, hsnCode: '90212100', taxRate: 5,
    isIntraState: false, taxType: 'IGST',
    cgstRate: 0, sgstRate: 0, igstRate: 5,
    cgstAmount: 0, sgstAmount: 0, igstAmount: totalTax,
    totalTax,
  };
}
