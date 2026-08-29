/**
 * api/client.js — Global API fetch client.
 *
 * Every request includes `credentials: 'include'` so that HttpOnly
 * cookies (dentzy_jwt, dentzy_admin_jwt) are automatically sent.
 */

export function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env) return env.replace(/\/+$/, '');
  // In browser, detect Cloudflare Pages or custom domains
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('pages.dev') || host.includes('dentzy') || (host !== 'localhost' && host !== '127.0.0.1')) {
      return 'https://dentzy-backend.kesharinaman76.workers.dev';
    }
    return `http://${host}:5000`;
  }
  // Server-side / static build default
  return 'https://dentzy-backend.kesharinaman76.workers.dev';
}

export const getAdminUrl   = () => `${getApiBase()}/api/admin`;
export const getAuthUrl    = () => `${getApiBase()}/api/auth`;
export const getDashUrl    = () => `${getApiBase()}/api/dashboard`;
export const getContactUrl = () => `${getApiBase()}/api/contact`;

/**
 * Normalizes any API URL to point to the correct live/local base URL at runtime.
 */
export function normalizeApiUrl(url) {
  if (url.startsWith('/')) return `${getApiBase()}${url}`;
  return url;
}

/**
 * Wrapper around `fetch` that always includes cookies and JSON headers.
 * Throws a structured error on non-2xx responses or network failures.
 *
 * @param {string} url — Full URL or relative path to fetch
 * @param {RequestInit} options — Standard fetch options (method, body, etc.)
 * @returns {Promise<any>} — Parsed JSON response
 */
export async function apiFetch(url, options = {}) {
  const targetUrl = normalizeApiUrl(url);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(targetUrl, {
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
