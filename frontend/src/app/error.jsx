'use client';

import { useEffect, useState } from 'react';
import PortalStatusPage, {
  statusBtnPrimaryStyle,
  statusBtnSecondaryStyle,
} from '@/components/common/PortalStatusPage';

export default function Error({ error, reset }) {
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [refId] = useState(
    () => 'DZ-ERR-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  );

  useEffect(() => {
    console.error('[Root Error Boundary caught]:', error);
    if (typeof window !== 'undefined') {
      setIsAdminPath(window.location.pathname.startsWith('/admin'));
    }
  }, [error]);

  return (
    <PortalStatusPage
      eyebrow={`Something went wrong · Reference ${refId}`}
      title="We hit a technical issue"
      paragraphs={[
        'An unexpected error occurred while loading this view. Your data has not been affected.',
        "Try loading the view again, or make sure you're signed in to the correct Dentzy account.",
      ]}
      actions={
        <>
          <button type="button" onClick={() => reset()} style={statusBtnPrimaryStyle}>
            Try again
          </button>
          <a href={isAdminPath ? '/login?role=admin' : '/login'} style={statusBtnSecondaryStyle}>
            {isAdminPath ? 'Admin Login' : 'Go to Login'}
          </a>
        </>
      }
    />
  );
}
