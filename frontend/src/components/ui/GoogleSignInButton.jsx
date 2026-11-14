'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * GoogleSignInButton
 * Triggers google.accounts.id.prompt() on click — no iframe overlay, iOS Safari safe.
 *
 * @param {string} mode - 'signin' | 'signup' | 'continue'
 * @param {function} onPending - callback when user account is pending approval
 * @param {function} onError - callback when error occurs
 */
export default function GoogleSignInButton({ mode = 'signin', onPending, onError }) {
  const router = useRouter();
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const initialized = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const googleMode = mode === 'signup' ? 'register' : 'login';
      const res = await googleLogin(response.credential, googleMode);
      if (res?.status === 'pending') {
        if (onPending) onPending(res.pending || res);
        else router.push('/login?pending=true');
      } else if (res?.user) {
        router.replace('/dashboard');
      }
    } catch (err) {
      if (err?.status === 'pending') {
        if (onPending) onPending(err);
        else router.push('/login?pending=true');
      } else if (onError) {
        onError(err.message || 'Google sign-in failed.', err);
      }
    } finally {
      setLoading(false);
    }
  }, [googleLogin, mode, onPending, onError, router]);

  // Initialize GIS once script loads; re-init if mode changes
  useEffect(() => {
    if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    initialized.current = true;
  }, [scriptLoaded, clientId, handleCredentialResponse]);

  const handleClick = useCallback(() => {
    if (!window.google?.accounts?.id || !initialized.current) return;
    window.google.accounts.id.prompt();
  }, []);

  if (!clientId) return null;

  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div className="dz-google-auth-wrapper">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <button
        type="button"
        className="dz-google-btn"
        onClick={handleClick}
        disabled={loading}
        aria-label={label}
      >
        {loading ? (
          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Connecting…</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .dz-google-auth-wrapper { width: 100%; }
        .dz-google-btn {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #1e2824;
          font-size: 0.88rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .dz-google-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .dz-google-btn:disabled { opacity: 0.6; cursor: default; }
      `}} />
    </div>
  );
}
