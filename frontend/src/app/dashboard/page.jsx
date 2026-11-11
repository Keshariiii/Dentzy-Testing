'use client';
/**
 * Dashboard page — Protected route. Redirects to /login if not authenticated.
 */
import { useAuth } from '../../context/AuthContext';
import { useMaintenance } from '../../context/MaintenanceContext';
import MaintenanceScreen from '../../components/MaintenanceScreen';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import { DentistDashboardShellSkeleton } from '../../components/SkeletonBlocks';
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCDashboard from '../../views/pc/PCDashboard';
import MobileDashboard from '../../views/mobile/MobileDashboard';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { isDentistBlocked } = useMaintenance();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // ponytail: Smooth transition to clinical maintenance screen when dentist portal is locked
  if (isDentistBlocked) {
    return <MaintenanceScreen role="dentist" />;
  }

  if (loading || !user) {
    return <DentistDashboardShellSkeleton isMobile={isMobile} />;
  }

  return <ResponsiveLayout pcView={<PCDashboard />} mobileView={<MobileDashboard />} />;
}
