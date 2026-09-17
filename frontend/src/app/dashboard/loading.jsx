'use client';

import { SkeletonGroup, StatCardSkeleton, OrderSkeleton } from '../../components/Skeleton';

/**
 * Route-level loading state for the dentist dashboard.
 * Uses the existing Skeleton components for a polished loading experience.
 */
export default function DashboardLoading() {
  return (
    <SkeletonGroup>
      <div style={{
        minHeight: '100vh',
        background: 'var(--dz-color-bg-page, #f4f7f5)',
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <StatCardSkeleton count={4} />
        </div>
        <OrderSkeleton count={5} />
      </div>
    </SkeletonGroup>
  );
}
