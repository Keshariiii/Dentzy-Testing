/**
 * ResponsiveLayout — Traffic Controller
 *
 * Conditionally renders EITHER the PC view or the Mobile view.
 * Only one is ever present in the DOM at any time — the other
 * is fully unmounted, ensuring strict separation with no DOM leakage.
 *
 * During SSR / initial hydration, renders nothing until the client
 * resolves the viewport width. This prevents hydration mismatch and
 * layout flash. The page-level loading.jsx provides visual feedback
 * in the meantime.
 *
 * Usage:
 *   <ResponsiveLayout
 *     pcView={<PCHome />}
 *     mobileView={<MobileHome />}
 *   />
 */
import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * @param {object} props
 * @param {React.ReactNode} props.pcView       — Component rendered on screens >= 768px
 * @param {React.ReactNode} props.mobileView   — Component rendered on screens < 768px
 * @param {number}          [props.breakpoint]  — Custom breakpoint (default 768)
 */
export default function ResponsiveLayout({ pcView, mobileView, breakpoint = 768 }) {
  const isMobile = useIsMobile(breakpoint);

  // During SSR and initial hydration, isMobile is undefined.
  // Return null to avoid rendering the wrong layout. The route's
  // loading.jsx (or inline loading state) covers this brief moment.
  if (isMobile === undefined) return null;

  // Only the active branch is mounted; the other is completely absent from the tree
  return isMobile ? <>{mobileView}</> : <>{pcView}</>;
}

