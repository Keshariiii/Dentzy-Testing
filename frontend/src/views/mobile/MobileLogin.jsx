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
import { useStaffAuth } from '../../staff/StaffAuthContext';
import { ArrowLeft, User, Shield, ClipboardList, Eye, EyeOff } from 'lucide-react';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileLogin.css';

const MobileLogin = () => {
  const router         = useRouter();
  const searchParams = useSearchParams();
  const { login }      = useAuth();
  const { adminLogin } = useAdminAuth();
  const { staffLogin } = useStaffAuth();

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
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>

      {/* Logo */}
      <div className="m-auth-logo">
        <img src={dentzyLogo} alt="Dentzy" />
      </div>

      <div className="m-auth-card">
        {/* Role Switcher */}
        <div className="m-role-switcher">
          <button
            className={`m-role-tab ${activeRole === 'dentist' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('dentist')}
          >
            <User size={14} strokeWidth={2} />
            {' '}Dentist
          </button>
          <button
            className={`m-role-tab ${activeRole === 'admin' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('admin')}
          >
            <Shield size={14} strokeWidth={2} />
            {' '}Admin
          </button>
          <button
            className={`m-role-tab ${activeRole === 'staff' ? 'm-role-tab--active' : ''}`}
            onClick={() => handleRoleSwitch('staff')}
          >
            <ClipboardList size={14} strokeWidth={2} />
            {' '}Staff
          </button>
        </div>

        <h1 className="m-auth-title">
          {isDentist ? 'Welcome Back' : isAdmin ? 'Admin Access' : 'Staff Portal'}
        </h1>
        <p className="m-auth-subtitle">
          {isDentist ? 'Sign in to your dental lab portal' : isAdmin ? 'Restricted -- authorized personnel only' : 'Lab staff access -- credentials from admin'}
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
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
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
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
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
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
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
