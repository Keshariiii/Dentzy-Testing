'use client';
/**
 * Home page — Redirects logged-in users to their dashboards.
 */
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ResponsiveLayout from '../layouts/ResponsiveLayout';
import PCHome from '../views/pc/PCHome';
import MobileHome from '../views/mobile/MobileHome';

export default function HomePage() {
  const { user, loading: userLoading } = useAuth();
  const { admin, loading: adminLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !adminLoading) {
      if (user) router.replace('/dashboard');
      else if (admin) router.replace('/admin/dashboard');
    }
  }, [user, admin, userLoading, adminLoading, router]);

  if (userLoading || adminLoading) return null;
  if (user || admin) return null;

  return <ResponsiveLayout pcView={<PCHome />} mobileView={<MobileHome />} />;
}
