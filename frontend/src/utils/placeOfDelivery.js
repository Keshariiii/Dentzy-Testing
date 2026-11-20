/**
 * resolvePlaceOfDelivery — Pure, deterministic Indian state/UT resolver for GST invoices.
 * Priority: state name → city → PIN code → raw address fallback → lab default.
 */

const STATES = {
  'JAMMU AND KASHMIR': '01', 'HIMACHAL PRADESH': '02', 'PUNJAB': '03',
  'CHANDIGARH': '04', 'UTTARAKHAND': '05', 'HARYANA': '06', 'DELHI': '07',
  'RAJASTHAN': '08', 'UTTAR PRADESH': '09', 'BIHAR': '10', 'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12', 'NAGALAND': '13', 'MANIPUR': '14', 'MIZORAM': '15',
  'TRIPURA': '16', 'MEGHALAYA': '17', 'ASSAM': '18', 'WEST BENGAL': '19',
  'JHARKHAND': '20', 'ODISHA': '21', 'CHHATTISGARH': '22', 'MADHYA PRADESH': '23',
  'GUJARAT': '24', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
  'MAHARASHTRA': '27', 'ANDHRA PRADESH': '37', 'KARNATAKA': '29', 'GOA': '30',
  'LAKSHADWEEP': '31', 'KERALA': '32', 'TAMIL NADU': '33', 'PUDUCHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35', 'TELANGANA': '36', 'LADAKH': '38',
};

// Aliases mapped to canonical state name
const ALIASES = {
  'ORISSA': 'ODISHA', 'PONDICHERRY': 'PUDUCHERRY', 'NEW DELHI': 'DELHI',
  'NCR': 'DELHI', 'TAMILNADU': 'TAMIL NADU', 'TAMIL NAADU': 'TAMIL NADU',
  'BENGAL': 'WEST BENGAL', 'CHATTISGARH': 'CHHATTISGARH',
  'DAMAN AND DIU': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'DADRA AND NAGAR HAVELI': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'DNH': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'J AND K': 'JAMMU AND KASHMIR', 'J&K': 'JAMMU AND KASHMIR',
  'HP': 'HIMACHAL PRADESH', 'UP': 'UTTAR PRADESH', 'MP': 'MADHYA PRADESH',
  'AP': 'ANDHRA PRADESH', 'UK': 'UTTARAKHAND',
};

