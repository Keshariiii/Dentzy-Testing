// ponytail: Canonical designation list and O(1) role tier classification
export const CANONICAL_STAFF_DESIGNATIONS = [
  'CEO',
  'CTO',
  'Receptionist',
  'Acrylic',
  'Ceramic',
  'CAD/CAM',
  'Milling',
  'Sintering',
  '3D Printing',
  'Delivery',
];

export const EXECUTIVE_ROLES = ['CEO', 'CTO'];
export const RECEPTIONIST_ROLES = ['Receptionist'];
export const PRODUCTION_ROLES = [
  'Acrylic',
  'Ceramic',
  'CAD/CAM',
  'Milling',
  'Sintering',
  '3D Printing',
];
export const DELIVERY_ROLES = ['Delivery'];

const NORMALIZATION_MAP = {
  'ceramist': 'Ceramic',
  'ceramic staff': 'Ceramic',
  'ceramic': 'Ceramic',
  'acrylic tech': 'Acrylic',
  'acrylic staff': 'Acrylic',
  'acrylic': 'Acrylic',
  'cad/cam specialist': 'CAD/CAM',
  'cad/cam tech': 'CAD/CAM',
  'cad/cam': 'CAD/CAM',
  'cadcam': 'CAD/CAM',
  'milling': 'Milling',
  'sintering': 'Sintering',
  '3d printing': '3D Printing',
  '3d print': '3D Printing',
  'delivery staff': 'Delivery',
  'rider': 'Delivery',
  'delivery': 'Delivery',
  'receptionist': 'Receptionist',
  'ceo': 'CEO',
  'cto': 'CTO',
};

// ponytail: single lookup normalizer with Ceramic fallback for legacy records
export function normalizeDesignation(raw) {
  if (!raw || typeof raw !== 'string') return 'Ceramic';
  const clean = raw.trim().toLowerCase();
  return NORMALIZATION_MAP[clean] || 'Ceramic';
}

// ponytail: department inference from service_category or serviceType for order routing
export function inferDepartment(serviceCategory, serviceType) {
  const cat = (serviceCategory || '').toLowerCase();
  const svc = (serviceType || '').toLowerCase();
  if (cat.includes('acrylic') || svc === 'denture') return 'Acrylic';
  if (cat.includes('zirconia') || cat.includes('cad')) return 'CAD/CAM';
  if (cat.includes('milling')) return 'Milling';
  if (cat.includes('sintering')) return 'Sintering';
  if (cat.includes('3d') || cat.includes('print')) return '3D Printing';
  return 'Ceramic';
}

export function isExecutiveRole(designation) {
  return EXECUTIVE_ROLES.includes(normalizeDesignation(designation));
}

export function isReceptionistRole(designation) {
  return RECEPTIONIST_ROLES.includes(normalizeDesignation(designation));
}

export function isProductionRole(designation) {
  return PRODUCTION_ROLES.includes(normalizeDesignation(designation));
}

export function isDeliveryRole(designation) {
  return DELIVERY_ROLES.includes(normalizeDesignation(designation));
}
