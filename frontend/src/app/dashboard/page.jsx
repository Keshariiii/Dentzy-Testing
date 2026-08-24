'use client';
/**
 * Dashboard page — Protected route. Redirects to /login if not authenticated.
 */
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCDashboard from '../../views/pc/PCDashboard';
import MobileDashboard from '../../views/mobile/MobileDashboard';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f5' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2ece6', borderTopColor: '#1e5038', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return <ResponsiveLayout pcView={<PCDashboard />} mobileView={<MobileDashboard />} />;
}
