/**
 * Shared formatting utilities - single source of truth.
 * ponytail: replaces 4 identical copies across dashboard components.
 */

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d, fallback = '\u2014', options) => {
  if (!d) return fallback;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return typeof d === 'string' && fallback === null ? d : fallback;
  return parsed.toLocaleDateString('en-IN', options || {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/** IST-aware order timestamp */
export const formatOrderDateTime = (isoDate) => {
  if (!isoDate) return '\u2014';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '\u2014';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(date);
};

const DOCTOR_PLACEHOLDER_RE = /^(doctor|dentist|unknown|unnamed dentist|practitioner|practicing dentist|—|-)$/i;

export const formatDoctorName = (name, fallback = 'Doctor') => {
  const raw = typeof name === 'string' ? name.trim() : '';
  if (!raw || DOCTOR_PLACEHOLDER_RE.test(raw)) return fallback;
  const clean = raw.replace(/^(dr\s*\.?\s*)+/i, '');
  return clean && !DOCTOR_PLACEHOLDER_RE.test(clean)
    ? `Dr. ${clean.charAt(0).toUpperCase() + clean.slice(1)}`
    : fallback;
};
