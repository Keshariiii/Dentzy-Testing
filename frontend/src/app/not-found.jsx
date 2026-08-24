'use client';
/**
 * 404 — Not Found page. Redirects to home.
 */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>Redirecting…</span>
    </div>
  );
}
