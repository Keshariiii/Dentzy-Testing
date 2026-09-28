import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getStaffUrl } from '../api/client';

const StaffAuthContext = createContext(null);

export const StaffAuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const STAFF_API = useMemo(() => getStaffUrl(), []);

  // ── Session hydration on mount ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      const saved = typeof window !== 'undefined'
        ? localStorage.getItem('dentzy_staff_info') : null;

      // Fast path: no stored staff session — skip network call
      if (!saved) { if (isMounted) setLoading(false); return; }

      try {
        if (isMounted) setStaff(JSON.parse(saved));
      } catch {
        if (typeof window !== 'undefined')
          localStorage.removeItem('dentzy_staff_info');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${getStaffUrl()}/me`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStaff(data.staff);
            localStorage.setItem('dentzy_staff_info', JSON.stringify(data.staff));
          }
        } else if (res.status === 401 || res.status === 403) {
          if (typeof window !== 'undefined')
            localStorage.removeItem('dentzy_staff_info');
          if (isMounted) setStaff(null);
        }
      } catch {
        clearTimeout(timeoutId);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    hydrate();
    return () => { isMounted = false; };
  }, []);

  // ── Staff login ───────────────────────────────────────────────────────────
  const staffLogin = useCallback(async (username, password) => {
    const data = await apiFetch(`${getStaffUrl()}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('dentzy_staff_info', JSON.stringify(data.staff));
    // Clear any stale regular user or admin session
    localStorage.removeItem('dentzy_user');
    localStorage.removeItem('dentzy_admin_info');
    setStaff(data.staff);
    return data.staff;
  }, []);

  // ── Staff logout ──────────────────────────────────────────────────────────
  const staffLogout = useCallback(async () => {
    try {
      await apiFetch(`${getStaffUrl()}/logout`, { method: 'POST' });
    } catch { /* ignore */ }
    if (typeof window !== 'undefined')
      localStorage.removeItem('dentzy_staff_info');
    setStaff(null);
  }, []);

  // ── Update staff state (after profile save) ───────────────────────────────
  const updateStaffState = useCallback((updatedStaff) => {
    setStaff(updatedStaff);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dentzy_staff_info', JSON.stringify(updatedStaff));
    }
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
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined')
          localStorage.removeItem('dentzy_staff_info');
      }
      return res;
    } catch (err) {
      return {
        ok: false, status: 0,
        json: async () => ({ message: 'Network error' }),
      };
    }
  }, []);

  const value = useMemo(() => ({
    staff, loading, staffLogin, staffLogout, updateStaffState, authFetch, STAFF_API,
  }), [staff, loading, staffLogin, staffLogout, updateStaffState, authFetch, STAFF_API]);

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used inside StaffAuthProvider');
  return ctx;
};
