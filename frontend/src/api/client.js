/**
 * api/client.js — Global API fetch client.
 *
 * Every request includes `credentials: 'include'` so that HttpOnly
 * cookies (dentzy_jwt, dentzy_admin_jwt) are automatically sent.
 */

export function getApiBase() {
  // 1. Env var set at build time (Cloudflare/Vercel/etc.)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  // 2. In browser, detect Cloudflare Pages or custom domains
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('pages.dev') || host.includes('dentzy') || host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://dentzy-backend.kesharinaman76.workers.dev';
    }
    return `http://${host}:5000`;
  }
  // 3. Server-side / static build default
  return 'https://dentzy-backend.kesharinaman76.workers.dev';
}

export const getAdminUrl   = () => `${getApiBase()}/api/admin`;
export const getAuthUrl    = () => `${getApiBase()}/api/auth`;
export const getDashUrl    = () => `${getApiBase()}/api/dashboard`;
export const getContactUrl = () => `${getApiBase()}/api/contact`;

export const API_BASE    = getApiBase();
export const AUTH_URL    = `${API_BASE}/api/auth`;
export const ADMIN_URL   = `${API_BASE}/api/admin`;
export const DASH_URL    = `${API_BASE}/api/dashboard`;
export const CONTACT_URL = `${API_BASE}/api/contact`;

/**
 * Normalizes any API URL to point to the correct live/local base URL at runtime.
 */
export function normalizeApiUrl(url) {
  const base = getApiBase();
  if (url.startsWith('/')) {
    return `${base}${url}`;
  }
  if (typeof window !== 'undefined') {
    const isRemote = window.location.hostname.endsWith('pages.dev') || !['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isRemote && (url.includes('localhost:5000') || url.includes('127.0.0.1:5000'))) {
      return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000/, base);
    }
  }
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

  // Attach Bearer token as fallback for mobile browsers that block cross-site cookies
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dentzy_token') || localStorage.getItem('dentzy_admin_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

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
