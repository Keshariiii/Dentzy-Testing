'use client';
import { SkeletonGroup, FormSkeleton } from '../../components/Skeleton';

export default function RegisterLoading() {
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
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <FormSkeleton fields={5} />
        </div>
      </div>
    </SkeletonGroup>
  );
}
