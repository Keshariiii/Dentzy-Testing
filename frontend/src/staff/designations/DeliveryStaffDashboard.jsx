'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import StaffNoticeBar from '../../components/common/StaffNoticeBar';
import StaffSettingsView from '../common/StaffSettingsView';
import { OrderSkeleton } from '../../components/Skeleton';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { DentzyCard, DentzyCaseChip, DentzyStatusPill } from '../../components/common/DentzyCard';
import '../StaffDashboard.css';

function parseTeeth(order) {
  const raw = order?.teeth_data ?? order?.teethData ?? order?.teeth;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * DeliveryStaffDashboard — Dedicated dashboard for Delivery personnel.
 * 2 Tabs: 'delivery' | 'settings'. Default: 'delivery'.
 * Mobile: TwentyFirstBottomNav with 2 items (map with pending badge, settings).
 */
export default function DeliveryStaffDashboard() {
  const { authFetch, STAFF_API, staff, staffLogout } = useStaffAuth();
  const { showToast } = useToast();
  const apiBase = STAFF_API || '/api/staff';

  const [activeTab, setActiveTab] = useState('delivery');
  const [filterType, setFilterType] = useState('pending'); // 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // ── Fetch deliveries from GET /api/staff/deliveries ──────────────────────
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${apiBase}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || data.orders || []);
      } else {
        showToast('Failed to load deliveries.', 'error');
      }
    } catch (err) {
      showToast('Network error while loading deliveries.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, apiBase, showToast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ── Status update: PATCH /api/staff/deliveries/:orderId/status ──────────
  const handleUpdateDeliveryStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await authFetch(`${apiBase}/deliveries/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (newStatus === 'completed' ? 'Delivery marked as completed.' : 'Dispatched successfully!'));
        // Optimistically update list
        setDeliveries((prev) =>
          prev.map((item) => {
            if ((item.id || item._id) === orderId || item.caseId === orderId) {
              const stage = newStatus === 'completed' ? 'completed' : 'dispatched';
              const deliveryStatus = newStatus === 'completed' ? 'Delivered' : 'Out for Delivery';
              return {
                ...item,
                stage,
                deliveryStatus,
                taskStatus: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : item.completed_at,
              };
            }
            return item;
          })
        );
        fetchDeliveries();
      } else {
        showToast(data.message || 'Failed to update delivery status.', 'error');
      }
    } catch {
      showToast('Network error updating delivery status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Count and filter calculations ─────────────────────────────────────────
  const pendingDeliveries = useMemo(() => {
    return deliveries.filter((d) => d.stage !== 'completed' && d.deliveryStatus !== 'Delivered');
  }, [deliveries]);

  const completedDeliveries = useMemo(() => {
    return deliveries.filter((d) => d.stage === 'completed' || d.deliveryStatus === 'Delivered');
  }, [deliveries]);

  const displayedDeliveries = useMemo(() => {
    const list = filterType === 'pending' ? pendingDeliveries : completedDeliveries;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((d) => {
      const caseId = (d.caseId || '').toLowerCase();
      const patient = (d.patientName || '').toLowerCase();
      const dentist = (d.dentistName || d.owner?.name || '').toLowerCase();
      const clinic = (d.clinicName || d.owner?.clinicName || '').toLowerCase();
      const address = (d.deliveryAddress || d.owner?.address || '').toLowerCase();
      return (
        caseId.includes(q) ||
        patient.includes(q) ||
        dentist.includes(q) ||
        clinic.includes(q) ||
        address.includes(q)
      );
    });
  }, [deliveries, filterType, pendingDeliveries, completedDeliveries, searchQuery]);

  // ── Mobile Bottom Navigation Items ────────────────────────────────────────
  const mobileNavItems = useMemo(
    () => [
      {
        key: 'delivery',
        label: 'Deliveries',
        icon: (active) => Ico.map(typeof active === 'number' ? active : (active ? 20 : 18)),
        badge: pendingDeliveries.length > 0 ? pendingDeliveries.length : undefined,
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: (active) => Ico.settings(typeof active === 'number' ? active : (active ? 20 : 18)),
      },
    ],
    [pendingDeliveries.length]
  );

  return (
    <div className="sd-shell">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="sd-header">
        <div className="sd-header-left">
          <div className="sd-header-logo-btn">
            <span className="sd-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Delivery & Logistics</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#e0ece5',
                  color: '#1e5038',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Logistics Portal
              </span>
            </span>
          </div>
        </div>

        {/* Desktop View Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-[#f0f4f2] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'bg-white text-[#1e5038] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {Ico.map(14)}
            <span>Deliveries</span>
            {pendingDeliveries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {pendingDeliveries.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-[#1e5038] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {Ico.settings(14)}
            <span>Settings</span>
          </button>
        </div>

        <div className="sd-header-right">
          <div className="sd-header-user">
            <div className="sd-avatar">
              {staff?.displayName ? staff.displayName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="sd-header-user-details">
              <span className="sd-header-name">{staff?.displayName || 'Delivery Staff'}</span>
              <span className="sd-header-role">Delivery Specialist</span>
            </div>
          </div>
          <button
            type="button"
            onClick={staffLogout}
            className="sd-logout-btn"
            title="Log Out"
            aria-label="Log Out"
          >
            {Ico.logout(15)}
            <span className="sd-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Notice Bar ────────────────────────────────────────────────────── */}
      <StaffNoticeBar />

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="sd-main" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '16px' }}>
        {activeTab === 'settings' ? (
          <StaffSettingsView />
        ) : (
          <div>
            {/* ── Section Title & Filter Toggle ───────────────────────────────── */}
            <div className="sd-section-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 className="sd-section-title" style={{ margin: 0 }}>Dispatch Queue</h2>
                <div style={{ fontSize: '0.8rem', color: '#527264', marginTop: '2px' }}>
                  {pendingDeliveries.length} pending pickup/dispatch · {completedDeliveries.length} delivered
                </div>
              </div>

              <div className="sd-controls" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {/* Search Bar */}
                <div className="sd-search-wrap" style={{ minWidth: '220px' }}>
                  {Ico.search(14)}
                  <input
                    type="text"
                    className="sd-search"
                    placeholder="Search clinic, case ID, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Filter Pills: Pending vs Completed */}
                <div className="sd-filter-group" style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`sd-filter-btn ${filterType === 'pending' ? 'sd-filter-btn--active' : ''}`}
                    onClick={() => setFilterType('pending')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Pending Deliveries</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: filterType === 'pending' ? 'rgba(255,255,255,0.3)' : '#e2ece6',
                        color: filterType === 'pending' ? '#fff' : '#1e5038',
                      }}
                    >
                      {pendingDeliveries.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`sd-filter-btn ${filterType === 'completed' ? 'sd-filter-btn--active' : ''}`}
                    onClick={() => setFilterType('completed')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Completed</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: filterType === 'completed' ? 'rgba(255,255,255,0.3)' : '#e2ece6',
                        color: filterType === 'completed' ? '#fff' : '#1e5038',
                      }}
                    >
                      {completedDeliveries.length}
                    </span>
                  </button>
                </div>

                {/* Refresh Button */}
                <TwentyFirstIconButton
                  icon={Ico.refresh(16)}
                  title="Refresh Deliveries"
                  ariaLabel="Refresh Deliveries"
                  onClick={fetchDeliveries}
                  variant="secondary"
                  size="md"
                />
              </div>
            </div>

            {/* ── Deliveries List ─────────────────────────────────────────────── */}
            {loading ? (
              <div style={{ marginTop: '12px' }}>
                <OrderSkeleton count={4} />
              </div>
            ) : displayedDeliveries.length === 0 ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '48px 20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: '#eef5f1', color: '#1e5038', marginBottom: '12px' }}>
                  {Ico.map(36)}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e2924', margin: '0 0 6px 0' }}>
                  {searchQuery ? 'No matching deliveries' : filterType === 'pending' ? 'No pending deliveries' : 'No completed deliveries'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  {searchQuery
                    ? 'Try adjusting your search criteria.'
                    : filterType === 'pending'
                    ? 'All orders ready for delivery have been completed.'
                    : 'Delivered orders will appear here once finalized.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {displayedDeliveries.map((delivery) => {
                  const orderId = delivery.id || delivery._id || delivery.caseId;
                  const isUpdating = updatingId === orderId;
                  const teeth = parseTeeth(delivery);
                  const isQCReady = delivery.stage === 'qc' || delivery.deliveryStatus === 'Ready for Pickup (QC Passed)';
                  const isDispatched = delivery.stage === 'dispatched' || delivery.deliveryStatus === 'Out for Delivery';
                  const isDelivered = delivery.stage === 'completed' || delivery.deliveryStatus === 'Delivered';

                  const clinicName = delivery.clinicName || delivery.owner?.clinicName || 'Clinic Name Not Provided';
                  const dentistName = delivery.dentistName || delivery.owner?.name || 'Dentist';
                  const address = delivery.deliveryAddress || delivery.owner?.address || 'Address not listed';
                  const phone = delivery.contactPhone || delivery.owner?.phone || '';

                  const isUrgent = (delivery.priority || '').toLowerCase() === 'urgent';

                  return (
                    <DentzyCard
                      key={orderId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      {/* ── ROW 1: WHAT (Case info, patient, restoration, priority, QC badge) ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <DentzyCaseChip caseId={delivery.caseId || orderId} />
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e2924' }}>
                              {delivery.patientName || 'Unnamed Patient'}
                            </span>
                            {/* Restoration Type */}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: '#f0f4f2',
                                color: '#2d5a45',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {delivery.serviceType || 'Dental Case'}
                            </span>
                            {/* Teeth info */}
                            {teeth.length > 0 && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: '#eef2f6',
                                  color: '#3b5998',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                }}
                              >
                                Teeth: {teeth.join(', ')} ({teeth.length} {teeth.length === 1 ? 'unit' : 'units'})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isUrgent ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '3px 9px',
                                borderRadius: '8px',
                                letterSpacing: '0.02em',
                              }}
                            >
                              URGENT
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '3px 8px',
                                borderRadius: '8px',
                              }}
                            >
                              Standard
                            </span>
                          )}

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: '#e6f4ea',
                              color: '#137333',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            QC Passed
                          </span>
                        </div>
                      </div>

                      {/* ── ROW 2: WHERE (Clinic Name, Dentist, Address, Phone) ── */}
                      <div
                        style={{
                          background: '#f8faf9',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e2924' }}>
                              {clinicName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#527264', fontWeight: 600 }}>
                              Dr. {dentistName}
                            </div>
                          </div>

                          {phone && (
                            <a
                              href={`tel:${phone.replace(/\s+/g, '')}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#1e5038',
                                color: '#ffffff',
                                textDecoration: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'opacity 0.15s ease',
                              }}
                              title="Call clinic contact number"
                            >
                              {Ico.phone(13)}
                              <span>Call {phone}</span>
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '4px' }}>
                          <span style={{ color: '#1e5038', marginTop: '2px', flexShrink: 0 }}>
                            {Ico.map(15)}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                            {address}
                          </span>
                        </div>
                      </div>

                      {/* ── ROW 3: WHEN (Due Date, QC timestamp, Delivered timestamp) ── */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '0.78rem',
                          color: '#64748b',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          {delivery.dueDate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#334155' }}>
                              {Ico.calendar(13)} Due: {formatDate(delivery.dueDate)}
                            </span>
                          )}
                          {delivery.qc_at && (
                            <span>QC Cleared: {formatDate(delivery.qc_at)} {formatTime(delivery.qc_at)}</span>
                          )}
                          {delivery.completed_at && (
                            <span style={{ color: '#15803d', fontWeight: 600 }}>
                              Delivered at: {formatDate(delivery.completed_at)} {formatTime(delivery.completed_at)}
                            </span>
                          )}
                        </div>

                        {/* Status Label */}
                        <div style={{ fontWeight: 700 }}>
                          {isQCReady && (
                            <span style={{ color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                              Ready for Pickup
                            </span>
                          )}
                          {isDispatched && (
                            <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: '6px' }}>
                              Out for Delivery
                            </span>
                          )}
                          {isDelivered && (
                            <span style={{ color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                              Delivered Successfully
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── ROW 4: ACTIONS (Dispatch / Mark Delivered) ── */}
                      {!isDelivered && (
                        <div
                          style={{
                            borderTop: '1px solid #f0f4f2',
                            paddingTop: '12px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                          }}
                        >
                          {isQCReady && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateDeliveryStatus(orderId, 'in_progress')}
                              style={{
                                background: '#1e5038',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '9px 18px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: isUpdating ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isUpdating ? 0.7 : 1,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                              </svg>
                              <span>{isUpdating ? 'Dispatching...' : 'Start Delivery / Mark Dispatched'}</span>
                            </button>
                          )}

                          {isDispatched && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateDeliveryStatus(orderId, 'completed')}
                              style={{
                                background: '#15803d',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '9px 18px',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: isUpdating ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isUpdating ? 0.7 : 1,
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              <span>{isUpdating ? 'Marking Delivered...' : 'Mark as Delivered'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </DentzyCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <TwentyFirstBottomNav
        items={mobileNavItems}
        activeKey={activeTab}
        onChange={setActiveTab}
        layoutId="delivery-bottom-nav"
      />
    </div>
  );
}
