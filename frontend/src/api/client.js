/**
 * api/client.js — Global API fetch client.
 *
 * All requests use relative /api/* paths. In production, Cloudflare Pages
 * proxies these to the Workers backend (via _redirects). In local dev,
 * Next.js rewrites handle the proxy (via next.config.mjs).
 *
 * Auth is 100% HttpOnly cookies — no localStorage tokens, no Bearer headers.
 * Every request includes `credentials: 'include'` so cookies are sent automatically.
 */

export const getAdminUrl       = () => '/api/admin';
export const getAuthUrl        = () => '/api/auth';
export const getStaffUrl       = () => '/api/staff';
export const getDashUrl        = () => '/api/dashboard';
export const getContactUrl     = () => '/api/contact';
export const getMaintenanceUrl = () => '/api/maintenance';

/**
 * Normalizes any API URL. Relative paths pass through unchanged.
 */
export function normalizeApiUrl(url) {
  return url;
}

/**
 * Wrapper around `fetch` that always includes cookies and JSON headers.
 * Intercepts 503 Maintenance Mode responses and dispatches global event.
 * Throws a structured error on non-2xx responses or network failures.
 */
export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new Error('Cannot reach the server. Please check your connection.');
  }

  // Parse JSON (some responses may have no body, e.g. 204)
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    // ponytail: Centralize 503 interception so any in-flight or initial portal action transitions smoothly without crashing
    if (res.status === 503 && (data?.code === 'MAINTENANCE_MODE' || data?.maintenance === true)) {
      const isClient = typeof window !== 'undefined';
      const isCurrentAdmin = isClient && window.location.pathname.startsWith('/admin');
      const isRequestAdmin = typeof url === 'string' && url.includes('/api/admin');

      if (!isCurrentAdmin && !isRequestAdmin && isClient) {
        window.dispatchEvent(new CustomEvent('dentzy:maintenance', { detail: data }));
      }
    }

    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    err.action = data.action || null;
    err.invalidCaptcha = data.invalidCaptcha || false;
    err.isMaintenance = res.status === 503 && (data?.code === 'MAINTENANCE_MODE' || data?.maintenance === true);
    throw err;
  }

  return data;
}
