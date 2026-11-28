'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import StaffNoticeBar from '../../components/common/StaffNoticeBar';
import StaffSettingsView from './StaffSettingsView';
import { Skeleton } from '../../components/Skeleton';
import { TaskCardSkeleton } from '../../components/SkeletonBlocks';
import { DentzyCard, DentzyCaseChip, DentzyStatusPill } from '../../components/common/DentzyCard';
import { DentzyPipelineChart } from '../../components/common/DentzyChartTable';
import DentzySearchBar from '../../components/common/DentzySearchBar';
import PortalNavbar from '../../components/common/PortalNavbar';
import PortalSidebar from '../../components/common/PortalSidebar';
import { parseTeeth } from '../../utils/teeth';
import { formatDate, formatDoctorName } from '../../utils/format';
import '../StaffDashboard.css';

const TECHNICIAN_STAGES = [
  { key: 'received', label: 'Received', color: '#64748b' },
  { key: 'design', label: 'Design', color: '#2d5a45' },
  { key: 'production', label: 'Production', color: '#1d4ed8' },
  { key: 'qc', label: 'QC', color: '#16a34a' },
];

/**
 * ProductionStaffView — Lean technician task engine shared across all 6 production designations:
 * Acrylic, Ceramic, CAD/CAM, Milling, Sintering, 3D Printing.
 *
 * @param {object} props
 * @param {string} props.departmentName - e.g. "Ceramic", "Acrylic", "CAD/CAM"
 * @param {string} props.title - e.g. "Ceramic Section", "Acrylic Section"
 */
