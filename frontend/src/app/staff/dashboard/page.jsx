'use client';
/**
 * Staff Dashboard page — Protected route. Redirects to /login?role=staff if not authenticated.
 * Ponytail: StaffDashboard is already responsive (built-in mobile bottom nav),
 * so no need for separate PC/Mobile views or ResponsiveLayout.
 */
import { useStaffAuth } from '../../../staff/StaffAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StaffDashboard from '../../../staff/StaffDashboard';

export default function StaffDashboardPage() {
  const { staff, loading } = useStaffAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !staff) {
      router.replace('/login?role=staff');
    }
  }, [staff, loading, router]);

  if (loading || !staff) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f5' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2ece6', borderTopColor: '#1e5038', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return <StaffDashboard />;
}
