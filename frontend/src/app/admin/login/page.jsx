'use client';
/**
 * Admin Login page — Public route.
 * Redirects to /admin/dashboard if already logged in, otherwise forwards to unified /login?role=admin.
 */
import { useAdminAuth } from '../../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import RouteSpinner from '../../../components/common/RouteSpinner';

export default function AdminLoginPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (admin) {
      try {
        router.replace('/admin/dashboard');
      } catch {
        if (typeof window !== 'undefined') window.location.replace('/admin/dashboard');
      }
    } else {
      try {
        router.replace('/login?role=admin');
      } catch {
        if (typeof window !== 'undefined') window.location.replace('/login?role=admin');
      }
    }
  }, [admin, loading, router]);

  return (
    <div className="dz-min-vh" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--dz-color-bg-page, #f0f5f2)', gap: '14px', fontFamily: 'var(--dz-font-family)' }}>
      <RouteSpinner label="Loading Admin Portal..." style={{ minHeight: 'auto', background: 'transparent' }} />
      <a href="/login?role=admin" style={{ color: '#1e5038', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' }}>
        Click here if not redirected automatically
      </a>
    </div>
  );
}
