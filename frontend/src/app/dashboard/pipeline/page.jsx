'use client';
/**
 * PipelinePage — Dedicated page showing all current and past production pipelines.
 * Dentists with 10+ active orders can see every pipeline at a glance,
 * and click any card to open the full order detail modal.
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

  if (authLoading || !user) {
    return (
      <div className="plp-loading-screen">
        <div className="plp-spinner" />
      </div>
    );
  }

  return (
    <div className="plp-page">
      {/* Header */}
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
          <div className="plp-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="plp-card plp-card--skeleton">
                <Skeleton width="60%" height="16px" style={{ marginBottom: 10 }} />
                <Skeleton width="80%" height="12px" style={{ marginBottom: 18 }} />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(j => (
                    <Skeleton key={j} width="36px" height="36px" borderRadius="50%" />
                  ))}
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
        /* Pipeline cards grid */
        <div className="plp-grid">
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
                {/* Card header */}
                <div className="plp-card-header">
                  <div className="plp-card-id">{order.caseId}</div>
                  <span className={`plp-stage-badge plp-stage-badge--${stageKey}`}>
                    {isComplete ? 'Completed' : isCancelled ? 'Cancelled' : stageLabel}
                  </span>
                </div>

                {/* Patient info */}
                <div className="plp-card-info">
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

                {/* Pipeline steps */}
                <div className="plp-card-pipeline">
                  <PipelineSteps order={order} />
                </div>

                {/* Click hint */}
                <div className="plp-card-footer">
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
            );
          })}
        </div>
      )}

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
