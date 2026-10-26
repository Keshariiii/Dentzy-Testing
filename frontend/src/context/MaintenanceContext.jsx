'use client';
// ponytail: Central reactive maintenance state listening to 503 events and polling live recovery status
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const MaintenanceContext = createContext(null);

export const DEFAULT_MAINTENANCE_STATE = {
  enabled: false,
  target: 'both',
  customMessage: 'We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.',
  estimatedTime: 'Expected back online: Today at 6:00 PM IST',
  showEmergencyContact: true,
  hotline: '+91 95036 68112',
  whatsapp: '919503668112',
  updatedAt: null,
};

export const MaintenanceProvider = ({ children }) => {
  const [maintenance, setMaintenance] = useState(DEFAULT_MAINTENANCE_STATE);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // ponytail: Lightweight status check against unblocked edge endpoint with cache-busting
  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/maintenance/status?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenance(prev => ({
          ...prev,
          enabled: Boolean(data.enabled),
          target: data.target || 'both',
          customMessage: data.customMessage || DEFAULT_MAINTENANCE_STATE.customMessage,
          estimatedTime: data.estimatedTime || DEFAULT_MAINTENANCE_STATE.estimatedTime,
          showEmergencyContact: data.showEmergencyContact !== false,
          hotline: data.hotline || '+91 95036 68112',
          whatsapp: data.whatsapp || '919503668112',
          updatedAt: data.updatedAt || null,
        }));
        setLastChecked(new Date());
        return { isLive: !data.enabled, data };
      }
    } catch {
      // Network failure, assume current state
    } finally {
      setChecking(false);
    }
    return { isLive: !maintenance.enabled, data: maintenance };
  }, [maintenance.enabled]);

  // Initial check on mount (skip for admin routes)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }
    checkStatus();
  }, [checkStatus]);

  // ponytail: Global 503 custom event listener smoothly transitions user without promise crashes
  useEffect(() => {
    const handleMaintenanceEvent = (event) => {
      const detail = event.detail;
      if (!detail) return;
      setMaintenance(prev => ({
        ...prev,
        enabled: true,
        target: detail.target || prev.target || 'both',
        affectedRole: detail.affectedRole,
        customMessage: detail.customMessage || prev.customMessage,
        estimatedTime: detail.estimatedTime || prev.estimatedTime,
        showEmergencyContact: detail.showEmergencyContact !== false,
        hotline: detail.hotline || prev.hotline,
        whatsapp: detail.whatsapp || prev.whatsapp,
        updatedAt: detail.updatedAt || prev.updatedAt,
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dentzy:maintenance', handleMaintenanceEvent);
      return () => window.removeEventListener('dentzy:maintenance', handleMaintenanceEvent);
    }
  }, []);

  const isRoleBlocked = useCallback((role) => {
    if (!maintenance.enabled) return false;
    if (role === 'admin') return false; // Admin is immune
    if (maintenance.target === 'both') return true;
    if (maintenance.target === 'dentists' && (role === 'dentist' || role === 'user')) return true;
    if (maintenance.target === 'staff' && role === 'staff') return true;
    return false;
  }, [maintenance.enabled, maintenance.target]);

  const clearMaintenance = useCallback(() => {
    setMaintenance(prev => ({ ...prev, enabled: false }));
  }, []);

  const value = useMemo(() => ({
    maintenance,
    isMaintenanceActive: maintenance.enabled,
    isDentistBlocked: isRoleBlocked('dentist'),
    isStaffBlocked: isRoleBlocked('staff'),
    isRoleBlocked,
    checkStatus,
    clearMaintenance,
    checking,
    lastChecked,
  }), [maintenance, isRoleBlocked, checkStatus, clearMaintenance, checking, lastChecked]);

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    return {
      maintenance: DEFAULT_MAINTENANCE_STATE,
      isMaintenanceActive: false,
      isDentistBlocked: false,
      isStaffBlocked: false,
      isRoleBlocked: () => false,
      checkStatus: async () => ({ isLive: true }),
      clearMaintenance: () => {},
      checking: false,
      lastChecked: null,
    };
  }
  return ctx;
};
