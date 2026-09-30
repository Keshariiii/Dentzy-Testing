'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthUrl } from '../api/client';
import { User, Mail, Lock, Eye, EyeOff, Check, X, Clock, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { VengeanceButton } from './ui/vengeance-button';
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
  const { sendRegisterOtp, resendRegisterOtp, register } = useAuth();

  // step: 1 = form, 2 = OTP, 3 = pending
  const [step, setStep] = useState(1);

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
  /* #33 — Field-level validation state */
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '' });

  // CAPTCHA state
  const [captchaInput, setCaptchaInput]   = useState('');
  const [captchaToken, setCaptchaToken]   = useState('');
  const [captchaSvg, setCaptchaSvg]       = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [otp, setOtp]                         = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]               = useState('');
  const [resendCooldown, setResendCooldown]   = useState(0);
  const otpInputsRef                          = useRef([]);

  const [pending, setPending] = useState(null);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);


  // Compute which rules pass in real time
  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password]
  );
  const passedCount   = ruleResults.filter((r) => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;

  // Strength label & colour
  const strength = useMemo(() => {
    if (passedCount === 0) return { label: '', color: '#e0e0e0', fill: 0 };
    if (passedCount <= 2)  return { label: 'Weak',   color: '#e74c3c', fill: 0.33 };
    if (passedCount <= 3)  return { label: 'Fair',   color: '#f39c12', fill: 0.55 };
    if (passedCount === 4) return { label: 'Good',   color: '#708c80', fill: 0.78 };
    return                        { label: 'Strong', color: '#27ae60', fill: 1 };
  }, [passedCount]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setErrorAction(null);
    /* #33 — Clear field error on type */
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  /* #33 — Real-time email validation on blur */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email' && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
    if (name === 'name' && value.trim() && value.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
    }
  };

  // ── Step 1: Submit form → Send OTP ──────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setErrorAction(null);

    /* #34 — Specific error messages instead of generic 'fill all fields' */
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('Please enter a valid email address (e.g. doctor@clinic.com).');
      setFieldErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      return;
    }
    if (!form.password) {
      setError('Please create a password.');
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
      if (err.invalidCaptcha) fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers (same pattern as ForgotPassword) ─────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
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
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(form.name.trim(), form.email.trim(), form.password, fullOtp, otpToken);
      if (remember) {
        localStorage.setItem('dentzy_remember_email', form.email.trim());
      } else {
        localStorage.removeItem('dentzy_remember_email');
      }
      if (result?.pending) {
        setPending({ name: form.name.trim(), email: form.email.trim() });
        setStep(3);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
      setErrorAction(err.action || null);
    } finally {
      setLoading(false);
    }
  };


  // ── Pending approval screen ──────────────────────────────────────
  if (step === 3 || pending) {
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
              <Clock size={40} strokeWidth={1.5} color="var(--dz-color-primary, #708c80)" />
            </div>
            <h2 className="auth-card-title">Awaiting Approval</h2>
            <p className="pending-msg">
              Hi <strong>{pending?.name || form.name}</strong>, your registration request has been submitted successfully!
            </p>
            <p className="pending-sub">
              Our admin will review your account and approve it shortly. You'll be able to log in once approved.
            </p>
            <div className="pending-email-tag">{pending?.email || form.email}</div>
            <VengeanceButton asChild size="md" className="auth-vengeance-btn" style={{ marginTop: '20px' }}>
              <Link href="/login" id="go-to-login-pending" style={{ textDecoration: 'none' }}>
                Go to Login
              </Link>
            </VengeanceButton>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: OTP Verification Screen ─────────────────────────────────
  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-overlay" />
          <div className="auth-left-content">
            <h1 className="auth-welcome">
              <span>VERIFY</span>
              <span className="auth-welcome-back">Your Email</span>
            </h1>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-header-logo">
            <img src={dentzyLogo} alt="Dentzy Logo" />
          </div>

          <div className="auth-card">
            <h2 className="auth-card-title">Enter Verification Code</h2>
            <p className="auth-card-subtitle" style={{ color: '#4a5d54', fontSize: '0.9rem', marginBottom: '8px' }}>
              We sent a 6-digit code to <strong>{form.email}</strong>
            </p>

            <form className="auth-form" onSubmit={handleVerifyOtp}>
              {/* 6-box OTP Input */}
              <div className="otp-input-group" style={{ margin: '20px 0' }} onPaste={handleOtpPaste}>
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
                    className={`otp-digit${digit ? ' otp-digit--filled' : ''}`}
                  />
                ))}
              </div>

              {error && (
                <div className="auth-error">
                  {error}
                  {errorAction === 'LOGIN' && (
                    <span> <Link href="/login" className="auth-error-link">Login here →</Link></span>
                  )}
                </div>
              )}

              <VengeanceButton type="submit" size="md" className="auth-vengeance-btn" disabled={loading || otp.join('').length !== 6} id="register-verify-otp-btn">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Create Account →'}
              </VengeanceButton>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
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
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Registration Form ───────────────────────────────────────
  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-overlay" />
        <div className="auth-left-content">
          <h1 className="auth-welcome">
            <span>WELCOME</span>
            <span>TO</span>
            <span>DEN<em className="auth-accent">T</em>ZY</span>
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

          {/* #32 — Registration progress indicator */}
          <div className="auth-progress">
            {[
              { num: 1, label: 'Create Account' },
              { num: 2, label: 'Verify Email' },
              { num: 3, label: 'Approval' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className={`auth-progress-step ${step >= s.num ? 'auth-progress-step--active' : ''} ${step === s.num ? 'auth-progress-step--current' : ''}`}>
                  <div className="auth-progress-dot">
                    {step > s.num ? (
                      <Check size={12} strokeWidth={3} />
                    ) : s.num}
                  </div>
                  <span className="auth-progress-label">{s.label}</span>
                </div>
                {i < 2 && <div className={`auth-progress-line ${step > s.num ? 'auth-progress-line--done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSendOtp} noValidate>
            {/* Name */}
            <div className="auth-input-group">
              <label htmlFor="register-name" className="sr-only">Full name</label>
              <span className="auth-input-icon">
                <User size={16} strokeWidth={2} />
              </span>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input${fieldErrors.name ? ' auth-input--error' : ''}`}
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && <div className="auth-field-error">{fieldErrors.name}</div>}

            {/* Email */}
            <div className="auth-input-group">
              <label htmlFor="register-email" className="sr-only">Email address</label>
              <span className="auth-input-icon">
                <Mail size={16} strokeWidth={2} />
              </span>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input${fieldErrors.email ? ' auth-input--error' : ''}`}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}

            {/* Password */}
            <div className="auth-input-group">
              <label htmlFor="register-password" className="sr-only">Password</label>
              <span className="auth-input-icon">
                <Lock size={16} strokeWidth={2} />
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
                {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </div>

            {/* Password strength meter + checklist */}
            {(pwFocused && form.password.length > 0) && (
              <div className="pw-strength-box">
                {/* Strength bar */}
                <div className="pw-strength-bar-track">
                  <div
                    className="pw-strength-bar-fill"
                    style={{ '--pw-fill': strength.fill, backgroundColor: strength.color }}
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
                          <Check size={12} strokeWidth={3} />
                        ) : (
                          <X size={12} strokeWidth={3} />
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
                        <Loader2 size={22} strokeWidth={2} color="var(--dz-color-primary, #708c80)" className="captcha-spin" />
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
                  <RefreshCw size={17} strokeWidth={2.2} className={captchaLoading ? 'captcha-spin' : ''} />
                </button>
              </div>
              <div className="captcha-input-group auth-input-group">
                <label htmlFor="register-captcha" className="sr-only">CAPTCHA code</label>
                <span className="auth-input-icon">
                  <ShieldCheck size={15} strokeWidth={2} />
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
              <div className="auth-error" id="register-error" role="alert">
                {error}
                {errorAction === 'LOGIN' && (
                  <span> <Link href="/login" className="auth-error-link">Login here →</Link></span>
                )}
              </div>
            )}

            {/* Submit */}
            <VengeanceButton type="submit" size="md" className="auth-vengeance-btn" disabled={loading} id="register-submit">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Mail size={16} strokeWidth={2} />
                  Verify Email & Sign Up
                </>
              )}
            </VengeanceButton>
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