// City → canonical state name
const CITIES = {
  // Maharashtra
  MUMBAI: 'MAHARASHTRA', THANE: 'MAHARASHTRA', 'NAVI MUMBAI': 'MAHARASHTRA',
  PUNE: 'MAHARASHTRA', NAGPUR: 'MAHARASHTRA', NASHIK: 'MAHARASHTRA',
  VASAI: 'MAHARASHTRA', VIRAR: 'MAHARASHTRA', PALGHAR: 'MAHARASHTRA',
  AURANGABAD: 'MAHARASHTRA', SOLAPUR: 'MAHARASHTRA', KOLHAPUR: 'MAHARASHTRA',
  KALYAN: 'MAHARASHTRA', DOMBIVLI: 'MAHARASHTRA', MIRA: 'MAHARASHTRA',
  BHIWANDI: 'MAHARASHTRA', PANVEL: 'MAHARASHTRA', SANGLI: 'MAHARASHTRA',
  // Gujarat
  AHMEDABAD: 'GUJARAT', SURAT: 'GUJARAT', VADODARA: 'GUJARAT', RAJKOT: 'GUJARAT',
  GANDHINAGAR: 'GUJARAT', VAPI: 'GUJARAT', BHARUCH: 'GUJARAT', ANAND: 'GUJARAT',
  JAMNAGAR: 'GUJARAT', BHAVNAGAR: 'GUJARAT', NAVSARI: 'GUJARAT',
  // Karnataka
  BENGALURU: 'KARNATAKA', BANGALORE: 'KARNATAKA', MYSURU: 'KARNATAKA',
  MYSORE: 'KARNATAKA', HUBLI: 'KARNATAKA', MANGALORE: 'KARNATAKA',
  MANGALURU: 'KARNATAKA', BELGAUM: 'KARNATAKA', BELAGAVI: 'KARNATAKA',
  // Telangana
  HYDERABAD: 'TELANGANA', SECUNDERABAD: 'TELANGANA', WARANGAL: 'TELANGANA',
  // Tamil Nadu
  CHENNAI: 'TAMIL NADU', COIMBATORE: 'TAMIL NADU', MADURAI: 'TAMIL NADU',
  SALEM: 'TAMIL NADU', TRICHY: 'TAMIL NADU', TIRUCHIRAPPALLI: 'TAMIL NADU',
  // West Bengal
  KOLKATA: 'WEST BENGAL', HOWRAH: 'WEST BENGAL', DURGAPUR: 'WEST BENGAL',
  // Rajasthan
  JAIPUR: 'RAJASTHAN', UDAIPUR: 'RAJASTHAN', JODHPUR: 'RAJASTHAN',
  KOTA: 'RAJASTHAN', AJMER: 'RAJASTHAN', BIKANER: 'RAJASTHAN',
  // Uttar Pradesh
  NOIDA: 'UTTAR PRADESH', LUCKNOW: 'UTTAR PRADESH', KANPUR: 'UTTAR PRADESH',
  GHAZIABAD: 'UTTAR PRADESH', AGRA: 'UTTAR PRADESH', VARANASI: 'UTTAR PRADESH',
  MEERUT: 'UTTAR PRADESH', PRAYAGRAJ: 'UTTAR PRADESH', ALLAHABAD: 'UTTAR PRADESH',
  'GREATER NOIDA': 'UTTAR PRADESH',
  // Haryana
  GURUGRAM: 'HARYANA', GURGAON: 'HARYANA', FARIDABAD: 'HARYANA',
  PANIPAT: 'HARYANA', AMBALA: 'HARYANA', ROHTAK: 'HARYANA',
  // Madhya Pradesh
  INDORE: 'MADHYA PRADESH', BHOPAL: 'MADHYA PRADESH', JABALPUR: 'MADHYA PRADESH',
  GWALIOR: 'MADHYA PRADESH',
  // Kerala
  KOCHI: 'KERALA', THIRUVANANTHAPURAM: 'KERALA', TRIVANDRUM: 'KERALA',
  KOZHIKODE: 'KERALA', CALICUT: 'KERALA', THRISSUR: 'KERALA',
  // Goa
  PANAJI: 'GOA', MARGAO: 'GOA', VASCO: 'GOA', MAPUSA: 'GOA',
  // Delhi
  'NEW DELHI': 'DELHI',
  // Punjab
  LUDHIANA: 'PUNJAB', AMRITSAR: 'PUNJAB', JALANDHAR: 'PUNJAB', PATIALA: 'PUNJAB',
  CHANDIGARH: 'CHANDIGARH',
  // Bihar
  PATNA: 'BIHAR', GAYA: 'BIHAR', MUZAFFARPUR: 'BIHAR',
  // Odisha
  BHUBANESWAR: 'ODISHA', CUTTACK: 'ODISHA',
  // Assam
  GUWAHATI: 'ASSAM', DIBRUGARH: 'ASSAM',
  // Jharkhand
  RANCHI: 'JHARKHAND', JAMSHEDPUR: 'JHARKHAND', DHANBAD: 'JHARKHAND',
  // Chhattisgarh
  RAIPUR: 'CHHATTISGARH', BILASPUR: 'CHHATTISGARH',
  // Uttarakhand
  DEHRADUN: 'UTTARAKHAND', HARIDWAR: 'UTTARAKHAND', RISHIKESH: 'UTTARAKHAND',
  // Himachal Pradesh
  SHIMLA: 'HIMACHAL PRADESH', MANALI: 'HIMACHAL PRADESH', DHARAMSHALA: 'HIMACHAL PRADESH',
  // Puducherry
  PONDICHERRY: 'PUDUCHERRY',
};

