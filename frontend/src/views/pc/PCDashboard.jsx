/**
 * PCDashboard — Desktop version of the User Dashboard.
 *
 * Re-exports the existing UserDashboard component.
 * All future desktop-specific dashboard changes should live here.
 */
import React from 'react';
import DentistDashboard from '../../components/DentistDashboard';

const PCDashboard = () => {
    return <DentistDashboard />;
};

export default PCDashboard;
