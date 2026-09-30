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
import { PipelineSteps } from '../../../components/common/ProductionPipeline';
import OrderDetailModal from '../../../components/OrderDetailModal';
import { Skeleton, SkeletonGroup } from '../../../components/Skeleton';
import { formatDate } from '../../../utils/format';
import { PIPELINE_STAGES } from '../../../components/dashboard/shared/constants';
import './PipelinePage.css';

const dentzyLogo = '/dentzy-logo-v2.png';

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

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter]             = useState('active');

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
    }
    setLoading(false);
  }, [authFetch, DASH_URL]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // SSE for real-time updates
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;

  useEffect(() => {
    if (!user) return;
    let es = null;
    let retryTimeout;
    let retryCount = 0;
    let stopped = false;

    const connect = () => {
      if (stopped || retryCount >= 3) return;
      try {
        es = new EventSource(`${DASH_URL}/events`, { withCredentials: true });
        es.addEventListener('connected', () => { retryCount = 0; });
        const refresh = () => fetchOrdersRef.current?.();
        ['new-order', 'order-stage-updated', 'order-deleted'].forEach(evt =>
          es.addEventListener(evt, refresh)
        );
        es.onerror = () => {
          if (es) { es.close(); es = null; }
          if (!stopped && retryCount < 3) {
            retryCount += 1;
            retryTimeout = setTimeout(connect, 10000);
          }
        };
      } catch {}
    };
    connect();
    return () => {
      stopped = true;
      if (es) es.close();
      clearTimeout(retryTimeout);
    };
  }, [user, DASH_URL]);

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

  if (authLoading || !user) {
    return (
      <div className="plp-loading-screen">
        <div className="plp-spinner" />
      </div>
    );
  }

  return (
    <div className="plp-viewport">
      {/* ── Dentzy Top Header (matches clinical dashboard) ───────── */}
      <header className="plp-top-header">
        <div className="plp-top-header-left">
          <Link href="/dashboard" className="plp-header-logo">
            <img src={dentzyLogo} alt="Dentzy" className="plp-logo-img" />
          </Link>
          <nav className="plp-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard" className="plp-breadcrumb-link">Dashboard</Link>
            <span className="plp-breadcrumb-sep">/</span>
            <span className="plp-breadcrumb-current">Production Pipelines</span>
          </nav>
        </div>
        <div className="plp-top-header-right">
          <div className="plp-header-user" onClick={() => router.push('/dashboard')} role="button" tabIndex={0}>
            <span className="plp-header-user-name">{userName}</span>
            <div className="plp-header-avatar">{initials}</div>
          </div>
        </div>
      </header>

      {/* ── Content container ───────────────────────────────────── */}
      <div className="plp-container">
        {/* Page header with title & active count */}
        <div className="plp-page-header">
          <Link href="/dashboard" className="plp-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
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
        {loading ? (
          <SkeletonGroup>
            <div className="plp-list">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="plp-card plp-card--skeleton">
                  <div className="plp-card-top">
                    <Skeleton width="140px" height="16px" />
                    <Skeleton width="80px" height="22px" borderRadius="99px" />
                  </div>
                  <div className="plp-card-body">
                    <div className="plp-card-info">
                      <Skeleton width="60%" height="14px" style={{ marginBottom: 6 }} />
                      <Skeleton width="40%" height="12px" />
                    </div>
                    <div className="plp-card-pipeline">
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(j => (
                          <Skeleton key={j} width="36px" height="36px" borderRadius="50%" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SkeletonGroup>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="plp-empty">
            <div className="plp-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6l3 7H6L9 2zM5 9h14v13a2 2 0 01-2 2H7a2 2 0 01-2-2V9z" />
              </svg>
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
                      <span className={`plp-stage-badge plp-stage-badge--${stageKey}`}>
                        {isComplete ? 'Completed' : isCancelled ? 'Cancelled' : stageLabel}
                      </span>
                      <span className="plp-view-detail">
                        View Details
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
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
