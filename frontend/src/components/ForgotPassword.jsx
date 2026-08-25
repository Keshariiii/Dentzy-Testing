'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
const dentzyLogo = '/dentzy-logo-v3.jpg';
import { getAuthUrl } from '../api/client';
import './Register.css';

const API = () => getAuthUrl().replace(/\/auth$/, ''); // base /api path for /api/auth/forgot-password

// Same password rules as registration
const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',               test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least 1 uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least 1 lowercase letter (a–z)',    test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least 1 number (0–9)',              test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character (!@#$%)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const ForgotPassword = () => {
  const router = useRouter();

  // ── Step state ────────────────────────────────────────────────────────────
  // step 1 = enter email, step 2 = enter new password + confirm
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState('');

  const [form, setForm]                 = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // ── Password strength ─────────────────────────────────────────────────────
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount    = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;

  const strength = useMemo(() => {
    if (passedCount === 0) return { label: '',       color: '#e0e0e0', width: '0%'   };
    if (passedCount <= 2)  return { label: 'Weak',   color: '#e74c3c', width: '33%'  };
    if (passedCount <= 3)  return { label: 'Fair',   color: '#f39c12', width: '55%'  };
    if (passedCount === 4) return { label: 'Good',   color: '#708c80', width: '78%'  };
    return                        { label: 'Strong', color: '#27ae60', width: '100%' };
  }, [passedCount]);

  // ── Step 1: Validate email and advance ────────────────────────────────────
  const handleEmailNext = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep(2);
  };

  // ── Step 2: Submit new password ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.password) {
      setError('Please enter a new password.');
      return;
    }
    if (!allRulesPassed) {
      setError('Your password does not meet all the requirements below.');
      setPwFocused(true);
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API()}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-welcome">
              <span>PASSWORD</span>
              <span className="auth-welcome-back">Updated!</span>
            </h1>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-header-logo">
            <img src={dentzyLogo} alt="Dentzy Logo" />
          </div>
          <div className="auth-card pending-card">
            <div className="pending-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className="auth-card-title">All Done!</h2>
            <p className="pending-msg">
              Your password has been changed successfully.
            </p>
            <p className="pending-sub">
              Redirecting you to Login in a moment…
            </p>
            <Link
              to="/login"
              id="fp-go-to-login"
              className="auth-btn"
              style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginTop: '20px' }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Email ─────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-welcome">
              <span>FORGOT</span>
              <span className="auth-welcome-back">Password?</span>
            </h1>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-header-logo">
            <img src={dentzyLogo} alt="Dentzy Logo" />
          </div>

          <div className="auth-card">
            <h2 className="auth-card-title">Reset Password</h2>
            <p className="auth-card-subtitle">
              Enter the email address linked to your Dentzy account.
            </p>

            <form className="auth-form" onSubmit={handleEmailNext} noValidate>
              <div className="auth-input-group">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="fp-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="auth-input"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button id="fp-next" type="submit" className="auth-btn">
                Continue →
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{' '}
              <Link href="/login" id="fp-go-login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: New password + confirm ────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <h1 className="auth-welcome">
            <span>CHOOSE</span>
            <span className="auth-welcome-back">Password</span>
          </h1>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-header-logo">
          <img src={dentzyLogo} alt="Dentzy Logo" />
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Set New Password</h2>
          <p className="auth-card-subtitle">
            Setting new password for <strong>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* New Password */}
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="fp-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="New password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                onFocus={() => setPwFocused(true)}
                className="auth-input"
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
                autoFocus
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPassword((v) => !v)}>
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

            {/* Password Strength Meter */}
            {(pwFocused && form.password.length > 0) && (
              <div className="pw-strength-box">
                <div className="pw-strength-bar-track">
                  <div className="pw-strength-bar-fill" style={{ width: strength.width, backgroundColor: strength.color }} />
                </div>
                {strength.label && (
                  <span className="pw-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                )}
                <ul className="pw-rules">
                  {ruleResults.map((rule) => (
                    <li key={rule.id} className={`pw-rule ${rule.passed ? 'passed' : 'failed'}`}>
                      <span className="pw-rule-icon">
                        {rule.passed ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Password */}
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <input
                id="fp-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirm"
                placeholder="Confirm new password"
                value={form.confirm}
                onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
                className="auth-input"
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? (
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

            {error && <div className="auth-error">{error}</div>}

            {/* Actions row */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                id="fp-back"
                className="auth-btn"
                onClick={() => { setStep(1); setError(''); setForm({ password: '', confirm: '' }); }}
                style={{ background: '#e0e6e3', color: '#2a3d35', margin: 0, width: 'auto', flex: 1 }}
              >
                ← Back
              </button>
              <button 
                id="fp-submit" 
                type="submit" 
                className="auth-btn" 
                disabled={loading} 
                style={{ margin: 0, width: 'auto', flex: 1 }}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Submit
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Remember your password?{' '}
            <Link href="/login" id="fp-login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
