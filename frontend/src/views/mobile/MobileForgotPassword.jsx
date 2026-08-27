'use client';
/**
 * MobileForgotPassword — Fullscreen mobile password reset with Brevo OTP flow.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { getAuthUrl } from '../../api/client';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileLogin.css';

const API_URL = getAuthUrl();

const MobileForgotPassword = () => {
  const router = useRouter();

  // ── Step State: 1 = Email, 2 = OTP, 3 = Password, 4 = Success ────────────
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]   = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError]     = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputsRef = useRef([]);

  // ── Resend cooldown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
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
      const res = await fetch(`${API_URL}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to send verification code.');
      } else {
        if (data.otpToken) setOtpToken(data.otpToken);
        setStep(2);
        setResendCooldown(60);
        setInfoMsg(`Code sent to ${cleanEmail}`);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input change & paste ───────────────────────────────────────────────
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

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password/verify-otp`, {
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
        setError(data.message || 'Invalid or expired code.');
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

    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update password.');
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

  return (
    <div className="m-auth-page">
      {/* Back Button */}
      <button className="m-auth-back-btn" onClick={() => router.push('/login')} aria-label="Back" title="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      <div className="m-auth-logo">
        <img src={dentzyLogo} alt="Dentzy" />
      </div>

      <div className="m-auth-card">
        {/* Step 4: Success */}
        {step === 4 ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="m-auth-title">Password Updated!</h1>
            <p className="m-auth-subtitle" style={{ marginTop: '8px' }}>
              Your password has been changed successfully. Redirecting you to sign in…
            </p>
            <button className="m-auth-submit" style={{ marginTop: '20px' }} onClick={() => router.push('/login')}>
              Sign In Now
            </button>
          </div>
        ) : step === 1 ? (
          /* Step 1: Email */
          <>
            <h1 className="m-auth-title">Reset Password</h1>
            <p className="m-auth-subtitle">Enter your registered email to receive a 6-digit verification code</p>

            {error && <div className="m-auth-error">{error}</div>}

            <form onSubmit={handleSendOtp} noValidate>
              <div className="m-auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button type="submit" className="m-auth-submit" disabled={loading}>
                {loading ? 'Sending Code…' : 'Send Verification Code →'}
              </button>
            </form>

            <div className="m-auth-links" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <Link href="/login" className="m-auth-link">Back to Sign In</Link>
            </div>
          </>
        ) : step === 2 ? (
          /* Step 2: OTP */
          <>
            <h1 className="m-auth-title">Enter Code</h1>
            <p className="m-auth-subtitle">
              We sent a 6-digit verification code to <strong>{email}</strong>
            </p>

            {infoMsg && (
              <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px', textAlign: 'center' }}>
                {infoMsg}
              </div>
            )}

            {error && <div className="m-auth-error">{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '16px 0' }} onPaste={handleOtpPaste}>
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
                      borderRadius: '8px',
                      border: digit ? '2px solid #1e5038' : '1.5px solid #cbd5e1',
                      background: '#fff',
                      color: '#1e2824',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>

              <button type="submit" className="m-auth-submit" disabled={loading || otp.join('').length !== 6}>
                {loading ? 'Verifying…' : 'Verify Code →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.8rem' }}>
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
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Step 3: Set Password */
          <>
            <h1 className="m-auth-title">Set New Password</h1>
            <p className="m-auth-subtitle">Create a new password for {email}</p>

            {error && <div className="m-auth-error">{error}</div>}

            <form onSubmit={handleResetPassword} noValidate>
              <div className="m-auth-input-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    style={{ paddingRight: '40px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="m-auth-input-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="m-auth-submit" disabled={loading}>
                {loading ? 'Updating Password…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileForgotPassword;
