'use client';
/**
 * ExecutiveStaffDashboard — Full Admin PC & Mobile dashboard parity for CEO and CTO.
 * Ponytail: Reuses existing PCAdminDashboard and MobileAdminDashboard without duplicating views.
 */
import React from 'react';
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCAdminDashboard from '../../views/pc/PCAdminDashboard';
import MobileAdminDashboard from '../../views/mobile/MobileAdminDashboard';
import DashboardErrorBoundary from '../../components/common/DashboardErrorBoundary';

export default function ExecutiveStaffDashboard() {
  return (
    <DashboardErrorBoundary>
      <ResponsiveLayout pcView={<PCAdminDashboard />} mobileView={<MobileAdminDashboard />} />
    </DashboardErrorBoundary>
  );
}
