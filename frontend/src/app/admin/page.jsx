'use client';
import { useEffect } from 'react';
import RouteSpinner from '../../components/common/RouteSpinner';

export default function AdminIndexPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAdmin = localStorage.getItem('dentzy_admin_info');
      if (savedAdmin) {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/login?role=admin');
      }
    }
  }, []);

  return <RouteSpinner label="Loading Admin Portal..." />;
}
