/**
 * Shared formatting utilities - single source of truth.
 * ponytail: replaces 4 identical copies across dashboard components.
 */

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d) => {
  if (!d) return '\u2014';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return '\u2014';
  return parsed.toLocaleDateString('en-IN', {
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