'use client';
/**
 * Admin Login page — Public route. Redirects to admin dashboard if already logged in.
 */
import { useAdminAuth } from '../../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ResponsiveLayout from '../../../layouts/ResponsiveLayout';
import PCAdminLogin from '../../../views/pc/PCAdminLogin';
import MobileAdminLogin from '../../../views/mobile/MobileAdminLogin';

export default function AdminLoginPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && admin) {
      router.replace('/admin/dashboard');
    }
  }, [admin, loading, router]);

  if (loading) return null;
  if (admin) return null;

  return <ResponsiveLayout pcView={<PCAdminLogin />} mobileView={<MobileAdminLogin />} />;
}
