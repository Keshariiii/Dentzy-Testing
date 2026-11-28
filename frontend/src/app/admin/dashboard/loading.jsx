'use client';

import { SkeletonGroup, StatCardSkeleton } from '../../../components/Skeleton';
import { DataTableSkeleton } from '../../../components/SkeletonBlocks';

/**
 * Route-level loading state for the admin dashboard.
 * Uses shared Skeleton components for a consistent loading experience.
 */
export default function AdminDashboardLoading() {
  return (
    <SkeletonGroup>
      <div className="dz-min-vh" style={{
        background: 'var(--dz-color-bg-page, #f4f7f5)',
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <StatCardSkeleton count={4} />
        </div>
        <DataTableSkeleton
          headers={['Case ID', 'Patient', 'Dentist', 'Status', 'Payment']}
          rows={8}
        />
      </div>
    </SkeletonGroup>
  );
}
