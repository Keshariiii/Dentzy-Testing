import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getAdminUrl } from '../api/client';
import { isExecutiveRole } from '../utils/roles';

export const AdminAuthContext = createContext(null);

function clearLegacyAdminTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dentzy_admin_token');
  sessionStorage.removeItem('dentzy_admin_token');
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);
  const ADMIN_API             = useMemo(() => getAdminUrl(), []);

  // ── Session hydration on mount & auth-sync (HttpOnly cookies only) ─────────
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      clearLegacyAdminTokens();
      const savedAdmin = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_info') : null;
      const savedStaff = typeof window !== 'undefined' ? localStorage.getItem('dentzy_staff_info') : null;
      const onAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      let isExecutive = false;
      let executiveStaff = null;

      if (!savedAdmin && savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
          if (parsed && isExecutiveRole(parsed.designation)) {
            isExecutive = true;
            executiveStaff = parsed;
          }
        } catch {
          // ignore parsing error
        }
      }

      // Fast path: no stored hint and not visiting an admin route — skip network call
      if (!savedAdmin && !isExecutive && !onAdminPath) {
        if (isMounted) setLoading(false);
        return;
      }

      // ponytail: Never trust localStorage before /me verifies the HttpOnly session (blocks F12 UI spoofing)
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
            const adminData = {
              ...data.admin,
              ...(data.admin?.isExecutiveStaff && executiveStaff ? {
                employeeId: executiveStaff.employeeId || executiveStaff.employee_id,
                email: executiveStaff.email,
                phone: executiveStaff.phone,
                dob: executiveStaff.dob,
              } : {}),
            };
            setAdmin(adminData);
            if (!adminData.isExecutiveStaff) {
              localStorage.setItem('dentzy_admin_info', JSON.stringify(adminData));
            }
          }
        } else {
          if (typeof window !== 'undefined' && !isExecutive) {
            localStorage.removeItem('dentzy_admin_info');
          }
          if (isMounted) setAdmin(null);
        }
      } catch {
        clearTimeout(timeoutId);
        // ponytail: Fail closed on network/blocked /me so DevTools offline/request-blocking cannot render portal UI
        if (isMounted) setAdmin(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrate();
    const onAuthSync = () => hydrate();
    if (typeof window !== 'undefined') window.addEventListener('dentzy:auth-sync', onAuthSync);
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') window.removeEventListener('dentzy:auth-sync', onAuthSync);
    };
  }, []);

  // ── Admin login ───────────────────────────────────────────────────────────
  const adminLogin = useCallback(async (username, password) => {
    const data = await apiFetch(`${getAdminUrl()}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    clearLegacyAdminTokens();
    localStorage.setItem('dentzy_admin_info', JSON.stringify(data.admin));
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
      clearLegacyAdminTokens();
      localStorage.removeItem('dentzy_staff_info');
      localStorage.removeItem('dentzy_staff_token');
      localStorage.removeItem('dentzy_staff_jwt');
    }
    setAdmin(null);
  }, []);

  // ── Authenticated fetch helper ────────────────────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dentzy_admin_info');
          clearLegacyAdminTokens();
        }
      }

      return res;
    } catch {
      return { ok: false, status: 0, json: async () => ({ message: 'Network error' }) };
    }
  }, []);

  const updateAdminState = useCallback((updatedAdmin) => {
    setAdmin(prev => ({ ...prev, ...updatedAdmin }));
    if (typeof window !== 'undefined' && !admin?.isExecutiveStaff) {
      localStorage.setItem('dentzy_admin_info', JSON.stringify({ ...admin, ...updatedAdmin }));
    }
  }, [admin]);

  const value = useMemo(() => ({
    admin,
    setAdmin,
    updateAdminState,
    loading,
    adminLogin,
    adminLogout,
    authFetch,
    ADMIN_API,
  }), [admin, updateAdminState, loading, adminLogin, adminLogout, authFetch, ADMIN_API]);

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
