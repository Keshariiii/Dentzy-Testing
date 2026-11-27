'use client';

import { useEffect, useState } from 'react';
import PortalStatusPage, {
  StatusActionButton,
  statusBtnPrimaryStyle,
  usePortalContext,
} from '@/components/common/PortalStatusPage';
import { getRootErrorConfig } from '@/utils/portalStatusPov';

export default function Error({ error, reset }) {
  const portal = usePortalContext();
  const [refId] = useState(
    () => 'DZ-ERR-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  );

  useEffect(() => {
    console.error('[Root Error Boundary caught]:', error);
  }, [error]);

  const view = getRootErrorConfig({ portal, refId });

  return (
    <PortalStatusPage
      portalContext={portal}
      eyebrow={view.eyebrow}
      title={view.title}
      paragraphs={view.paragraphs}
      actions={
        <>
          <button type="button" onClick={() => reset()} style={statusBtnPrimaryStyle}>
            Try again
          </button>
          <StatusActionButton action={view.secondaryAction} variant="secondary" />
        </>
      }
    />
  );
}
