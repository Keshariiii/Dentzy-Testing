'use client';
/**
 * Staff Dashboard page — Protected route. Redirects to /login?role=staff if not authenticated.
 * Ponytail: StaffDashboard is already responsive (built-in mobile bottom nav),
 * so no need for separate PC/Mobile views or ResponsiveLayout.
 */
import { useStaffAuth } from '../../../staff/StaffAuthContext';
import { useMaintenance } from '../../../context/MaintenanceContext';
import MaintenanceScreen from '../../../components/MaintenanceScreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StaffDashboard from '../../../staff/StaffDashboard';
import ExecutiveStaffDashboard from '../../../staff/designations/ExecutiveStaffDashboard';
import { isExecutiveRole } from '../../../utils/roles';
import { SkeletonGroup, StatCardSkeleton, OrderSkeleton } from '../../../components/Skeleton';

export default function StaffDashboardPage() {
  const { staff, loading } = useStaffAuth();
  const { isStaffBlocked } = useMaintenance();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !staff) {
      router.replace('/login?role=staff');
    }
  }, [staff, loading, router]);

  // ponytail: Smooth transition to lab maintenance screen when staff portal is locked
  if (isStaffBlocked) {
    return <MaintenanceScreen role="staff" />;
  }

  if (loading || !staff) {
    return (
      <SkeletonGroup>
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--dz-color-bg-page, #f4f7f5)',
            padding: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <StatCardSkeleton count={3} />
          </div>
          <OrderSkeleton count={4} />
        </div>
      </SkeletonGroup>
    );
  }

  // Executive Staff (CEO / CTO) receive full Admin Dashboard experience
  if (isExecutiveRole(staff.designation)) {
    return <ExecutiveStaffDashboard />;
  }

  return <StaffDashboard />;
}
