'use client';
/**
 * Admin Dashboard page — Protected route. Redirects to /login?role=admin if not authenticated.
 */
import { useAdminAuth } from '../../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { AdminShellSkeleton } from '../../../components/SkeletonBlocks';
import ResponsiveLayout from '../../../layouts/ResponsiveLayout';
import PCAdminDashboard from '../../../views/pc/PCAdminDashboard';
import MobileAdminDashboard from '../../../views/mobile/MobileAdminDashboard';
import DashboardErrorBoundary from '../../../components/common/DashboardErrorBoundary';

export default function AdminDashboardPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

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

  if (loading) {
    return <AdminShellSkeleton isMobile={isMobile} />;
  }

  if (!admin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f6f5', gap: '14px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Verifying admin access...</p>
        <a href="/login?role=admin" style={{ color: '#1e5038', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline' }}>
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
