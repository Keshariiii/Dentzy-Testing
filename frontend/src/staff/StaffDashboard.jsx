'use client';

import React from 'react';
import { useStaffAuth } from './StaffAuthContext';
import { normalizeDesignation } from '../utils/roles';
import ExecutiveStaffDashboard from './designations/ExecutiveStaffDashboard';
import ReceptionistStaffDashboard from './designations/ReceptionistStaffDashboard';
import DeliveryStaffDashboard from './designations/DeliveryStaffDashboard';
import ProductionStaffView from './common/ProductionStaffView';
import './StaffDashboard.css';

const PRODUCTION_DEPTS = ['Ceramic', 'Acrylic', 'CAD/CAM', 'Milling', 'Sintering', '3D Printing'];

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

    case 'Delivery':
      return <DeliveryStaffDashboard />;

    default: {
      const dept = PRODUCTION_DEPTS.includes(designation) ? designation : 'Ceramic';
      return <ProductionStaffView departmentName={dept} title={`${dept} Section`} />;
    }
  }
}
