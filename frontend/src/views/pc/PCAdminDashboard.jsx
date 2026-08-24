/**
 * PCAdminDashboard — Desktop version of the Admin Dashboard.
 *
 * Re-exports the existing AdminDashboard component.
 */
import React from 'react';
import AdminDashboard from '../../admin/AdminDashboard';

const PCAdminDashboard = () => {
    return <AdminDashboard />;
};

export default PCAdminDashboard;
