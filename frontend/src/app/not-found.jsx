'use client';

// ponytail: Cloudflare-style 404 backed by shared PortalStatusPage shell
import React from 'react';
import PortalStatusPage from '@/components/common/PortalStatusPage';

export default function NotFound() {
  return (
    <PortalStatusPage
      title="Page not found"
      paragraphs={[
        'This page may not exist, or you may not have permission to access it.',
        "Make sure you're using the correct Dentzy account and have the required permissions.",
      ]}
    />
  );
}