// PIN prefix → canonical state name (3-digit checked before 2-digit)
const PIN3 = { '403': 'GOA', '396': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU' };
const PIN2 = {
  '11': 'DELHI', '12': 'HARYANA', '13': 'HARYANA', '14': 'PUNJAB',
  '15': 'PUNJAB', '16': 'PUNJAB', '17': 'HIMACHAL PRADESH',
  '18': 'JAMMU AND KASHMIR', '19': 'JAMMU AND KASHMIR',
  '20': 'UTTAR PRADESH', '21': 'UTTAR PRADESH', '22': 'UTTAR PRADESH',
  '23': 'UTTAR PRADESH', '24': 'UTTAR PRADESH', '25': 'UTTARAKHAND',
  '26': 'UTTARAKHAND', '27': 'UTTAR PRADESH', '28': 'UTTAR PRADESH',
  '30': 'RAJASTHAN', '31': 'RAJASTHAN', '32': 'RAJASTHAN',
  '33': 'RAJASTHAN', '34': 'RAJASTHAN',
  '36': 'GUJARAT', '37': 'GUJARAT', '38': 'GUJARAT', '39': 'GUJARAT',
  '40': 'MAHARASHTRA', '41': 'MAHARASHTRA', '42': 'MAHARASHTRA',
  '43': 'MAHARASHTRA', '44': 'MAHARASHTRA',
  '45': 'MADHYA PRADESH', '46': 'MADHYA PRADESH', '47': 'MADHYA PRADESH',
  '48': 'MADHYA PRADESH', '49': 'CHHATTISGARH',
  '50': 'TELANGANA', '51': 'ANDHRA PRADESH', '52': 'ANDHRA PRADESH',
  '53': 'ANDHRA PRADESH',
  '56': 'KARNATAKA', '57': 'KARNATAKA', '58': 'KARNATAKA', '59': 'KARNATAKA',
  '60': 'TAMIL NADU', '61': 'TAMIL NADU', '62': 'TAMIL NADU',
  '63': 'TAMIL NADU', '64': 'TAMIL NADU',
  '67': 'KERALA', '68': 'KERALA', '69': 'KERALA',
  '70': 'WEST BENGAL', '71': 'WEST BENGAL', '72': 'WEST BENGAL',
  '73': 'WEST BENGAL', '74': 'WEST BENGAL',
  '75': 'ODISHA', '76': 'ODISHA', '77': 'ODISHA',
  '78': 'ASSAM', '79': 'ASSAM',
  '80': 'BIHAR', '81': 'BIHAR', '82': 'BIHAR', '83': 'BIHAR',
  '84': 'BIHAR', '85': 'JHARKHAND',
  '73': 'WEST BENGAL',
};

const DEFAULT = 'MAHARASHTRA (27)';
const PLACEHOLDER_RE = /^(girnar\s*darshan|n\/?a|na|-|--|\.\.?|not?\s*(available|applicable|provided|updated)|pending|test|xxx|update\s*later)$/i;

function fmt(state) {
  return `${state} (${STATES[state]})`;
}

/**
 * @param {string|null|undefined} rawAddress
 * @returns {string} e.g. "GUJARAT (24)" or "MAHARASHTRA (27)"
 */
export function resolvePlaceOfDelivery(rawAddress) {
  const addr = (rawAddress || '').trim();
  if (!addr || PLACEHOLDER_RE.test(addr)) return DEFAULT;

  const upper = addr.toUpperCase();

  // 1. Direct state name match (longest first, word-boundary to avoid "BENGAL" matching "Bengaluru")
  for (const state of Object.keys(STATES).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(upper)) return fmt(state);
  }

  // 2. Alias match (word-boundary)
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(upper)) return fmt(canonical);
  }

  // 3. City match (longest city name first)
  for (const [city, state] of Object.entries(CITIES).sort((a, b) => b[0].length - a[0].length)) {
    // Word-boundary-ish: check the city appears as a standalone word
    const re = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(addr)) return fmt(state);
  }

  // 4. PIN code (6-digit, first digit 1-8)
  const pinMatch = addr.match(/\b([1-8]\d{5})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    const p3 = pin.slice(0, 3);
    if (PIN3[p3]) return fmt(PIN3[p3]);
    const p2 = pin.slice(0, 2);
    if (PIN2[p2]) return fmt(PIN2[p2]);
  }

  // 5. Real address fallback — dentist has an address but we couldn't resolve the state
  // Trim to last locality/region if too long
  if (addr.length > 45) {
    const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
    const tail = parts.slice(-2).join(', ');
    return tail || addr;
  }
  return addr;
}
