'use client';
/**
 * PipelinePage — Dedicated page showing all current and past production pipelines.
 * Dentists with 10+ active orders can see every pipeline at a glance,
 * and click any card to open the full order detail modal.
 *
 * Redesigned to match the normal dentist dashboard:
 *   - Full-bleed viewport background (no white side gutters)
 *   - Dentzy header bar with logo, breadcrumbs, and user avatar
 *   - Full-width horizontal pipeline cards (no square grid)
 *
 * Responsive: works on both desktop and mobile without separate components.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useMaintenance } from '../../../context/MaintenanceContext';
import MaintenanceScreen from '../../../components/MaintenanceScreen';
import PortalNavbar from '../../../components/common/PortalNavbar';
import { PipelineSteps } from '../../../components/common/ProductionPipeline';
import { DentzyStatusPill } from '../../../components/common/DentzyCard';
import OrderDetailModal from '../../../components/OrderDetailModal';
import { PipelinePageSkeleton, PipelineListSkeleton } from '../../../components/SkeletonBlocks';
import { formatDate, formatDoctorName } from '../../../utils/format';
import { PIPELINE_STAGES } from '../../../components/dashboard/shared/constants';
import { Ico } from '../../../components/common/DashboardIcons';
import useDashboardUrlState from '../../../hooks/useDashboardUrlState';
import './PipelinePage.css';

/* ── Stage label for the badge ─────────────────────────────────────── */
const STAGE_DISPLAY = {
  received:   'Received',
  design:     'CAD Design',
  production: 'Milling',
  qc:         'QC Check',
  dispatched: 'Dispatched',
  completed:  'Completed',
};

/* ── Filter tabs ───────────────────────────────────────────────────── */
const FILTERS = [
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All Orders' },
];

export default function PipelinePage() {
  const router = useRouter();
  const { user, loading: authLoading, authFetch, DASH_URL } = useAuth();
  const { isDentistBlocked } = useMaintenance();

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter]             = useDashboardUrlState('tab', 'active');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${DASH_URL}/orders?limit=200`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders || []);
      } else {
        setError('Failed to load orders');
      }
    } catch {
      setError('Network error while loading orders');
    } finally {
      setLoading(false);
    }
  }, [authFetch, DASH_URL]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // SSE for real-time updates
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;

  // Refresh pipeline orders on window focus
  useEffect(() => {
    if (!user) return;
    const onFocus = () => fetchOrdersRef.current?.();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  // Filter logic
  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status !== 'Completed' && o.status !== 'Cancelled';
    if (filter === 'completed') return o.status === 'Completed';
    return true; // 'all'
  });

  // Counts for filter badges
  const activeCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;

  // User info for the header
  const userName = user?.name || user?.clinicName || 'Doctor';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (isDentistBlocked) {
    return <MaintenanceScreen role="dentist" />;
  }

  if (authLoading || !user) {
    return <PipelinePageSkeleton />;
  }

  return (
    <div className="plp-viewport">
      {/* ── Dentzy Top Header (canonical shared PortalNavbar) ─────── */}
      <PortalNavbar
        portalTitle="Production Pipelines"
        logoHref="/dashboard"
        centerContent={
          <nav className="plp-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard" className="plp-breadcrumb-link">Dashboard</Link>
            <span className="plp-breadcrumb-sep">/</span>
            <span className="plp-breadcrumb-current">Production Pipelines</span>
          </nav>
        }
        user={{
          name: formatDoctorName(userName),
          role: 'Dentist Portal',
          avatar: initials,
          onProfileClick: () => router.push('/dashboard?tab=profile'),
        }}
      />

      {/* ── Content container ───────────────────────────────────── */}
      <div className="plp-container">
        {/* Page header with title & active count */}
        <div className="plp-page-header">
          <Link href="/dashboard" className="plp-back-btn">
            {Ico.arrowLeft(16, 2.5)}
            Back to Dashboard
          </Link>
          <div className="plp-title-row">
            <div>
              <h1 className="plp-title">Production Pipelines</h1>
              <p className="plp-subtitle">
                Track every lab case from order to dispatch
              </p>
            </div>
            {activeCount > 0 && (
              <span className="plp-active-pill">
                <span className="plp-pulse-dot" />
                {activeCount} Active
              </span>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="plp-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`plp-filter-tab ${filter === f.key ? 'plp-filter-tab--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="plp-filter-count">
                {f.key === 'active' ? activeCount : f.key === 'completed' ? completedCount : orders.length}
              </span>
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="plp-error">
            <span>{error}</span>
            <button onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {/* Loading state */}
        {loading && orders.length === 0 ? (
          <PipelineListSkeleton />
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="plp-empty">
            <div className="plp-empty-icon">
              {Ico.labOrder(44, 1.3)}
            </div>
            <p className="plp-empty-title">
              {filter === 'active' ? 'No active pipelines' : filter === 'completed' ? 'No completed orders yet' : 'No orders found'}
            </p>
            <p className="plp-empty-sub">
              {filter === 'active'
                ? 'All your lab cases have been completed or cancelled.'
                : 'Orders will appear here once they are created.'}
            </p>
          </div>
        ) : (
          /* Pipeline cards — full-width horizontal list */
          <div className="plp-list">
            {filtered.map(order => {
              const stageKey = order.stage || 'received';
              const stageLabel = STAGE_DISPLAY[stageKey] || stageKey;
              const isComplete = order.status === 'Completed';
              const isCancelled = order.status === 'Cancelled';

              return (
                <div
                  key={order._id}
                  className={`plp-card ${isComplete ? 'plp-card--completed' : ''} ${isCancelled ? 'plp-card--cancelled' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                >
                  {/* Card top row: case ID, patient, stage badge, view details */}
                  <div className="plp-card-top">
                    <div className="plp-card-header">
                      <div className="plp-card-id">{order.caseId}</div>
                      <div className="plp-card-patient">{order.patientName}</div>
                      <div className="plp-card-meta">
                        {order.serviceType && <span>{order.serviceType}</span>}
                        {order.dueDate && (
                          <>
                            <span className="plp-meta-dot">&bull;</span>
                            <span>Due {formatDate(order.dueDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="plp-card-actions">
                      <DentzyStatusPill
                        type="workflow"
                        status={isComplete ? 'Completed' : isCancelled ? 'Cancelled' : stageKey}
                        label={isComplete ? 'Completed' : isCancelled ? 'Cancelled' : stageLabel}
                      />
                      <span className="plp-view-detail">
                        View Details
                        {Ico.arrowRight(12, 2.5)}
                      </span>
                    </div>
                  </div>

                  {/* Card body: full-width pipeline steps */}
                  <div className="plp-card-pipeline">
                    <PipelineSteps order={order} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
