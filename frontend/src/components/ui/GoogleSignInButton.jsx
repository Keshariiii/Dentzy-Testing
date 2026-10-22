'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * GoogleSignInButton
 * Seamless Google Identity Services button (zero external dependencies).
 * 
 * @param {string} mode - 'signin' | 'signup' | 'continue'
 * @param {function} onPending - callback when user account is pending approval
 * @param {function} onError - callback when error occurs
 */
export default function GoogleSignInButton({ mode = 'signin', onPending, onError }) {
  const router = useRouter();
  const { googleLogin } = useAuth();
  const btnContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const res = await googleLogin(response.credential);
      if (res?.status === 'pending') {
        if (onPending) {
          onPending(res.pending || res);
        } else {
          router.push('/login?pending=true');
        }
      } else if (res?.user) {
        router.replace('/dashboard');
      }
    } catch (err) {
      if (err?.status === 'pending') {
        if (onPending) onPending(err);
        else router.push('/login?pending=true');
      } else if (onError) {
        onError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  }, [googleLogin, onPending, onError, router]);

  const renderGoogleButton = useCallback(() => {
    if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.id || !btnContainerRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior rendered iframe before re-rendering
      btnContainerRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(btnContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(320, Math.max(220, btnContainerRef.current?.clientWidth || 280)),
      });
    } catch (e) {
      console.warn('Google sign-in button render warning:', e);
    }
  }, [clientId, mode, handleCredentialResponse]);

  useEffect(() => {
    if (scriptLoaded || window.google?.accounts?.id) {
      renderGoogleButton();
    }
  }, [scriptLoaded, renderGoogleButton]);

  if (!clientId) return null;

  return (
    <div className="google-auth-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      {loading && (
        <div style={{ fontSize: '0.85rem', color: '#708c80', marginBottom: '8px' }}>
          Signing in with Google…
        </div>
      )}
      <div
        ref={btnContainerRef}
        style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}
      />
    </div>
  );
}
