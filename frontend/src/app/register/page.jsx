'use client';
/**
 * Register page — Public route. Redirects to dashboard if already logged in.
 */
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCRegister from '../../views/pc/PCRegister';
import MobileRegister from '../../views/mobile/MobileRegister';

export default function RegisterPage() {
  const { user, loading: userLoading } = useAuth();
  const { admin, loading: adminLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !adminLoading) {
      if (user) router.replace('/dashboard');
      else if (admin) router.replace('/admin/dashboard');
    }
  }, [user, admin, userLoading, adminLoading, router]);

  if (userLoading || adminLoading) {
    return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><span style={{ fontSize:'1.5rem', opacity:0.5 }}>Loading…</span></div>;
  }
  if (user || admin) return null;

  return <ResponsiveLayout pcView={<PCRegister />} mobileView={<MobileRegister />} />;
}
