'use client';
import Link from 'next/link';
import GoogleSignInButton from './ui/GoogleSignInButton';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../admin/AdminAuthContext';
import { useStaffAuth } from '../staff/StaffAuthContext';
import { useMaintenance } from '../context/MaintenanceContext';
import { EyeToggleIcon } from './ui/animated-state-icons';
import { Ico } from './common/DashboardIcons';
import PortalMaintenanceBanner from './common/PortalMaintenanceBanner';
const dentzyLogo = '/dentzy-logo-v2.png';
import './Login.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const DentistIcon = () => Ico.dentistRole('role-icon-svg');
const AdminIcon = () => Ico.adminRole('role-icon-svg');
const StaffIcon = () => Ico.staffRole('role-icon-svg');

// ─── Component ────────────────────────────────────────────────────────────────

const Login = ({ defaultRole }) => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();
  const { staffLogin } = useStaffAuth();
  const { maintenance, isDentistBlocked, isStaffBlocked, checkStatus, checking } = useMaintenance();

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

    if (activeRole === 'dentist' && isDentistBlocked) {
      setError('Dentzy Clinical Portal is undergoing scheduled maintenance. Your patient files and orders are completely safe.');
      return;
    }
    if (activeRole === 'staff' && isStaffBlocked) {
      setError('Dentzy Lab Operations Portal is undergoing scheduled maintenance.');
      return;
    }

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
          {Ico.arrowLeft(20, 2.2)}
        </button>

        <Link
          href="/"
          className="auth-header-logo"
          aria-label="Go to Dentzy home page"
          title="Back to Home"
        >
          <img src={dentzyLogo} alt="Dentzy Logo" />
        </Link>

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

            <button
              type="button"
              id="role-staff-btn"
              className={`role-card ${isStaff ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('staff')}
              aria-pressed={isStaff}
            >
              <div className="role-icon-wrap">
                <StaffIcon />
              </div>
              <span className="role-label">Staff</span>
              <span className="role-sublabel">Lab Portal</span>
              {isStaff && <span className="role-active-pip" />}
            </button>
          </div>

          {/* ── Form Title ────────────────────────── */}
          <h2 className="auth-card-title login-role-title">
            {isDentist ? 'Dentist Login' : isAdmin ? 'Admin Login' : 'Staff Login'}
          </h2>

          {/* ── Role Maintenance Banner ── */}
          {isDentist && isDentistBlocked && (
            <PortalMaintenanceBanner
              title="Scheduled Clinical Portal Maintenance"
              message={maintenance.customMessage || 'We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.'}
              expectedBack={maintenance.estimatedTime || 'Expected back online: Today at 6:00 PM IST'}
              onRetry={checkStatus}
              checking={checking}
              showEmergencyContact={maintenance.showEmergencyContact !== false}
              variant="inline"
            />
          )}

          {isStaff && isStaffBlocked && (
            <PortalMaintenanceBanner
              title="Lab Operations Portal Maintenance"
              message={maintenance.customMessage || 'Lab operations system is undergoing maintenance.'}
              expectedBack={maintenance.estimatedTime || 'Expected back online: Today at 6:00 PM IST'}
              onRetry={checkStatus}
              checking={checking}
              showEmergencyContact={false}
              variant="inline"
            />
          )}
          {/* ── Login Form ────────────────────────── */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {isDentist ? (
              /* ── Dentist Fields ──────────────────── */
              <>
                {/* Email */}
                <div className="auth-input-group">
                  <label htmlFor="login-email" className="sr-only">Email address</label>
                  <span className="auth-input-icon">
                    {Ico.user(16, 2)}
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
                    {Ico.lock(16, 2)}
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
                    <EyeToggleIcon active={showPassword} size={18} color="currentColor" />
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
                    {Ico.user(16, 2)}
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
                    {Ico.lock(16, 2)}
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
                    <EyeToggleIcon active={showPassword} size={18} color="currentColor" />
                  </button>
                </div>

                {/* Admin restricted note */}
                <p className="login-admin-note">
                  {Ico.info(13, 2.2)}
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
                    {Ico.user(16, 2)}
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
                    {Ico.lock(16, 2)}
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
                    <EyeToggleIcon active={showPassword} size={18} color="currentColor" />
                  </button>
                </div>

                {/* Staff access note */}
                <p className="login-admin-note">
                  {Ico.info(13, 2.2)}
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

            {/* ── Submit ────────────────────────────── */}
            <button
              id={isDentist ? 'login-submit' : 'admin-login-btn'}
              type="submit"
              className={`auth-btn ${(isAdmin || isStaff) ? 'al-submit-btn' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  {Ico.logIn(16, 2)}
                  {' '}{isDentist ? 'Login' : isAdmin ? 'Access Dashboard' : 'Staff Login'}
                </>
              )}
            </button>
          </form>

          {isDentist && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <GoogleSignInButton
                mode="signin"
                onError={(msg, err) => {
                  setError(msg);
                  if (err?.action === 'REGISTER' || err?.data?.error === 'ACCOUNT_NOT_REGISTERED') {
                    setErrorAction('REGISTER');
                  }
                }}
                onPending={() => setError('Your registration is submitted and awaiting admin approval.')}
              />
            </>
          )}

          {/* ── Footer links ──────────────────────── */}
          {isDentist ? (
            <p className="auth-switch">
              Don&apos;t Have An Account?{' '}
              <Link href="/register" id="go-to-register">Sign Up</Link>
            </p>
          ) : (
            <p className="auth-switch">
              <Link href="/" className="al-back-link">Back to main site</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
