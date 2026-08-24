'use client';
/**
 * Login page — Public route. Redirects to dashboard if already logged in.
 * Suspense is required because child components use useSearchParams().
 */
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCLogin from '../../views/pc/PCLogin';
import MobileLogin from '../../views/mobile/MobileLogin';

function LoginContent() {
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

  return <ResponsiveLayout pcView={<PCLogin />} mobileView={<MobileLogin />} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><span style={{ fontSize:'1.5rem', opacity:0.5 }}>Loading…</span></div>}>
      <LoginContent />
    </Suspense>
  );
}
