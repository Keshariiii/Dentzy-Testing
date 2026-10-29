'use client';
/**
 * Admin Dashboard page — Protected route. Redirects to /login?role=admin if not authenticated.
 */
import { useAdminAuth } from '../../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, Component } from 'react';
import ResponsiveLayout from '../../../layouts/ResponsiveLayout';
import PCAdminDashboard from '../../../views/pc/PCAdminDashboard';
import MobileAdminDashboard from '../../../views/mobile/MobileAdminDashboard';

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[DashboardErrorBoundary caught]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'var(--background)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: 'var(--card)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>Admin Dashboard Reload</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.5 }}>
              A technical error occurred while loading this view.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Reload Dashboard
              </button>
              <a
                href="/login?role=admin"
                style={{ background: 'var(--accent)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboardPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) {
      try {
        router.replace('/login?role=admin');
      } catch {
        if (typeof window !== 'undefined') {
          window.location.replace('/login?role=admin');
        }
      }
    }
  }, [admin, loading, router]);

  if (!admin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)', gap: '14px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>Verifying admin access...</p>
        <a href="/login?role=admin" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' }}>
          Click here to log in
        </a>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <ResponsiveLayout pcView={<PCAdminDashboard />} mobileView={<MobileAdminDashboard />} />
    </DashboardErrorBoundary>
  );
}
