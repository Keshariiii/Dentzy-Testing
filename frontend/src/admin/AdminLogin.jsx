'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * AdminLogin is now a thin redirect shim.
 * Any visit to /admin/login is transparently forwarded to the
 * unified login portal at /login?role=admin, which pre-selects
 * the Admin role card on arrival.
 */
const AdminLogin = () => {
  const router = useRouter();
  useEffect(() => { router.replace('/login?role=admin'); }, [router]);
  return null;
};

export default AdminLogin;

