'use client';
/**
 * MobileRegister — Fullscreen mobile-native registration with 2-step email OTP verification.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAuthUrl } from '../../api/client';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileLogin.css'; /* Shared mobile auth styles */

const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',             test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'At least 1 uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'At least 1 lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'At least 1 number (0–9)',           test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character',       test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const MobileRegister = () => {
  const router = useRouter();
  const { sendRegisterOtp, resendRegisterOtp, register } = useAuth();

  // step: 1 = form, 2 = OTP, 3 = pending
  const [step, setStep] = useState(1);

  const [form, setForm]               = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [errorAction, setErrorAction] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [pwFocused, setPwFocused]     = useState(false);

  // CAPTCHA
  const [captchaInput, setCaptchaInput]     = useState('');
  const [captchaToken, setCaptchaToken]     = useState('');
  const [captchaSvg, setCaptchaSvg]         = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // OTP
  const [otp, setOtp]                       = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]             = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef                        = useRef([]);

  const API_URL = getAuthUrl();

  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaInput('');
    try {
      const res  = await fetch(`${API_URL}/captcha`);
      const data = await res.json();
      if (res.ok) { setCaptchaToken(data.captchaToken); setCaptchaSvg(data.captchaSvg); }
    } catch {}
    setCaptchaLoading(false);
  }, [API_URL]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/captcha`)
      .then(res => res.json())
      .then(data => {
        if (active && data.captchaToken) {
          setCaptchaToken(data.captchaToken);
          setCaptchaSvg(data.captchaSvg);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [API_URL]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);


  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount    = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;

  const strength = useMemo(() => {
    if (passedCount === 0) return { label: '', color: '#e0e0e0', width: '0%' };
    if (passedCount <= 2)  return { label: 'Weak',   color: '#e74c3c', width: '33%' };
    if (passedCount <= 3)  return { label: 'Fair',   color: '#f39c12', width: '55%' };
    if (passedCount === 4) return { label: 'Good',   color: '#708c80', width: '78%' };
    return                        { label: 'Strong', color: '#27ae60', width: '100%' };
  }, [passedCount]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setErrorAction(null);
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setErrorAction(null);

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!allRulesPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!captchaInput) {
      setError('Please enter the CAPTCHA code.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendRegisterOtp(form.name.trim(), form.email.trim(), form.password, captchaInput, captchaToken);
      if (result?.otpToken) {
        setOtpToken(result.otpToken);
        setStep(2);
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        setError('');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      }
    } catch (err) {
      setError(err.message);
      setErrorAction(err.action || null);
      fetchCaptcha();
    } finally { setLoading(false); }
  };

  // ── OTP handlers ────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
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
      setOtp(pasteData.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP → Create Account ─────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(form.name.trim(), form.email.trim(), form.password, fullOtp, otpToken);
      if (result?.pending) {
        setStep(3);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
      setErrorAction(err.action || null);
    } finally { setLoading(false); }
  };



  // ── Step 3: Pending ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="m-auth-page">
        <div className="m-auth-logo">
          <img src={dentzyLogo} alt="Dentzy" />
        </div>
        <div className="m-auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
          <h1 className="m-auth-title">Awaiting Approval</h1>
          <p className="m-auth-subtitle">
            Hi <strong>{form.name}</strong>, your registration is submitted!
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '12px 0 20px' }}>
            Our admin will review your account and approve it shortly. You'll be notified by email.
          </p>
          <div style={{ background: '#f0f7f3', borderRadius: '10px', padding: '10px', fontSize: '0.85rem', color: '#1e5038', fontWeight: 600, marginBottom: '20px' }}>
            {form.email}
          </div>
          <Link href="/login" className="m-auth-submit" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 2: OTP Verification ────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="m-auth-page">
        <button className="m-auth-back-btn" onClick={() => { setStep(1); setError(''); fetchCaptcha(); }} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="m-auth-logo">
          <img src={dentzyLogo} alt="Dentzy" />
        </div>

        <div className="m-auth-card">
          <h1 className="m-auth-title">Verify Email</h1>
          <p className="m-auth-subtitle">
            We sent a 6-digit code to <strong>{form.email}</strong>
          </p>

          {error && <div className="m-auth-error">{error}</div>}

          <form onSubmit={handleVerifyOtp}>
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
                    width: '42px',
                    height: '50px',
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    borderRadius: '10px',
                    border: digit ? '2px solid #1e5038' : '1.5px solid #cbd5e1',
                    background: '#fff',
                    color: '#1e2824',
                    outline: 'none',
                  }}
                />
              ))}
            </div>

            <button type="submit" className="m-auth-submit" disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying…' : 'Verify & Create Account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); fetchCaptcha(); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                ← Change Email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={async () => {
                  setError('');
                  setLoading(true);
                  try {
                    const result = await resendRegisterOtp(form.email.trim(), otpToken);
                    if (result?.otpToken) {
                      setOtpToken(result.otpToken);
                      setResendCooldown(60);
                      setOtp(['', '', '', '', '', '']);
                      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
                    }
                  } catch (err) {
                    setError(err.message || 'Failed to resend. Please go back and try again.');
                  } finally { setLoading(false); }
                }}
                style={{
                  background: 'none', border: 'none',
                  color: resendCooldown > 0 ? '#94a3b8' : '#1e5038',
                  fontWeight: '600',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 1: Registration Form ───────────────────────────────────────
  return (
    <div className="m-auth-page">
      {/* Back Arrow Button */}
      <button className="m-auth-back-btn" onClick={() => router.push('/')} aria-label="Back" title="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      <div className="m-auth-logo">
        <img src={dentzyLogo} alt="Dentzy" />
      </div>

      <div className="m-auth-card">
        <h1 className="m-auth-title">Create Account</h1>
        <p className="m-auth-subtitle">Register to access the Dentzy lab portal</p>

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

        <form onSubmit={handleSendOtp} noValidate>
          <div className="m-auth-input-group">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="Dr. John Doe" autoComplete="name" />
          </div>

          <div className="m-auth-input-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="your@email.com" autoComplete="email" />
          </div>

          <div className="m-auth-input-group">
            <label>Password</label>
            <div className="m-auth-pw-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="Create a strong password"
                autoComplete="new-password"
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

            {/* Strength bar */}
            {form.password && (
              <div className="m-pw-strength-wrap">
                <div className="m-pw-strength-bar">
                  <div className="m-pw-strength-fill"
                    style={{ width: strength.width, background: strength.color }} />
                </div>
                {strength.label && (
                  <span className="m-pw-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                )}
              </div>
            )}

            {/* Rules list */}
            {(pwFocused || form.password) && (
              <div className="m-pw-rules">
                {ruleResults.map((r) => (
                  <div key={r.id} className={`m-pw-rule ${r.passed ? 'm-pw-rule--pass' : 'm-pw-rule--fail'}`}>
                    <span className="m-pw-rule-dot" />
                    {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CAPTCHA */}
          <div className="m-auth-input-group">
            <label>Verify You're Human</label>
            <div className="m-captcha-wrap">
              <div className="m-captcha-img" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
              <input
                className="m-captcha-input"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter code"
                autoComplete="off"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <button type="button" className="m-captcha-refresh" onClick={fetchCaptcha} disabled={captchaLoading}>
                ↻
              </button>
            </div>
          </div>

          <button type="submit" className="m-auth-submit" disabled={loading}>
            {loading ? 'Sending Code…' : 'Verify Email & Sign Up'}
          </button>
        </form>

        <div className="m-auth-links" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link href="/login" className="m-auth-link">Sign In</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileRegister;
