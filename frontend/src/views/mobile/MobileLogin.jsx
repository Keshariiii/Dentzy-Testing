'use client';
/**
 * MobileLogin — Fullscreen mobile-native login experience.
 *
 * Touch-optimized card, large inputs, role selector, single-tap submit.
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../admin/AdminAuthContext';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileLogin.css';

const MobileLogin = () => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();

  const initialRole = searchParams?.get('role') || 'dentist';
  const [activeRole, setActiveRole] = useState(initialRole === 'admin' ? 'admin' : 'dentist');

  const [dentistForm, setDentistForm] = useState({ email: '', password: '' });
  const [adminForm, setAdminForm]     = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [errorAction, setErrorAction]   = useState(null);
  const [loading, setLoading]           = useState(false);

  const isDentist = activeRole === 'dentist';

  const handleRoleSwitch = (role) => {
    if (role === activeRole) return;
    setActiveRole(role);
    setError('');
    setErrorAction(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);

    if (isDentist) {
      if (!dentistForm.email || !dentistForm.password) {
        setError('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        await login(dentistForm.email.trim(), dentistForm.password);
        router.push('/dashboard');
      } catch (err) {
        setError(err.message);
        setErrorAction(err.action || null);
      } finally { setLoading(false); }
    } else {
      if (!adminForm.username || !adminForm.password) {
        setError('Please enter both username and password.');
        return;
      }
      setLoading(true);
      try {
        await adminLogin(adminForm.username, adminForm.password);
        // Clear any stale regular user session
        localStorage.removeItem('dentzy_token');
        localStorage.removeItem('dentzy_user');
        router.push('/admin/dashboard');
      } catch (err) {
        setError(err.message);
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="m-auth-page">
      {/* Back Arrow Button */}
      <button className="m-auth-back-btn" onClick={() => router.push('/')} aria-label="Back" title="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Logo */}
      <div className="m-auth-logo">
        <img src={dentzyLogo} alt="Dentzy" />
      </div>

      <div className="m-auth-card">
        {/* Role Switcher */}
        <div className="m-role-switcher">
          <button
            className={`m-role-tab ${isDentist ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('dentist')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {' '}Dentist
          </button>
          <button
            className={`m-role-tab ${!isDentist ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('admin')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {' '}Admin
          </button>
        </div>

        <h1 className="m-auth-title">
          {isDentist ? 'Welcome Back' : 'Admin Access'}
        </h1>
        <p className="m-auth-subtitle">
          {isDentist ? 'Sign in to your dental lab portal' : 'Restricted — authorized personnel only'}
        </p>

        {error && (
          <div className="m-auth-error">
            {error}
            {errorAction && (
              <button className="m-auth-error-action" onClick={() => {
                if (errorAction.type === 'link') router.push(errorAction.to);
              }}>
                {errorAction.label}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isDentist ? (
            <>
              <div className="m-auth-input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={dentistForm.email}
                  onChange={(e) => { setDentistForm({...dentistForm, email: e.target.value}); setError(''); }}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="m-auth-input-group">
                <label>Password</label>
                <div className="m-auth-pw-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={dentistForm.password}
                    onChange={(e) => { setDentistForm({...dentistForm, password: e.target.value}); setError(''); }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="m-pw-toggle"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.preventDefault(); setShowPassword(v => !v); }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="m-auth-input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => { setAdminForm({...adminForm, username: e.target.value}); setError(''); }}
                  placeholder="Admin username"
                  autoComplete="username"
                />
              </div>
              <div className="m-auth-input-group">
                <label>Password</label>
                <div className="m-auth-pw-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(e) => { setAdminForm({...adminForm, password: e.target.value}); setError(''); }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="m-pw-toggle"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.preventDefault(); setShowPassword(v => !v); }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="m-auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {isDentist && (
          <div className="m-auth-links">
            <Link href="/forgot-password" className="m-auth-link">Forgot password?</Link>
            <Link href="/register" className="m-auth-link">Create account</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileLogin;
