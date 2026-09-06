/**
 * Shared formatting utilities — single source of truth.
 * ponytail: replaces 4 identical copies across dashboard components.
 */

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
