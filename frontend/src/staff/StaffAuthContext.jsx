import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getStaffUrl } from '../api/client';

export const StaffAuthContext = createContext(null);

function clearLegacyStaffTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dentzy_staff_token');
  localStorage.removeItem('dentzy_staff_jwt');
  sessionStorage.removeItem('dentzy_staff_token');
}

export const StaffAuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const STAFF_API = useMemo(() => getStaffUrl(), []);

  // ── Session hydration on mount (HttpOnly cookie only) ──────────────────────
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      clearLegacyStaffTokens();
      const saved = typeof window !== 'undefined'
        ? localStorage.getItem('dentzy_staff_info') : null;
      const onStaffPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/staff');

      // Fast path: no stored staff hint and not on staff route — skip network call
      if (!saved && !onStaffPath) {
        if (isMounted) setLoading(false);
        return;
      }

      // ponytail: Never trust localStorage before /me verifies HttpOnly cookie (blocks F12 UI spoofing)
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
        } else if (res.status === 503) {
          try {
            const data = await res.json();
            if (data?.code === 'MAINTENANCE_MODE' || data?.maintenance) {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('dentzy:maintenance', { detail: data }));
              }
            }
          } catch {}
          if (isMounted) setStaff(null);
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dentzy_staff_info');
          }
          if (isMounted) setStaff(null);
        }
      } catch {
        clearTimeout(timeoutId);
        // ponytail: Fail closed on network/blocked /me
        if (isMounted) setStaff(null);
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
    clearLegacyStaffTokens();
    localStorage.setItem('dentzy_staff_info', JSON.stringify(data.staff));
    localStorage.removeItem('dentzy_user');
    localStorage.removeItem('dentzy_admin_info');
    setStaff(data.staff);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('dentzy:auth-sync'));
    return data.staff;
  }, []);

  // ── Staff logout ──────────────────────────────────────────────────────────
  const staffLogout = useCallback(async () => {
    try {
      await apiFetch(`${getStaffUrl()}/logout`, { method: 'POST' });
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentzy_staff_info');
      clearLegacyStaffTokens();
      window.dispatchEvent(new Event('dentzy:auth-sync'));
    }
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dentzy_staff_info');
          clearLegacyStaffTokens();
        }
      }
      return res;
    } catch {
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
