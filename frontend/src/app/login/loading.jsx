'use client';
import { SkeletonGroup, FormSkeleton } from '../../components/Skeleton';

export default function LoginLoading() {
  return (
    <SkeletonGroup>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background, #f8f7f4)',
          padding: '20px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <FormSkeleton fields={2} />
        </div>
      </div>
    </SkeletonGroup>
  );
}
