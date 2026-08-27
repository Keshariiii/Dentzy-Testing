'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, useRef } from 'react';
const dentzyLogo = '/dentzy-logo-v2.png';
import { getAuthUrl } from '../api/client';
import './Register.css';

const API = () => getAuthUrl();

const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',               test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least 1 uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least 1 lowercase letter (a–z)',    test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least 1 number (0–9)',              test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character (!@#$%)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const ForgotPassword = () => {
  const router = useRouter();

  // ── Flow State: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success ─────────
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]   = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm]                 = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const otpInputsRef = useRef([]);

  // ── Resend cooldown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // ── Step 1: Send OTP to Email ─────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API()}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send verification code. Please try again.');
      } else {
        if (data.otpToken) setOtpToken(data.otpToken);
        setStep(2);
        setResendCooldown(60);
        setInfoMsg(`Verification code sent to ${cleanEmail}`);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input change & paste handlers ──────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // numbers only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API()}/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullOtp,
          otpToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid or expired verification code.');
      } else {
        setResetToken(data.resetToken);
        setStep(3);
        setError('');
        setInfoMsg('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
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
      const res = await fetch(`${API()}/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update password. Please start over.');
      } else {
        setStep(4);
        setTimeout(() => router.push('/login'), 3500);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Success Screen ─────────────────────────────────────────────────
  if (step === 4) {
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
              href="/login"
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

  // ── Step 1: Request OTP Email ──────────────────────────────────────────────
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
              Enter your registered email. We will send you a 6-digit verification code.
            </p>

            <form className="auth-form" onSubmit={handleSendOtp} noValidate>
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

              <button id="fp-next" type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : 'Send Verification Code →'}
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

  // ── Step 2: Enter 6-Digit OTP ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-welcome">
              <span>VERIFY</span>
              <span className="auth-welcome-back">Email Code</span>
            </h1>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-header-logo">
            <img src={dentzyLogo} alt="Dentzy Logo" />
          </div>

          <div className="auth-card">
            <h2 className="auth-card-title">Enter Verification Code</h2>
            <p className="auth-card-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            {infoMsg && (
              <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                {infoMsg}
              </div>
            )}

            <form className="auth-form" onSubmit={handleVerifyOtp}>
              {/* 6-box OTP Input */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '20px 0' }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '45px',
                      height: '52px',
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: digit ? '2px solid #1e5038' : '1.5px solid #cbd5e1',
                      background: '#fff',
                      color: '#1e2824',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                ))}
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button id="fp-verify-otp-btn" type="submit" className="auth-btn" disabled={loading || otp.join('').length !== 6}>
                {loading ? <span className="auth-spinner" /> : 'Verify Code →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#1e5038',
                    fontWeight: '600',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Enter New Password ────────────────────────────────────────────
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
            Create a strong new password for <strong>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
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

            <button id="fp-submit" type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Update Password & Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
