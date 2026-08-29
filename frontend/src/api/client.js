/**
 * api/client.js — Global API fetch client.
 *
 * Every request includes `credentials: 'include'` so that HttpOnly
 * cookies (dentzy_jwt, dentzy_admin_jwt) are automatically sent.
 * Also attaches Bearer token from localStorage as fallback for mobile
 * browsers that block cross-site cookies (Safari ITP, in-app webviews).
 */

const LIVE_BACKEND = 'https://dentzy-backend.kesharinaman76.workers.dev';

export function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_URL;
  // ponytail: reject dead Render URLs baked into old builds
  if (env && !env.includes('onrender.com') && !env.includes('render.com')) {
    return env.replace(/\/+$/, '');
  }
  // In browser, detect Cloudflare Pages or custom domains
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }
  return LIVE_BACKEND;
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

/** Attach Bearer token from localStorage if available (cookie fallback for mobile). */
function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('dentzy_admin_token') || localStorage.getItem('dentzy_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper around `fetch` that always includes cookies, Bearer token, and JSON headers.
 * Throws a structured error on non-2xx responses or network failures.
 */
export async function apiFetch(url, options = {}) {
  const targetUrl = normalizeApiUrl(url);

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
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
