'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthUrl } from '../api/client';
const dentzyLogo = '/dentzy-logo-v2.png';
import './Register.css';

// Password requirement rules
const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',           test: (p) => p.length >= 8 },
  { id: 'upper',     label: 'At least 1 uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'At least 1 lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least 1 number (0–9)',           test: (p) => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least 1 special character (!@#$%)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const Register = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dentzy_remember_email');
      return { name: '', email: saved || '', password: '' };
    }
    return { name: '', email: '', password: '' };
  });
  const [remember, setRemember] = useState(() =>
    typeof window !== 'undefined' && !!localStorage.getItem('dentzy_remember_email')
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [errorAction, setErrorAction] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [pwFocused, setPwFocused]     = useState(false);

  // CAPTCHA state
  const [captchaInput, setCaptchaInput]   = useState('');
  const [captchaToken, setCaptchaToken]   = useState('');
  const [captchaSvg, setCaptchaSvg]       = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const API_URL = getAuthUrl();

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaInput('');
    try {
      const res  = await fetch(`${API_URL}/captcha`);
      const data = await res.json();
      if (res.ok) {
        setCaptchaToken(data.captchaToken);
        setCaptchaSvg(data.captchaSvg);
      }
    } catch { /* silently ignore */ }
    setCaptchaLoading(false);
  }, [API_URL]);

  // Load CAPTCHA on first render
  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Compute which rules pass in real time
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount   = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;

  // Strength label & colour
  const strength = useMemo(() => {
    if (passedCount === 0) return { label: '', color: '#e0e0e0', width: '0%' };
    if (passedCount <= 2)  return { label: 'Weak',   color: '#e74c3c', width: '33%' };
    if (passedCount <= 3)  return { label: 'Fair',   color: '#f39c12', width: '55%' };
    if (passedCount === 4) return { label: 'Good',   color: '#708c80', width: '78%' };
    return                        { label: 'Strong', color: '#27ae60', width: '100%' };
  }, [passedCount]);

  const [pending, setPending]       = useState(null); // { name, email }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setErrorAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!allRulesPassed) {
      setError('Your password does not meet all the requirements below.');
      setPwFocused(true);
      return;
    }

    if (!captchaInput.trim()) {
      setError('Please enter the CAPTCHA code shown in the image.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(form.name.trim(), form.email.trim(), form.password, captchaInput, captchaToken);
      if (remember) {
        localStorage.setItem('dentzy_remember_email', form.email.trim());
      } else {
        localStorage.removeItem('dentzy_remember_email');
      }
      if (result?.pending) {
        setPending({ name: form.name.trim(), email: form.email.trim() });
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
      setErrorAction(err.action || null);
      // Refresh CAPTCHA automatically on any captcha-related failure
      if (err.invalidCaptcha) fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ── Pending approval screen ──────────────────────────────────────
  if (pending) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-welcome">
              <span>REQUEST</span>
              <span>SENT!</span>
            </h1>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-header-logo">
            <img src={dentzyLogo} alt="Dentzy Logo" />
          </div>
          <div className="auth-card pending-card">
            <div className="pending-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#708c80" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="auth-card-title">Awaiting Approval</h2>
            <p className="pending-msg">
              Hi <strong>{pending.name}</strong>, your registration request has been submitted successfully!
            </p>
            <p className="pending-sub">
              Our admin will review your account and approve it shortly. You'll be able to log in once approved.
            </p>
            <div className="pending-email-tag">{pending.email}</div>
            <Link href="/login" id="go-to-login-pending" className="auth-btn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <h1 className="auth-welcome">
            <span>WELCOME</span>
            <span>TO</span>
            <span>DENT<em className="auth-accent">Z</em>Y</span>
          </h1>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-header-logo">
          <img src={dentzyLogo} alt="Dentzy Logo" />
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Sign up</h2>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                className="auth-input"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="auth-input"
                autoComplete="email"
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
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPwFocused(true)}
                className="auth-input"
                autoComplete="new-password"
              />
              {/* Show / hide toggle */}
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

            {/* Password strength meter + checklist */}
            {(pwFocused && form.password.length > 0) && (
              <div className="pw-strength-box">
                {/* Strength bar */}
                <div className="pw-strength-bar-track">
                  <div
                    className="pw-strength-bar-fill"
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  />
                </div>
                {strength.label && (
                  <span className="pw-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}

                {/* Rules checklist */}
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
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CAPTCHA */}
            <div className="captcha-container">
              <div className="captcha-label">Verify you're human</div>
              <div className="captcha-box">
                <div className="captcha-svg-wrap">
                  {captchaSvg
                    ? <div dangerouslySetInnerHTML={{ __html: captchaSvg }} style={{ width: '100%' }} />
                    : (
                      <div className="captcha-placeholder">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#708c80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="captcha-spin">
                          <line x1="12" y1="2" x2="12" y2="6"/>
                          <line x1="12" y1="18" x2="12" y2="22"/>
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                          <line x1="2" y1="12" x2="6" y2="12"/>
                          <line x1="18" y1="12" x2="22" y2="12"/>
                          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                        </svg>
                      </div>
                    )
                  }
                </div>
                <button
                  type="button"
                  className="captcha-refresh-btn"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  title="Get a new CAPTCHA"
                  aria-label="Refresh CAPTCHA"
                >
                  {/* Refresh icon */}
                  <svg
                    width="17" height="17"
                    viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    className={captchaLoading ? 'captcha-spin' : ''}
                  >
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
              </div>
              <div className="captcha-input-group auth-input-group">
                <span className="auth-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="register-captcha"
                  type="text"
                  className="auth-input captcha-input"
                  placeholder="Enter code above"
                  value={captchaInput}
                  onChange={e => { setCaptchaInput(e.target.value); setError(''); }}
                  autoComplete="off"
                  maxLength={6}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Remember */}
            <div className="auth-options">
              <label className="auth-remember" htmlFor="register-remember">
                <input
                  id="register-remember"
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                <span className="auth-checkmark" />
                Remember
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                {error}
                {errorAction === 'LOGIN' && (
                  <span> <Link href="/login" className="auth-error-link">Login here →</Link></span>
                )}
              </div>
            )}

            {/* Submit */}
            <button id="register-submit" type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign Up
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already Have An Account?{' '}
            <Link href="/login" id="go-to-login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
