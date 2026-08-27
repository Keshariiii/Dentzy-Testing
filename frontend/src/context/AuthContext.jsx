import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getAuthUrl, getDashUrl, normalizeApiUrl } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL               = useMemo(() => getAuthUrl(), []);
  const DASH_URL              = useMemo(() => getDashUrl(), []);

  // Restore session on mount — hydrate from Bearer-authenticated /me
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('dentzy_user') : null;

      // Optimistically restore from localStorage
      if (savedUser) {
        try {
          if (isMounted) setUser(JSON.parse(savedUser));
        } catch { /* ignore */ }
      }



      // Verify against server (with timeout for Render cold starts)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const authUrl = getAuthUrl();
        const headers = { 'Content-Type': 'application/json' };
        // Attach Bearer token as fallback for cross-origin mobile browsers
        const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${authUrl}/me`, {
          signal: controller.signal,
          headers,
          credentials: 'include',
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            const fresh = {
              id:         data.user._id || data.user.id,
              name:       data.user.name,
              email:      data.user.email,
              dob:        data.user.dob        || null,
              phone:      data.user.phone      || '',
              clinicName: data.user.clinicName || '',
              address:    data.user.address    || '',
              createdAt:  data.user.createdAt,
            };
            localStorage.setItem('dentzy_user', JSON.stringify(fresh));
            setUser(fresh);
          }
        } else if (res.status === 401 || res.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dentzy_user');
          }
          if (isMounted) setUser(null);
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

  // Authenticated fetch for /api/dashboard/* routes
  const authFetch = useCallback(async (url, options = {}) => {

    const targetUrl = normalizeApiUrl(url);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      // Attach Bearer token as fallback for cross-origin cookie blocking
      const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(targetUrl, {
        ...options,
        credentials: 'include',
        headers,
      });

      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dentzy_user');
        }
        // Don't call setUser here — it causes an infinite re-render loop.
        // Let the dashboard page's own useEffect handle the redirect.
      }

      return res;
    } catch (err) {
      return { ok: false, status: 0, json: async () => ({ message: 'Network error' }) };
    }
  }, []);

  // Register function
  const register = useCallback(async (name, email, password, captchaInput, captchaToken) => {
    const authUrl = getAuthUrl();
    const data = await apiFetch(`${authUrl}/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, captchaInput, captchaToken }),
    });
    if (data.pending) {
      return { pending: true, message: data.message, user: data.user };
    }
    if (data.user) {
      localStorage.setItem('dentzy_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data.user;
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    const authUrl = getAuthUrl();
    const data = await apiFetch(`${authUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('dentzy_token', data.token);
    }
    if (data.user) {
      localStorage.setItem('dentzy_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data.user;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const authUrl = getAuthUrl();
      await apiFetch(`${authUrl}/logout`, { method: 'POST' });
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentzy_user');
      localStorage.removeItem('dentzy_token');
    }
    setUser(null);
  }, []);

  // Update the local user state and persist to localStorage.
  const updateUserState = useCallback((updatedUser) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dentzy_user', JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    authFetch,
    updateUserState,
    API_URL,
    DASH_URL,
  }), [user, loading, login, register, logout, authFetch, updateUserState, API_URL, DASH_URL]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

