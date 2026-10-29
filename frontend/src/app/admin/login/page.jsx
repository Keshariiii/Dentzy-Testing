'use client';
/**
 * Admin Login page — Public route.
 * Redirects to /admin/dashboard if already logged in, otherwise forwards to unified /login?role=admin.
 */
import { useAdminAuth } from '../../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)', gap: '14px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Loading Admin Portal...</p>
      <a href="/login?role=admin" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' }}>
        Click here if not redirected automatically
      </a>
    </div>
  );
}
