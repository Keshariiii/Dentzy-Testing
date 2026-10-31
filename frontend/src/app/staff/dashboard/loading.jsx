'use client';

import React from 'react';
import { SkeletonGroup, StatCardSkeleton, OrderSkeleton } from '../../../components/Skeleton';

/**
 * Route-level loading state for the staff dashboard.
 * Uses SkeletonGroup, StatCardSkeleton (count=3), and OrderSkeleton (count=4)
 * matching the admin dashboard skeleton layout.
 */
export default function StaffDashboardLoading() {
  return (
    <SkeletonGroup>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--dz-color-bg-page, #f4f7f5)',
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <StatCardSkeleton count={3} />
        </div>
        <OrderSkeleton count={4} />
      </div>
    </SkeletonGroup>
  );
}
