'use client';
/**
 * MobileForgotPassword — Fullscreen mobile password reset.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { getAuthUrl } from '../../api/client';
const dentzyLogo = '/dentzy-logo-v3.jpg';
import './MobileLogin.css'; /* Shared mobile auth styles */

const MobileForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = getAuthUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Password reset link sent to your email!');
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

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
        <h1 className="m-auth-title">Reset Password</h1>
        <p className="m-auth-subtitle">Enter your email and we'll send you a reset link</p>

        {error && <div className="m-auth-error">{error}</div>}
        {success && (
          <div className="m-auth-error" style={{ background: '#dcfce7', color: '#166534' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="m-auth-input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <button type="submit" className="m-auth-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="m-auth-links" style={{ justifyContent: 'center', marginTop: '16px' }}>
          <Link href="/login" className="m-auth-link">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default MobileForgotPassword;
