'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../admin/AdminAuthContext';
import { useStaffAuth } from '../staff/StaffAuthContext';
import { Stethoscope, ShieldCheck, ClipboardList, User, Lock, Eye, EyeOff, LogIn, ArrowLeft, Info } from 'lucide-react';
import { TwentyFirstSegmentedTabs } from './ui/twentyfirst-segmented-tabs';
import { VengeanceButton } from './ui/vengeance-button';
const dentzyLogo = '/dentzy-logo-v2.png';
import './Login.css';

// ─── Role Tab Config ──────────────────────────────────────────────────────────

const ROLE_TABS = [
  { key: 'dentist', label: 'Dentist' },
  { key: 'admin',   label: 'Admin' },
  { key: 'staff',   label: 'Staff' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Login = ({ defaultRole }) => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();
  const { staffLogin } = useStaffAuth();

  // Determine initial role from prop, query param, or default to 'dentist'
  const initialRole = defaultRole || searchParams?.get('role') || 'dentist';
  const [activeRole, setActiveRole] = useState(
    initialRole === 'admin' ? 'admin' : initialRole === 'staff' ? 'staff' : 'dentist'
  );

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
  const [staffForm, setStaffForm] = useState({ username: '', password: '' });

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

  const handleStaffChange = (e) => {
    setStaffForm({ ...staffForm, [e.target.name]: e.target.value });
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
    } else if (activeRole === 'admin') {
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
    } else if (activeRole === 'staff') {
      if (!staffForm.username || !staffForm.password) {
        setError('Please enter both username and password.');
        return;
      }
      setLoading(true);
      try {
        await staffLogin(staffForm.username, staffForm.password);
        localStorage.removeItem('dentzy_user');
        localStorage.removeItem('dentzy_admin_info');
        router.push('/staff/dashboard');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const isDentist = activeRole === 'dentist';
  const isAdmin   = activeRole === 'admin';
  const isStaff   = activeRole === 'staff';

  return (
    <div className="auth-page">
      {/* ── Left Panel ────────────────────────────── */}
      <div className={`auth-left ${(isAdmin || isStaff) ? 'al-left-panel' : ''}`}>
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <h1 className="auth-welcome">
            <span>{isDentist ? 'WELCOME' : isAdmin ? 'ADMIN' : 'STAFF'}</span>
            <span className="auth-welcome-back">{isDentist ? 'Back' : isAdmin ? 'Access' : 'Portal'}</span>
          </h1>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────── */}
      <div className="auth-right">
        <button className="auth-back-to-home-btn" onClick={() => router.push('/')} aria-label="Back" title="Back">
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <div className="auth-header-logo">
          <img src={dentzyLogo} alt="Dentzy Logo" />
        </div>

        <div className="auth-card login-unified-card">

          {/* ── Role Selector — 21st.dev Segmented Tabs ── */}
          <TwentyFirstSegmentedTabs
            tabs={ROLE_TABS}
            activeKey={activeRole}
            onTabChange={handleRoleSwitch}
            layoutId="login-role-pill"
            className="login-role-tabs"
          />

          {/* ── Form Title ────────────────────────── */}
          <h2 className="auth-card-title login-role-title">
            {isDentist ? 'Dentist Login' : isAdmin ? 'Admin Login' : 'Staff Login'}
          </h2>

          {/* ── Login Form ────────────────────────── */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {isDentist ? (
              /* ── Dentist Fields ──────────────────── */
              <>
                {/* Email */}
                <div className="auth-input-group">
                  <label htmlFor="login-email" className="sr-only">Email address</label>
                  <span className="auth-input-icon">
                    <User size={16} strokeWidth={2} />
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
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <label htmlFor="login-password" className="sr-only">Password</label>
                  <span className="auth-input-icon">
                    <Lock size={16} strokeWidth={2} />
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
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
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
            ) : isAdmin ? (
              /* ── Admin Fields ────────────────────── */
              <>
                {/* Username */}
                <div className="auth-input-group">
                  <label htmlFor="admin-username" className="sr-only">Username or Admin ID</label>
                  <span className="auth-input-icon">
                    <User size={16} strokeWidth={2} />
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
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <label htmlFor="admin-password" className="sr-only">Admin Password</label>
                  <span className="auth-input-icon">
                    <Lock size={16} strokeWidth={2} />
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
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>

                {/* Admin restricted note */}
                <p className="login-admin-note">
                  <Info size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  Restricted access -- authorised personnel only.
                </p>
              </>
            ) : (
              /* ── Staff Fields ──────────────────────── */
              <>
                {/* Username */}
                <div className="auth-input-group">
                  <label htmlFor="staff-username" className="sr-only">Staff Username</label>
                  <span className="auth-input-icon">
                    <User size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="staff-username"
                    type="text"
                    name="username"
                    placeholder="Staff Username"
                    value={staffForm.username}
                    onChange={handleStaffChange}
                    className="auth-input"
                    autoComplete="username"
                    autoFocus
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <label htmlFor="staff-password" className="sr-only">Staff Password</label>
                  <span className="auth-input-icon">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={staffForm.password}
                    onChange={handleStaffChange}
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
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>

                {/* Staff access note */}
                <p className="login-admin-note">
                  <Info size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  Lab staff access -- credentials provided by admin.
                </p>
              </>
            )}

            {/* ── Error ─────────────────────────────── */}
            {error && (
              <div className="auth-error" id="login-error" role="alert">
                {error}
                {errorAction === 'REGISTER' && (
                  <span> <Link href="/register" className="auth-error-link">Register here →</Link></span>
                )}
              </div>
            )}

            {/* ── Submit — VengeanceButton ──────────── */}
            <VengeanceButton
              type="submit"
              size="md"
              className="auth-vengeance-btn"
              disabled={loading}
              id={isDentist ? 'login-submit' : 'admin-login-btn'}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <LogIn size={16} strokeWidth={2} />
                  {isDentist ? 'Login' : isAdmin ? 'Access Dashboard' : 'Staff Login'}
                </>
              )}
            </VengeanceButton>
          </form>

          {/* ── Footer links ──────────────────────── */}
          {isDentist ? (
            <p className="auth-switch">
              Don't Have An Account?{' '}
              <Link href="/register" id="go-to-register">Sign Up</Link>
            </p>
          ) : (
            <p className="auth-switch">
              <a href="/" className="al-back-link">Back to main site</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
