/**
 * ResponsiveLayout — Traffic Controller
 *
 * Conditionally renders EITHER the PC view or the Mobile view.
 * Only one is ever present in the DOM at any time — the other
 * is fully unmounted, ensuring strict separation with no DOM leakage.
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

  // Only the active branch is mounted; the other is completely absent from the tree
  return isMobile ? <>{mobileView}</> : <>{pcView}</>;
}
