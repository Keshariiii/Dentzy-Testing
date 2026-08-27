'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../admin/AdminAuthContext';
const dentzyLogo = '/dentzy-logo-v2.png';
import './Login.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const DentistIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="role-icon-svg">
    {/* Tooth shape */}
    <path
      d="M22 8C17 8 12 13 12 20c0 4 1.5 7.5 2.5 11C16 37 17 42 17 46c0 3 1 6 4 6s4-3 5-6l1.5-5c.5-2 1.5-3 4.5-3s4 1 4.5 3L38 46c1 3 2 6 5 6s4-3 4-6c0-4 1-9 2.5-15C50.5 27.5 52 24 52 20c0-7-5-12-10-12-3 0-6 1.5-10 1.5S25 8 22 8z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Shine lines */}
    <path d="M24 15 Q26 12 28 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M29 13 Q30.5 10.5 32 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6"/>
  </svg>
);

const AdminIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="role-icon-svg">
    {/* Shield */}
    <path
      d="M32 6L12 14v14c0 13 9 25 20 28 11-3 20-15 20-28V14L32 6z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Checkmark */}
    <path
      d="M22 32l7 7 13-13"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Login = ({ defaultRole }) => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();

  // Determine initial role from prop, query param, or default to 'dentist'
  const initialRole = defaultRole || searchParams?.get('role') || 'dentist';
  const [activeRole, setActiveRole] = useState(initialRole === 'admin' ? 'admin' : 'dentist');

  // Dentist form state — pre-fill from remembered email
  const [dentistForm, setDentistForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dentzy_remember_email');
      return { email: saved || '', password: '' };
    }
    return { email: '', password: '' };
  });
  const [remember, setRemember] = useState(() =>
    typeof window !== 'undefined' && !!localStorage.getItem('dentzy_remember_email')
  );

  // Admin form state
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [errorAction, setErrorAction]   = useState(null);
  const [loading, setLoading]           = useState(false);

  // Reset fields & errors when switching role
  const handleRoleSwitch = (role) => {
    if (role === activeRole) return;
    setActiveRole(role);
    setError('');
    setErrorAction(null);
    setShowPassword(false);
  };

  const handleDentistChange = (e) => {
    setDentistForm({ ...dentistForm, [e.target.name]: e.target.value });
    setError('');
    setErrorAction(null);
  };

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
    setError('');
    setErrorAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);

    if (activeRole === 'dentist') {
      if (!dentistForm.email || !dentistForm.password) {
        setError('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        await login(dentistForm.email.trim(), dentistForm.password);
        if (remember) {
          localStorage.setItem('dentzy_remember_email', dentistForm.email.trim());
        } else {
          localStorage.removeItem('dentzy_remember_email');
        }
        router.push('/dashboard');
      } catch (err) {
        setError(err.message);
        setErrorAction(err.action || null);
      } finally {
        setLoading(false);
      }
    } else {
      if (!adminForm.username || !adminForm.password) {
        setError('Please enter both username and password.');
        return;
      }
      setLoading(true);
      try {
        await adminLogin(adminForm.username, adminForm.password);
        // Clear any stale regular user session
        localStorage.removeItem('dentzy_user');
        router.push('/admin/dashboard');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const isDentist = activeRole === 'dentist';
  const isAdmin   = activeRole === 'admin';

  return (
    <div className="auth-page">
      {/* ── Left Panel ────────────────────────────── */}
      <div className={`auth-left ${isAdmin ? 'al-left-panel' : ''}`}>
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <h1 className="auth-welcome">
            <span>{isDentist ? 'WELCOME' : 'ADMIN'}</span>
            <span className="auth-welcome-back">{isDentist ? 'Back' : 'Access'}</span>
          </h1>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────── */}
      <div className="auth-right">
        <button className="auth-back-to-home-btn" onClick={() => router.push('/')} aria-label="Back" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="auth-header-logo">
          <img src={dentzyLogo} alt="Dentzy Logo" />
        </div>

        <div className="auth-card login-unified-card">

          {/* ── Role Selector ─────────────────────── */}
          <div className="role-selector">
            <button
              type="button"
              id="role-dentist-btn"
              className={`role-card ${isDentist ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('dentist')}
              aria-pressed={isDentist}
            >
              <div className="role-icon-wrap">
                <DentistIcon />
              </div>
              <span className="role-label">Dentist</span>
              <span className="role-sublabel">User Portal</span>
              {isDentist && <span className="role-active-pip" />}
            </button>

            <button
              type="button"
              id="role-admin-btn"
              className={`role-card ${isAdmin ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('admin')}
              aria-pressed={isAdmin}
            >
              <div className="role-icon-wrap">
                <AdminIcon />
              </div>
              <span className="role-label">Admin</span>
              <span className="role-sublabel">Management Portal</span>
              {isAdmin && <span className="role-active-pip" />}
            </button>
          </div>

          {/* ── Form Title ────────────────────────── */}
          <h2 className="auth-card-title login-role-title">
            {isDentist ? 'Dentist Login' : 'Admin Login'}
          </h2>

          {/* ── Login Form ────────────────────────── */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {isDentist ? (
              /* ── Dentist Fields ──────────────────── */
              <>
                {/* Email */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={dentistForm.email}
                    onChange={handleDentistChange}
                    className="auth-input"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={dentistForm.password}
                    onChange={handleDentistChange}
                    className="auth-input"
                    autoComplete="current-password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Options row */}
                <div className="auth-options">
                  <label className="auth-remember" htmlFor="login-remember">
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={remember}
                      onChange={() => setRemember(!remember)}
                    />
                    <span className="auth-checkmark" />
                    Remember
                  </label>
                  <Link href="/forgot-password" id="forgot-password-link" className="auth-forgot">
                    Forgot Password?
                  </Link>
                </div>
              </>
            ) : (
              /* ── Admin Fields ────────────────────── */
              <>
                {/* Username */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="admin-username"
                    type="text"
                    name="username"
                    placeholder="Username / Admin ID"
                    value={adminForm.username}
                    onChange={handleAdminChange}
                    className="auth-input"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={adminForm.password}
                    onChange={handleAdminChange}
                    className="auth-input"
                    autoComplete="current-password"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Admin restricted note */}
                <p className="login-admin-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Restricted access — authorised personnel only.
                </p>
              </>
            )}

            {/* ── Error ─────────────────────────────── */}
            {error && (
              <div className="auth-error">
                {error}
                {errorAction === 'REGISTER' && (
                  <span> <Link href="/register" className="auth-error-link">Register here →</Link></span>
                )}
              </div>
            )}

            {/* ── Submit ────────────────────────────── */}
            <button
              id={isDentist ? 'login-submit' : 'admin-login-btn'}
              type="submit"
              className={`auth-btn ${isAdmin ? 'al-submit-btn' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  {isDentist ? 'Login' : 'Access Dashboard'}
                </>
              )}
            </button>
          </form>

          {/* ── Footer links ──────────────────────── */}
          {isDentist ? (
            <p className="auth-switch">
              Don't Have An Account?{' '}
              <Link href="/register" id="go-to-register">Sign-in</Link>
            </p>
          ) : (
            <p className="auth-switch">
              <a href="/" className="al-back-link">← Back to main site</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
