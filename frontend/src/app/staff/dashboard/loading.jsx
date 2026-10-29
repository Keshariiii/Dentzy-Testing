'use client';
import { SkeletonGroup, Skeleton, StatCardSkeleton, OrderSkeleton } from '../../../components/Skeleton';

/**
 * Route-level loading state for the staff dashboard.
 */
export default function StaffDashboardLoading() {
  return (
    <SkeletonGroup>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background, #f8f7f4)',
          padding: '24px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Skeleton width="180px" height="28px" borderRadius="8px" style={{ marginBottom: '6px' }} />
            <Skeleton width="140px" height="14px" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="36px" height="36px" borderRadius="10px" />
            <Skeleton width="36px" height="36px" borderRadius="10px" />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <StatCardSkeleton count={4} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Skeleton width="100px" height="32px" borderRadius="9999px" />
          <Skeleton width="100px" height="32px" borderRadius="9999px" />
          <Skeleton width="100px" height="32px" borderRadius="9999px" />
        </div>

        <OrderSkeleton count={5} />
      </div>
    </SkeletonGroup>
  );
}
