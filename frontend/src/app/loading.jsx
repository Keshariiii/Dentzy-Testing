'use client';
import { SkeletonGroup, Skeleton, CardSkeleton } from '../components/Skeleton';

/**
 * Route-level loading state for the home page.
 * Uses content-matched skeletons to prevent layout shift.
 */
export default function HomeLoading() {
  return (
    <SkeletonGroup>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background, #f8f7f4)',
          color: 'var(--foreground, #1a1f2e)',
          padding: '24px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Navbar skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <Skeleton width="120px" height="32px" borderRadius="8px" />
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Skeleton width="80px" height="18px" />
            <Skeleton width="80px" height="18px" />
            <Skeleton width="100px" height="36px" borderRadius="9999px" />
          </div>
        </div>

        {/* Hero skeleton */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 64px' }}>
          <Skeleton width="40%" height="28px" borderRadius="20px" style={{ margin: '0 auto 16px' }} />
          <Skeleton width="90%" height="48px" borderRadius="10px" style={{ margin: '0 auto 16px' }} />
          <Skeleton width="70%" height="20px" style={{ margin: '0 auto 24px' }} />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Skeleton width="140px" height="44px" borderRadius="9999px" />
            <Skeleton width="140px" height="44px" borderRadius="9999px" />
          </div>
        </div>

        {/* Services / Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </SkeletonGroup>
  );
}
