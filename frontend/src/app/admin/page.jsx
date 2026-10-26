'use client';
import { useEffect } from 'react';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f7f5', gap: '14px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #c5ddd3', borderTopColor: '#1e5038', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading Admin Portal...</p>
    </div>
  );
}
