'use client';

// ponytail: Re-export Error5 component for standard page-level routing
import Error5 from '@/components/ui/error-5';

export default function MaintenancePage(props) {
  return <Error5 {...props} />;
}
