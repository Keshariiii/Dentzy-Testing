'use client';

import React from 'react';
import { useStaffAuth } from './StaffAuthContext';
import { normalizeDesignation } from '../utils/roles';
import ExecutiveStaffDashboard from './designations/ExecutiveStaffDashboard';
import ReceptionistStaffDashboard from './designations/ReceptionistStaffDashboard';
import CeramicStaffDashboard from './designations/CeramicStaffDashboard';
import AcrylicStaffDashboard from './designations/AcrylicStaffDashboard';
import CadCamStaffDashboard from './designations/CadCamStaffDashboard';
import MillingStaffDashboard from './designations/MillingStaffDashboard';
import SinteringStaffDashboard from './designations/SinteringStaffDashboard';
import ThreeDPrintingStaffDashboard from './designations/ThreeDPrintingStaffDashboard';
import DeliveryStaffDashboard from './designations/DeliveryStaffDashboard';
import './StaffDashboard.css';

/**
 * StaffDashboard — Canonical Role Dispatcher & Router.
 * Replaces monolithic dashboard with a clean designation-based router
 * that delegates rendering to each independent designation dashboard.
 */
export default function StaffDashboard() {
  const { staff } = useStaffAuth();
  const designation = normalizeDesignation(staff?.designation);

  switch (designation) {
    case 'CEO':
    case 'CTO':
      return <ExecutiveStaffDashboard />;

    case 'Receptionist':
      return <ReceptionistStaffDashboard />;

    case 'Ceramic':
      return <CeramicStaffDashboard />;

    case 'Acrylic':
      return <AcrylicStaffDashboard />;

    case 'CAD/CAM':
      return <CadCamStaffDashboard />;

    case 'Milling':
      return <MillingStaffDashboard />;

    case 'Sintering':
      return <SinteringStaffDashboard />;

    case '3D Printing':
      return <ThreeDPrintingStaffDashboard />;

    case 'Delivery':
      return <DeliveryStaffDashboard />;

    default:
      return <CeramicStaffDashboard />;
  }
}