export default function ProductionStaffView({ departmentName = 'Production', title }) {
  const displayTitle = title || `${departmentName} Section`;
  const { authFetch, STAFF_API, staff, staffLogout } = useStaffAuth();
  const { showToast } = useToast();

  const apiBase = STAFF_API || '/api/staff';

  // ── Views: 'pending-tasks' | 'all-tasks' | 'profile' ─────────────────────
  const [activeView, setActiveView] = useState('pending-tasks');
  const [profileResetTick, setProfileResetTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Task lists & Loading ─────────────────────────────────────────────────
  const [pendingTasks, setPendingTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // ── Search & Filter State for All Tasks ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // ── Fetch Pending Tasks (GET /api/staff/orders?taskView=pending) ─────────
  const fetchPendingTasks = useCallback(async () => {
    try {
      const res = await authFetch(`${apiBase}/orders?taskView=pending`);
      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];
        setPendingTasks(orders);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }, [authFetch, apiBase]);

  // ── Fetch All Tasks (GET /api/staff/orders?taskView=all) ───────────────────
  const fetchAllTasks = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await authFetch(`${apiBase}/orders?taskView=all`);
      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];
        setAllTasks(orders);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAll(false);
    }
  }, [authFetch, apiBase]);

  // Initial load
  useEffect(() => {
    fetchPendingTasks();
  }, [fetchPendingTasks]);

  // Load all tasks when navigating to 'all-tasks'
  useEffect(() => {
    if (activeView === 'all-tasks') {
      fetchAllTasks();
    }
  }, [activeView, fetchAllTasks]);

  // Live pending count
  const pendingCount = pendingTasks.length;

  // ── Advance Stage Handler ────────────────────────────────────────────────
  const handleStageUpdate = async (orderId, targetStage) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);

    try {
      const res = await authFetch(`${apiBase}/orders/${orderId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: targetStage }),
      });
      const data = await res.json();

      if (res.ok) {
        if (targetStage === 'qc') {
          showToast(data.message || 'Stage advanced to QC. Delivery task auto-queued.', 'success');
        } else {
          showToast(data.message || `Stage updated to "${targetStage}".`, 'success');
        }

        // Optimistically update local states
        setPendingTasks((prev) =>
          targetStage === 'qc' || targetStage === 'completed'
            ? prev.filter((o) => (o.id || o._id) !== orderId)
            : prev.map((o) => ((o.id || o._id) === orderId ? { ...o, stage: targetStage } : o))
        );

        setAllTasks((prev) =>
          prev.map((o) => ((o.id || o._id) === orderId ? { ...o, stage: targetStage } : o))
        );

        // Background refetch for full DB synchronization
        fetchPendingTasks();
        if (activeView === 'all-tasks') fetchAllTasks();
      } else {
        showToast(data.message || 'Failed to update stage.', 'error');
      }
    } catch {
      showToast('Network error while updating stage.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── Filtered All Tasks ───────────────────────────────────────────────────
  const filteredAllTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTasks.filter((order) => {
      // Stage filter
      if (stageFilter !== 'all' && (order.stage || '').toLowerCase() !== stageFilter.toLowerCase()) {
        return false;
      }
      // Search query filter
      if (!q) return true;
      const caseId = (order.caseId || '').toLowerCase();
      const patient = (order.patientName || '').toLowerCase();
      const dentist = (order.dentistName || order.owner?.name || '').toLowerCase();
      const clinic = (order.clinicName || order.owner?.clinicName || '').toLowerCase();
      const service = (order.serviceType || order.service_category || '').toLowerCase();
      const notes = (order.notes || '').toLowerCase();

      return (
        caseId.includes(q) ||
        patient.includes(q) ||
        dentist.includes(q) ||
        clinic.includes(q) ||
        service.includes(q) ||
        notes.includes(q)
      );
    });
  }, [allTasks, searchQuery, stageFilter]);

  // ── Bottom Nav Config ─────────────────────────────────────────────────────
  const bottomNavItems = useMemo(
    () => [
      {
        key: 'pending-tasks',
        label: 'Pending Tasks',
        icon: () => Ico.clock(18),
        badge: pendingCount,
      },
      {
        key: 'all-tasks',
        label: 'All Tasks',
        icon: () => Ico.labOrder(18),
      },
      {
        key: 'profile',
        label: 'Profile',
        icon: () => Ico.user(18),
      },
    ],
    [pendingCount]
  );

  // ── Render Stage Stepper ──────────────────────────────────────────────────
  const renderStageStepper = (order) => {
    const orderId = order.id || order._id;
    const currentIdx = TECHNICIAN_STAGES.findIndex((s) => s.key === order.stage);
    const isDoneBeyond = currentIdx === -1 && (order.stage === 'dispatched' || order.stage === 'completed');
    const isUpdating = updatingOrderId === orderId;

    // Determine next logical stage
    let nextStage = null;
    let nextLabel = '';
    if (order.stage === 'received') {
      nextStage = 'design';
      nextLabel = 'Advance to Design';
    } else if (order.stage === 'design') {
      nextStage = 'production';
      nextLabel = 'Advance to Production';
    } else if (order.stage === 'production') {
      nextStage = 'qc';
      nextLabel = 'Pass QC & Queue Delivery';
    }

    return (
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f3' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#708c80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Production Stage
          </span>
          {nextStage && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStageUpdate(orderId, nextStage)}
              style={{
                background: nextStage === 'qc' ? '#1e5038' : '#eef6f2',
                color: nextStage === 'qc' ? '#ffffff' : '#1e5038',
                border: nextStage === 'qc' ? 'none' : '1px solid #c8ded4',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {isUpdating ? 'Updating...' : nextLabel}
            </button>
          )}
        </div>

        {/* 4-step Stepper */}
        <DentzyPipelineChart
          stage={order.stage}
          completed={isDoneBeyond}
          stages={TECHNICIAN_STAGES}
          onStepClick={(stageKey) => handleStageUpdate(orderId, stageKey)}
          disabled={isUpdating}
        />
      </div>
    );
  };

  // ── Render Task Card ──────────────────────────────────────────────────────
  const renderTaskCard = (order) => {
    const orderId = order.id || order._id;
    const teeth = parseTeeth(order);
    const dueDate = formatDate(order.dueDate, null);
    const priority = order.priority || 'Normal';
    const isUrgent = ['urgent', 'rush', 'high'].includes(priority.toLowerCase());

    const dentist = formatDoctorName(order.dentistName || order.owner?.name, 'Practicing Dentist');
    const clinic = order.clinicName || order.owner?.clinicName || 'Dental Clinic';

    return (
      <DentzyCard
        key={orderId}
        className="sd-order-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Top Header: Case ID, Priority, Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DentzyCaseChip caseId={order.caseId || (orderId ? orderId.slice(0, 8) : 'CAS-—')} />

            {/* Priority Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                background: isUrgent ? '#fef2f2' : '#f1f5f9',
                color: isUrgent ? '#dc2626' : '#475569',
                border: isUrgent ? '1px solid #fecaca' : '1px solid #e2e8f0',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isUrgent ? '#dc2626' : '#94a3b8',
                }}
              />
              {priority}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {dueDate && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                Due {dueDate}
              </span>
            )}
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                background: order.stage === 'qc' ? '#dcfce7' : '#eef6f2',
                color: order.stage === 'qc' ? '#15803d' : '#1e5038',
              }}
            >
              {order.status || (order.stage ? order.stage.toUpperCase() : 'IN PROGRESS')}
            </span>
          </div>
        </div>

        {/* Patient Name & Clinic / Dentist */}
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3028', lineHeight: 1.3 }}>
            {order.patientName || 'Unknown Patient'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {Ico.usersS ? Ico.usersS(13) : null}
              <strong>{dentist}</strong>
            </span>
            <span>•</span>
            <span style={{ color: '#708c80' }}>{clinic}</span>
          </div>
        </div>

        {/* Clinical Metadata: Service Type, Teeth Badges, Shade */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          {/* Service */}
          <span
            style={{
              background: '#f8faf9',
              color: '#1a3028',
              border: '1px solid #e0eae4',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            {order.serviceType || order.service_category || 'Dental Restoration'}
          </span>

          {/* Shade */}
          {order.shade && (
            <span
              style={{
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              Shade: {order.shade}
            </span>
          )}

          {/* Teeth Badges */}
          {teeth.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {teeth.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#eef6f2',
                    color: '#1e5038',
                    border: '1px solid #cbe3d6',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Notes */}
        {order.notes && (
          <div
            style={{
              background: 'var(--dz-color-surface-subtle)',
              border: '1px solid var(--dz-color-border-mint)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--dz-color-text-secondary)',
              lineHeight: 1.4,
              marginTop: '2px',
            }}
          >
            <span style={{ fontWeight: 600, color: '#1e5038', marginRight: '6px' }}>Instructions:</span>
            {order.notes}
          </div>
        )}

        {/* Stage Stepper */}
        {renderStageStepper(order)}
      </DentzyCard>
    );
  };

  const productionNavItems = useMemo(
    () => [
      {
        key: 'pending-tasks',
        label: 'Pending Tasks',
        icon: (size) => Ico.clock(size || 16),
        badge: !loadingPending && pendingCount > 0 ? pendingCount : undefined,
        onClick: () => setActiveView('pending-tasks'),
      },
      {
        key: 'all-tasks',
        label: 'All Tasks',
        icon: (size) => Ico.labOrder(size || 16),
        onClick: () => setActiveView('all-tasks'),
      },
      {
        key: 'profile',
        label: 'Profile',
        icon: (size) => Ico.user(size || 16),
        onClick: () => {
          setActiveView('profile');
          setProfileResetTick((t) => t + 1);
        },
      },
    ],
    [loadingPending, pendingCount]
  );

  const staffUser = {
    name: staff?.displayName || `${departmentName} Staff`,
    role: `${departmentName} Technician`,
    avatar: staff?.displayName ? staff.displayName.charAt(0).toUpperCase() : departmentName.charAt(0),
    onProfileClick: () => {
      setActiveView('profile');
      setProfileResetTick((t) => t + 1);
    },
    title: 'My Profile',
  };

  return (
    <div className="sd-shell dz-min-vh" style={{ background: '#f4f6f5', paddingBottom: '90px' }}>
      
      {/* ── Unified Top Navbar ────────────────────────────────────────── */}
      <PortalNavbar
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        sidebarOpen={sidebarOpen}
        portalTitle={displayTitle}
        portalBadge={`${departmentName} Lab`}
        user={staffUser}
        onLogout={staffLogout}
      />

      {/* ── Unified Sidebar ───────────────────────────────────────────── */}
      <PortalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={productionNavItems}
        activeKey={activeView}
        user={staffUser}
        onLogout={staffLogout}
        logoutId="production-logout-btn"
      />

      {/* ── Notice Bar ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 16px 0 16px' }}>
        <StaffNoticeBar authFetch={authFetch} />
      </div>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        
        {/* VIEW 1: Pending Tasks */}
        {activeView === 'pending-tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
                  Pending Technician Tasks
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Orders requiring production work in {departmentName}. Advance to QC when finished to dispatch.
                </p>
              </div>
              {loadingPending ? (
                <Skeleton width="86px" height="18px" borderRadius="4px" />
              ) : (
                <span
                  style={{
                    background: '#eef6f2',
                    color: '#1e5038',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {pendingCount} Active {pendingCount === 1 ? 'Task' : 'Tasks'}
                </span>
              )}
            </div>

            {loadingPending ? (
              <TaskCardSkeleton count={4} />
            ) : pendingTasks.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #eef2f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ color: '#708c80', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                  {Ico.checkCircle ? Ico.checkCircle(44) : Ico.check(44)}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
                  Queue Clear!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0 auto' }}>
                  No pending tasks in the {departmentName} queue. All production orders are up to date.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '16px',
                }}
              >
                {pendingTasks.map(renderTaskCard)}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: All Tasks */}
        {activeView === 'all-tasks' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
                All Department Tasks
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Complete archive of orders routed to {departmentName}.
              </p>
            </div>

            {/* Search & Filter Bar */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #eef2f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Search input */}
              <DentzySearchBar
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search by Case ID, patient, dentist, clinic, or notes..."
                style={{ height: '40px' }}
              />

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#708c80', marginRight: '4px' }}>
                  Stage:
                </span>
                {['all', 'received', 'design', 'production', 'qc', 'dispatched', 'completed'].map((stageKey) => {
                  const isSelected = stageFilter === stageKey;
                  return (
                    <button
                      key={stageKey}
                      type="button"
                      onClick={() => setStageFilter(stageKey)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        background: isSelected ? '#1e5038' : '#eef2f0',
                        color: isSelected ? '#ffffff' : '#475569',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {stageKey === 'all' ? 'All Stages' : stageKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingAll ? (
              <TaskCardSkeleton count={4} />
            ) : filteredAllTasks.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #eef2f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ color: '#708c80', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                  {Ico.labOrder(40)}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
                  No Tasks Found
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                  {searchQuery || stageFilter !== 'all'
                    ? 'Try adjusting your search query or stage filters.'
                    : `No tasks have been assigned to ${departmentName} yet.`}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '16px',
                }}
              >
                {filteredAllTasks.map(renderTaskCard)}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Profile */}
        {activeView === 'profile' && <StaffSettingsView resetTick={profileResetTick} />}

      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <TwentyFirstBottomNav
        items={bottomNavItems}
        activeKey={activeView}
        onChange={(key) => {
          setActiveView(key);
          if (key === 'profile') setProfileResetTick((t) => t + 1);
        }}
      />

    </div>
  );
}
