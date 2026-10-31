import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getAdminUrl } from '../api/client';
import { isExecutiveRole } from '../utils/roles';

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
      const savedStaff = typeof window !== 'undefined' ? localStorage.getItem('dentzy_staff_info') : null;

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

      // Fast path: no stored admin session and no executive staff session — skip network call entirely.
      if (!savedAdmin && !isExecutive) {
        if (isMounted) setLoading(false);
        return;
      }

      // Optimistically restore from localStorage
      if (savedAdmin) {
        try {
          if (isMounted) setAdmin(JSON.parse(savedAdmin));
        } catch {
          if (typeof window !== 'undefined') localStorage.removeItem('dentzy_admin_info');
        }
      } else if (isExecutive && executiveStaff) {
        if (isMounted) {
          setAdmin({
            id: executiveStaff.id,
            username: executiveStaff.username,
            displayName: executiveStaff.displayName,
            designation: executiveStaff.designation,
            employeeId: executiveStaff.employeeId || executiveStaff.employee_id,
            email: executiveStaff.email,
            phone: executiveStaff.phone,
            dob: executiveStaff.dob,
            role: 'admin',
            isExecutiveStaff: true,
          });
        }
      }

      // Verify the session against the server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_admin_token') || sessionStorage.getItem('dentzy_admin_token')) : null;
      const staffToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_staff_token') || localStorage.getItem('dentzy_staff_jwt') || sessionStorage.getItem('dentzy_staff_token')) : null;
      const token = adminToken || (isExecutive ? staffToken : null);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const res = await fetch(`${getAdminUrl()}/me`, {
          signal: controller.signal,
          headers,
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
            if (data.token) {
              localStorage.setItem('dentzy_admin_token', data.token);
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          if (typeof window !== 'undefined' && !isExecutive) {
            localStorage.removeItem('dentzy_admin_info');
            localStorage.removeItem('dentzy_admin_token');
            sessionStorage.removeItem('dentzy_admin_token');
          }
          if (isMounted) setAdmin(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Timeout or network error — keep optimistic state
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
    if (data.token) {
      localStorage.setItem('dentzy_admin_token', data.token);
    }
    // Clear any stale regular user session so AuthContext doesn't fire a wasted /me request
    localStorage.removeItem('dentzy_user');
    setAdmin(data.admin);
    return data.admin;
  }, []);

  // ── Admin logout ──────────────────────────────────────────────────────────
  const adminLogout = useCallback(async () => {
    try {
      const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_admin_token') || sessionStorage.getItem('dentzy_admin_token')) : null;
      const staffToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_staff_token') || localStorage.getItem('dentzy_staff_jwt')) : null;
      const token = adminToken || staffToken;
      await apiFetch(`${getAdminUrl()}/logout`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentzy_admin_info');
      localStorage.removeItem('dentzy_admin_token');
      sessionStorage.removeItem('dentzy_admin_token');
      localStorage.removeItem('dentzy_staff_info');
      localStorage.removeItem('dentzy_staff_token');
      localStorage.removeItem('dentzy_staff_jwt');
    }
    setAdmin(null);
  }, []);

  // ── Authenticated fetch helper ────────────────────────────────────────────
  const authFetch = useCallback(async (url, options = {}) => {
    const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_admin_token') || sessionStorage.getItem('dentzy_admin_token')) : null;
    const staffToken = typeof window !== 'undefined' ? (localStorage.getItem('dentzy_staff_token') || localStorage.getItem('dentzy_staff_jwt') || sessionStorage.getItem('dentzy_staff_token')) : null;
    const token = adminToken || staffToken;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      // Auto-logout on 401 / 403 — expired or revoked token
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dentzy_admin_info');
          localStorage.removeItem('dentzy_admin_token');
          sessionStorage.removeItem('dentzy_admin_token');
        }
        // Don't call setAdmin here — it causes an infinite re-render loop.
        // Let the dashboard page's own useEffect handle the redirect.
      }

      return res;
    } catch (err) {
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
