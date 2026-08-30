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

export const getAdminUrl   = () => '/api/admin';
export const getAuthUrl    = () => '/api/auth';
export const getDashUrl    = () => '/api/dashboard';
export const getContactUrl = () => '/api/contact';

/**
 * Normalizes any API URL. Relative paths pass through unchanged.
 */
export function normalizeApiUrl(url) {
  return url;
}

/**
 * Wrapper around `fetch` that always includes cookies and JSON headers.
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
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    err.action = data.action || null;
    err.invalidCaptcha = data.invalidCaptcha || false;
    throw err;
  }

  return data;
}
