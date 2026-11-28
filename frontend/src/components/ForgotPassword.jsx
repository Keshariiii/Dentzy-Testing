'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useCallback } from 'react';
const dentzyLogo = '/dentzy-logo-v2.png';
import { getAuthUrl } from '../api/client';
import PasswordStrength from './ui/password-strength';
import { EyeToggleIcon } from './ui/animated-state-icons';
import TwentyFirstIconButton from './ui/twentyfirst-icon-button';
import TwentyFirstOtpBox from './ui/twentyfirst-otp-box';
import { Icons as Ico } from './common/DashboardIcons';
import { PASSWORD_RULES } from '../utils/validation';
import { useCountdown } from '../hooks/useCountdown';
import './Register.css';

const API = () => getAuthUrl();

const ForgotPassword = () => {
  const router = useRouter();

  // ── Flow State: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success ─────────
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]   = useState('');
  const [resetToken, setResetToken] = useState('');
  const { seconds: resendCooldown, start: startResendCooldown } = useCountdown(0);

  const [form, setForm]                 = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const getRecaptchaToken = useCallback(async () => {
    if (!siteKey || typeof window === 'undefined' || !window.grecaptcha) return null;
    return new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action: 'forgot_password' });
          resolve(token);
        } catch {
          resolve(null);
        }
      });
    });
  }, [siteKey]);



  // ── Password strength ─────────────────────────────────────────────────────
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount    = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;

  const strength = useMemo(() => {
    if (passedCount === 0) return { label: '',       color: '#e0e0e0', fill: 0    };
    if (passedCount <= 2)  return { label: 'Weak',   color: '#e74c3c', fill: 0.33 };
    if (passedCount <= 3)  return { label: 'Fair',   color: '#f39c12', fill: 0.55 };
    if (passedCount === 4) return { label: 'Good',   color: '#708c80', fill: 0.78 };
    return                        { label: 'Strong', color: '#27ae60', fill: 1    };
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
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch(`${API()}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, recaptchaToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send verification code. Please try again.');
      } else {
        if (data.otpToken) setOtpToken(data.otpToken);
        setStep(2);
        startResendCooldown(60);
        setInfoMsg(`Verification code sent to ${cleanEmail}`);
        setOtp(['', '', '', '', '', '']);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
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
            <div className="pending-icon" style={{ color: '#27ae60' }}>
              {Ico.checkCircle(44, 1.5)}
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
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}
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
                <label htmlFor="fp-email" className="sr-only">Email address</label>
                <span className="auth-input-icon">
                  {Ico.mail(16, 2)}
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
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}
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
              <TwentyFirstOtpBox
                value={otp.join('')}
                onChange={(val) => {
                  setOtp(val.split('').concat(['', '', '', '', '', '']).slice(0, 6));
                  setError('');
                }}
                hasError={Boolean(error)}
                disabled={loading}
                className="my-5"
              />

              {error && <div className="auth-error">{error}</div>}

              <button id="fp-verify-otp-btn" type="submit" className="auth-btn" disabled={loading || otp.join('').length !== 6}>
                {loading ? <span className="auth-spinner" /> : 'Verify Code →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
                <TwentyFirstIconButton
                  icon={Ico.arrowLeft(16)}
                  title="Change Email / Back"
                  ariaLabel="Change Email"
                  onClick={() => { setStep(1); setError(''); }}
                  size="sm"
                  variant="secondary"
                />

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
              <label htmlFor="fp-password" className="sr-only">New password</label>
              <span className="auth-input-icon">
                {Ico.lock(16, 2)}
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
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <EyeToggleIcon active={showPassword} size={18} color="currentColor" />
              </button>
            </div>

            {/* Password Strength Meter */}
            {(pwFocused && form.password.length > 0) && (
              <div className="pw-strength-box">
                <PasswordStrength value={form.password} rules={PASSWORD_RULES} />
              </div>
            )}

            {/* Confirm Password */}
            <div className="auth-input-group">
              <label htmlFor="fp-confirm" className="sr-only">Confirm new password</label>
              <span className="auth-input-icon">
                {Ico.shield(16, 2)}
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
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                <EyeToggleIcon active={showConfirm} size={18} color="currentColor" />
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
