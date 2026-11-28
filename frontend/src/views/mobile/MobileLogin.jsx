'use client';
/**
 * MobileLogin — Fullscreen mobile-native login experience.
 *
 * Touch-optimized card, large inputs, role selector, single-tap submit.
 */
import Link from 'next/link';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { useStaffAuth } from '../../staff/StaffAuthContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import { Ico } from '../../components/common/DashboardIcons';
import PortalMaintenanceBanner from '../../components/common/PortalMaintenanceBanner';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileLogin.css';

const MobileLogin = () => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();
  const { staffLogin } = useStaffAuth();
  const { maintenance, isDentistBlocked, isStaffBlocked, checkStatus, checking } = useMaintenance();

  const initialRole = searchParams?.get('role') || 'dentist';
  const [activeRole, setActiveRole] = useState(
    initialRole === 'admin' ? 'admin' : initialRole === 'staff' ? 'staff' : 'dentist'
  );

  const [dentistForm, setDentistForm] = useState({ email: '', password: '' });
  const [adminForm, setAdminForm]     = useState({ username: '', password: '' });
  const [staffForm, setStaffForm]     = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState('');
  const [errorAction, setErrorAction]   = useState(null);
  const [loading, setLoading]           = useState(false);

  const isDentist = activeRole === 'dentist';
  const isAdmin = activeRole === 'admin';
  const isStaff = activeRole === 'staff';

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
        await login(dentistForm.email.trim(), dentistForm.password, rememberMe);
        router.push('/dashboard');
      } catch (err) {
        setError(err.message);
        setErrorAction(err.action || null);
      } finally { setLoading(false); }
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
      } finally { setLoading(false); }
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
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="m-auth-page">
      {/* Back Arrow Button */}
      <button className="m-auth-back-btn" onClick={() => router.push('/')} aria-label="Back" title="Back">
        {Ico.arrowLeft(20, 2.2)}
      </button>

      {/* Logo */}
      <Link
        href="/"
        className="m-auth-logo"
        aria-label="Go to Dentzy home page"
        title="Back to Home"
      >
        <img src={dentzyLogo} alt="Dentzy" />
      </Link>

      <div className="m-auth-card">
        {/* Role Switcher */}
        <div className="m-role-switcher">
          <button
            className={`m-role-tab ${activeRole === 'dentist' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('dentist')}
          >
            {Ico.user(14, 2)}
            {' '}Dentist
          </button>
          <button
            className={`m-role-tab ${activeRole === 'admin' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('admin')}
          >
            {Ico.shield(14, 2)}
            {' '}Admin
          </button>
          <button
            className={`m-role-tab ${activeRole === 'staff' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('staff')}
          >
            {Ico.labOrder(14, 2)}
            {' '}Staff
          </button>
        </div>

        <h1 className="m-auth-title">
          {isDentist ? 'Welcome Back' : isAdmin ? 'Admin Access' : 'Staff Portal'}
        </h1>
        <p className="m-auth-subtitle">
          {isDentist ? 'Sign in to your dental lab portal' : isAdmin ? 'Restricted -- authorized personnel only' : 'Lab staff access -- credentials from admin'}
        </p>

        {isDentist && isDentistBlocked && (
          <PortalMaintenanceBanner
            title="Scheduled Clinical Portal Maintenance"
            message={maintenance.customMessage || 'We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.'}
            expectedBack={maintenance.estimatedTime || 'Expected back online: Today at 6:00 PM IST'}
            onRetry={checkStatus}
            checking={checking}
            showEmergencyContact={maintenance.showEmergencyContact !== false}
            variant="mobile"
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
            variant="mobile"
          />
        )}

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
                    {Ico.eye(18, showPassword)}
                  </button>
                </div>
              </div>
            </>
          ) : isAdmin ? (
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
                    {Ico.eye(18, showPassword)}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="m-auth-input-group">
                <label>Staff Username</label>
                <input
                  type="text"
                  value={staffForm.username}
                  onChange={(e) => { setStaffForm({...staffForm, username: e.target.value}); setError(''); }}
                  placeholder="Staff username"
                  autoComplete="username"
                />
              </div>
              <div className="m-auth-input-group">
                <label>Password</label>
                <div className="m-auth-pw-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={staffForm.password}
                    onChange={(e) => { setStaffForm({...staffForm, password: e.target.value}); setError(''); }}
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
                    {Ico.eye(18, showPassword)}
                  </button>
                </div>
              </div>
            </>
          )}

          {isDentist && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#6b8a7a', fontSize: '0.9rem' }}>
              <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Remember me</label>
            </div>
          )}

          <button type="submit" className="m-auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {isDentist && (
          <>
            <div className="m-auth-divider">
              <span>or</span>
            </div>
            <GoogleSignInButton
              mode="signin"
              onError={(msg, err) => {
                setError(msg);
                if (err?.action === 'REGISTER' || err?.data?.error === 'ACCOUNT_NOT_REGISTERED') {
                  setErrorAction({ type: 'link', to: '/register', label: 'Register here →' });
                }
              }}
              onPending={() => setError('Your registration is submitted and awaiting admin approval.')}
            />
          </>
        )}

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
