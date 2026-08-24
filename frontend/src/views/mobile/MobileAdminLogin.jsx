'use client';
/**
 * MobileAdminLogin -- Mobile version of the Admin Login page.
 * Redirects to the unified mobile login with admin role pre-selected.
 */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const MobileAdminLogin = () => {
  const router = useRouter();
  useEffect(() => { router.replace('/login?role=admin'); }, [router]);
  return null;
};

export default MobileAdminLogin;

