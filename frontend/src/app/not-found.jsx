'use client';

// ponytail: Cloudflare-style 404 backed by shared POV-aware PortalStatusPage shell
import React from 'react';
import PortalStatusPage, {
  StatusActionButton,
  usePortalContext,
} from '@/components/common/PortalStatusPage';
import { getNotFoundConfig } from '@/utils/portalStatusPov';

export default function NotFound() {
  const portal = usePortalContext();
  const view = getNotFoundConfig(portal);

  return (
    <PortalStatusPage
      portalContext={portal}
      eyebrow={view.eyebrow}
      title={view.title}
      paragraphs={view.paragraphs}
      actions={
        <>
          <StatusActionButton action={view.primaryAction} variant="primary" />
          <StatusActionButton action={view.secondaryAction} variant="secondary" />
        </>
      }
    />
  );
}
