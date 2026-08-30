import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getAdminUrl } from '../api/client';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);
  const ADMIN_API             = useMemo(() => getAdminUrl(), []);

  // ── Session hydration on mount ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const savedAdmin = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_info') : null;

      // Optimistically restore from localStorage (display data only, not a token)
      if (savedAdmin) {
        try {
          if (isMounted) setAdmin(JSON.parse(savedAdmin));
        } catch {
          if (typeof window !== 'undefined') localStorage.removeItem('dentzy_admin_info');
        }
      }

      // Verify the session against the server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(`${getAdminUrl()}/me`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAdmin(data.admin);
            localStorage.setItem('dentzy_admin_info', JSON.stringify(data.admin));
          }
        } else if (res.status === 401 || res.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dentzy_admin_info');
          }
          if (isMounted) setAdmin(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Timeout or network error — keep optimistic state from localStorage
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrate();
    return () => { isMounted = false; };
  }, []);

  // ── Admin login ───────────────────────────────────────────────────────────
  const adminLogin = useCallback(async (username, password) => {
    const data = await apiFetch(`${getAdminUrl()}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('dentzy_admin_info', JSON.stringify(data.admin));
    // Clear any stale regular user session so AuthContext doesn't fire a wasted /me request
    localStorage.removeItem('dentzy_user');
    setAdmin(data.admin);
    return data.admin;
  }, []);

  // ── Admin logout ──────────────────────────────────────────────────────────
  const adminLogout = useCallback(async () => {
    try {
      await apiFetch(`${getAdminUrl()}/logout`, { method: 'POST' });
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentzy_admin_info');
    }
    setAdmin(null);
  }, []);

  // ── Authenticated fetch helper ────────────────────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      // Auto-logout on 401 / 403 — expired or revoked token
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dentzy_admin_info');
        }
        // Don't call setAdmin here — it causes an infinite re-render loop.
        // Let the dashboard page's own useEffect handle the redirect.
      }

      return res;
    } catch (err) {
      return { ok: false, status: 0, json: async () => ({ message: 'Network error' }) };
    }
  }, []);

  const value = useMemo(() => ({
    admin,
    loading,
    adminLogin,
    adminLogout,
    authFetch,
    ADMIN_API,
  }), [admin, loading, adminLogin, adminLogout, authFetch, ADMIN_API]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
};
