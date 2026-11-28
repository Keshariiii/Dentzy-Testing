/**
 * MobileDashboard — Full-featured native app-style mobile dashboard.
 * 100% feature parity with UserDashboard.jsx (PC version).
 * No emojis. All features: ticker, pipeline, action hub, resources,
 * support bar, orders with search, payments, full settings,
 * delete account modal.
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonGroup } from '../../components/Skeleton';
import {
  RecentOrdersSkeleton,
  PipelineCardSkeleton,
  BalanceCardSkeleton,
  MobileCompactCardSkeleton,
} from '../../components/SkeletonBlocks';
import MobileHeader from '../../components/mobile/MobileHeader';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import OrderDetailModal from '../../components/OrderDetailModal';
import PaymentDetailModal from '../../components/PaymentDetailModal';
import useDashboardUrlState from '../../hooks/useDashboardUrlState';
import EmptyState from '../../components/common/EmptyState';
import { formatINR, formatDate, formatDoctorName } from '../../utils/format';
import { getOrderPrice } from '../../utils/pricing';
import { openInvoiceWindow } from '../../utils/appleCompat';
import './MobileDashboard.css';
import ProductionPipeline from '../../components/common/ProductionPipeline';
import BalanceCreditCard from '../../components/common/BalanceCreditCard';
import LabSupportBar from '../../components/common/LabSupportBar';
import CompletedOrdersView from '../../components/dashboard/CompletedOrdersView';
import DentistProfileView from '../../components/dashboard/DentistProfileView';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { DentzyKpiRow, DentzyStatusPill } from '../../components/common/DentzyCard';
import DentzySearchBar from '../../components/common/DentzySearchBar';

/* ============================================================
   ICONS — shared across desktop & mobile dashboards
============================================================ */
import { Icon, Icons } from '../../components/common/DashboardIcons';
import { TICKER_MESSAGES } from '../../components/dashboard/shared/constants';
import TwentyFirstNoticeBar from '../../components/ui/twentyfirst-notice-bar';
import DentistWelcomeBanner from '../../components/common/DentistWelcomeBanner';
import { triggerBirthdayConfettiOnce } from '../../utils/birthdayConfetti';

/* ============================================================
   TICKER
============================================================ */
/* Ticker messages imported from dashboard/shared/constants.js */

const Ticker = () => (
  <div className="m-ticker-wrap" aria-label="Lab announcements">
    <span className="m-ticker-label">Notice</span>
    <div className="m-ticker-viewport">
      <div className="m-ticker-track">
        {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
          <span key={i} className="m-ticker-item">
            <span className="m-ticker-sep">&bull;</span> {msg}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* Pipeline component now imported from common/ProductionPipeline */

/* ============================================================
   STATUS PILL
============================================================ */
const StatusPill = ({ status }) => <DentzyStatusPill type="workflow" status={status} />;

const PriorityBadge = ({ priority }) => (
  <DentzyStatusPill type="priority" status={priority || 'Normal'} label={priority || 'Standard'} />
);

/* ============================================================
   TABS CONFIG — feeds TwentyFirstBottomNav
============================================================ */
const DENTIST_NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview',  icon: (active) => Icons.dashboard(active ? 20 : 19) },
  { key: 'orders',    label: 'Orders',    icon: (active) => Icons.labOrder(active ? 20 : 19) },
  { key: 'payments',  label: 'Payments',  icon: (active) => Icons.payments(active ? 20 : 19) },
  { key: 'profile',   label: 'Profile',   icon: (active) => Icons.user(active ? 20 : 19) },
];

/* ============================================================
   MAIN COMPONENT
============================================================ */
const MobileDashboard = () => {
  const router = useRouter();
  const { user, logout, authFetch, DASH_URL } = useAuth();

  const [activeTab, setActiveTab] = useDashboardUrlState('tab', 'dashboard');
  const [profileResetTick, setProfileResetTick] = useState(0);
  const [search,      setSearch]      = useState('');
  const [stats,       setStats]       = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [ordersLoading, setOrdersLoading]     = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statsLoaded, setStatsLoaded]         = useState(false);
  const [error,       setError]       = useState(null);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const [unpaidMonthFilter, setUnpaidMonthFilter] = useState(currentMonthISO);
  // Notice bar state
  const [noticeData, setNoticeData] = useState({ enabled: true, messages: TICKER_MESSAGES });

  const userName = user?.name || 'Doctor';

  const fetchNotice = useCallback(async () => {
    try {
      const res = await authFetch(`${DASH_URL}/notice`);
      if (res.ok) {
        const d = await res.json();
        const isBirthday = Boolean(d.isBirthday);
        setNoticeData({
          enabled: isBirthday ? true : d.enabled !== false,
          isBirthday,
          messages: d.messages?.length ? d.messages : TICKER_MESSAGES,
        });
        if (isBirthday && d.birthdayDate) {
          triggerBirthdayConfettiOnce(user?.id || user?._id || 'dentist', d.birthdayDate);
        }
      }
    } catch { /* fallback to defaults already set */ }
  }, [authFetch, DASH_URL, user?.id, user?._id]);

  useEffect(() => {
    if (user) fetchNotice();
  }, [user, fetchNotice]);

  useEffect(() => {
    const onFocus = () => { if (user) fetchNotice(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, fetchNotice]);

  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${DASH_URL}/stats`);
      if (res.ok) setStats(await res.json());
      else setError('Failed to load stats');
    } catch { setError('Network error while loading stats'); }
    finally {
      setStatsLoaded(true);
    }
  }, [authFetch, DASH_URL]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`${DASH_URL}/orders?limit=50${q}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
      else setError('Failed to load orders');
    } catch { setError('Network error while loading orders'); }
    finally {
      setOrdersLoading(false);
    }
  }, [authFetch, DASH_URL, search]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${DASH_URL}/payments?limit=50`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
      else setError('Failed to load payments');
    } catch { setError('Network error while loading payments'); }
    finally {
      setPaymentsLoading(false);
    }
  }, [authFetch, DASH_URL]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'orders' || activeTab === 'dashboard' || activeTab === 'completed-orders') fetchOrders();
      if (activeTab === 'payments') fetchPayments();
    }
  }, [user, activeTab, fetchOrders, fetchPayments]);

  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Refresh stats and orders on window focus
  useEffect(() => {
    if (!user) return;
    const onFocus = () => {
      fetchStatsRef.current?.();
      fetchOrdersRef.current?.();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  const handleLogout = () => { logout(); router.push('/login'); };

  /* ============================================================
     OVERVIEW TAB
  ============================================================ */
  const renderOverview = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

    const ACTION_ITEMS = [
      { key: 'lab-orders',  icon: Icons.labOrder(20),  title: 'Lab Orders',          desc: 'View and track all active and completed dental lab cases.', cta: 'View Orders',   color: 'green',  onClick: () => setActiveTab('orders') },
      { key: 'payments',    icon: Icons.payments(20),  title: 'Payments & Invoices',  desc: 'Review outstanding balances and full payment history.',        cta: 'View Payments', color: 'teal',   onClick: () => setActiveTab('payments') },
      { key: 'pending',     icon: Icons.clock(20),     title: 'Pending Invoices',     desc: 'Cases awaiting payment — clear dues to avoid delays.',        cta: 'View Pending',  color: 'amber',  onClick: () => setActiveTab('payments') },
      { key: 'support',     icon: Icons.chat(20),      title: 'Lab Support',          desc: 'Reach our clinical team for urgent case queries.',            cta: 'Contact',       color: 'teal',   onClick: () => { const el = document.getElementById('m-support-bar'); el?.scrollIntoView({ behavior: 'smooth' }); } },
      { key: 'profile',     icon: Icons.user(20),      title: 'Profile & Settings',   desc: 'Manage clinic details, password, and account settings.',      cta: 'Open Profile',  color: 'teal',   onClick: () => setActiveTab('profile') },
    ];

    const RESOURCES = [
      { key: 'lab-form',  title: 'Lab Prescription Form',  desc: 'Standard case submission form' },
      { key: 'warranty',  title: 'Warranty Certificate',    desc: 'Dentzy 5-10 years quality guarantee' },
    ];

    return (
      <div className="m-tab-content">
        {noticeData.enabled && noticeData.messages.length > 0 && (
          <TwentyFirstNoticeBar
            messages={noticeData.messages}
            label={noticeData.isBirthday ? 'Birthday' : 'Notice'}
            className="mb-4"
          />
        )}

        {/* Welcome banner for first-time users */}
        {stats && stats.orders.total === 0 && (
          <DentistWelcomeBanner
            userName={userName}
            onNavigateProfile={() => setActiveTab('profile')}
            onNavigateOrders={() => setActiveTab('orders')}
          />
        )}

        {/* Greeting */}
        <div className="m-overview-greeting">
          <div>
            <h2 className="m-dash-hello">Hello, {formatDoctorName(userName)}</h2>
            <p className="m-dash-date">{today}</p>
          </div>
        </div>

        {/* Stat Cards */}
        {error && !stats ? (
          <div className="m-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <TwentyFirstIconButton
              icon={Icons.refresh ? Icons.refresh(16) : null}
              title="Retry"
              ariaLabel="Retry"
              onClick={fetchStats}
              size="md"
              variant="secondary"
            />
          </div>
        ) : stats ? (
          <DentzyKpiRow
            className="m-stats-row"
            items={[
              {
                key: 'total',
                label: 'Total Orders',
                value: stats.orders.total,
                icon: Icons.orders(22),
                title: 'Total lab orders submitted — click to view all orders',
                onClick: () => setActiveTab('orders'),
                tags: [
                  { type: 'payment', status: 'pending', label: `${stats.orders.pending} Pending` },
                  { type: 'workflow', status: 'in-progress', label: `${stats.orders.inProgress} Active` },
                ],
              },
              {
                key: 'completed',
                label: 'Completed',
                value: stats.orders.completed,
                tone: 'success',
                icon: Icons.checkCircle(22),
                title: 'Cases that have passed QC and been dispatched — click to view completed cases',
                onClick: () => setActiveTab('completed-orders'),
                tags: [
                  { type: 'workflow', status: 'completed', label: `${stats.orders.completed} Delivered` },
                ],
              },
            ]}
          />
        ) : (
          <SkeletonGroup>
            <div className="m-stats-row">
              <div className="dz-kpi-card" style={{ padding: '16px' }}>
                <Skeleton width="50%" height="28px" style={{ marginBottom: '10px' }} />
                <Skeleton width="70%" height="12px" style={{ marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Skeleton width="60px" height="20px" borderRadius="20px" />
                  <Skeleton width="60px" height="20px" borderRadius="20px" />
                </div>
              </div>
              <div className="dz-kpi-card" style={{ padding: '16px' }}>
                <Skeleton width="40%" height="28px" style={{ marginBottom: '10px' }} />
                <Skeleton width="60%" height="12px" style={{ marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Skeleton width="60px" height="20px" borderRadius="20px" />
                </div>
              </div>
            </div>
          </SkeletonGroup>
        )}

        {/* Pipeline */}
        {!statsLoaded ? (
          <PipelineCardSkeleton />
        ) : stats ? (
          <ProductionPipeline stats={stats} orders={orders} onViewOrders={() => setActiveTab('orders')} />
        ) : null}

        {/* Credit Limit Warning Banner */}
        {(stats?.payments?.totalUnpaid || 0) >= 200000 && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 16px',
              marginTop: '18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#991b1b',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)',
            }}
            role="alert"
          >
            {Icons.warn(20, 2)}
            <div>
              <strong>Credit limit reached:</strong> Your outstanding balance has crossed the {formatINR(200000)} credit limit. New orders may be held until dues are cleared.{' '}
              <a href="tel:+919503668112" style={{ color: '#7f1d1d', fontWeight: 700, textDecoration: 'underline' }}>Contact lab support</a>
            </div>
          </div>
        )}

        {/* Recent Orders — Always displayed for everyone */}
        <div className="m-recent-cases" style={{ marginTop: '20px' }}>
          <div className="m-recent-cases-header">
            <span className="m-section-h" style={{ marginBottom: 0 }}>Recent Orders</span>
            {orders.length > 0 && (
              <button onClick={() => setActiveTab('orders')} className="m-view-all-btn">View All →</button>
            )}
          </div>
          {ordersLoading && orders.length === 0 ? (
            <RecentOrdersSkeleton rows={5} variant="mobile" />
          ) : orders.length > 0 ? (
            <div className="m-recent-cases-list">
              {orders.slice(0, 5).map(order => (
                <div key={order._id || order.id} className="m-recent-row" onClick={() => setSelectedOrder(order)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 2px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="m-recent-row-top">
                      <span className="m-case-mono">{order.caseId}</span>
                      <DentzyStatusPill type="workflow" status={order.status} />
                    </div>
                    <div className="m-recent-row-bottom" style={{ marginTop: '4px' }}>
                      <span className="m-recent-name">{order.patientName}</span>
                      <span className="m-recent-tag">{order.serviceType}{order.toothNumber ? ` #${order.toothNumber}` : ''}</span>
                    </div>
                  </div>
                  <span style={{ color: '#78937E', marginLeft: '12px', flexShrink: 0 }}>
                    {Icons.chevronRight(15, 2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              variant="orders"
              message="No lab orders submitted yet. Start your first case with Dentzy!"
              action="+ Place First Order"
              onAction={() => setActiveTab('orders')}
            />
          )}
        </div>

        {/* Support Bar */}
        <LabSupportBar variant="mobile" id="m-support-bar" />

        <div className="m-bottom-spacer" />
      </div>
    );
  };

  /* ============================================================
     ORDERS TAB
  ============================================================ */
  const renderOrders = () => (
    <div className="m-tab-content">
      <div className="m-tab-header">
        <h2 className="m-tab-title">Lab Orders</h2>
        <DentzySearchBar
          placeholder="Search patient or case ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          onKeyDown={e => e.key === 'Enter' && fetchOrders()}
          style={{ minHeight: '44px' }}
        />
      </div>

      {error && (
        <div className="m-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <TwentyFirstIconButton
            icon={Icons.refresh ? Icons.refresh(16) : null}
            title="Retry"
            ariaLabel="Retry"
            onClick={fetchOrders}
            size="md"
            variant="secondary"
          />
        </div>
      )}

      {ordersLoading && orders.length === 0 ? (
        <MobileCompactCardSkeleton count={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          variant="orders"
          message="No lab orders found"
          subtext="Orders placed through your portal will appear here."
        />
      ) : (
        <>
          <div className="m-count-label">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
          <div className="m-cards-list" style={{ gap: '9px' }}>
            {orders.map((o) => (
              <div
                key={o._id}
                className="m-compact-card"
                onClick={() => setSelectedOrder(o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(o)}
              >
                <div className="m-compact-card__top">
                  <span className="m-order-id">{o.caseId}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DentzyStatusPill type="payment" status={o.paymentStatus || 'Pending'} />
                    {o.batchId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(o.batchId)}`);
                        }}
                        style={{
                          background: '#e8f2ec',
                          border: '1px solid #c2dcd0',
                          color: '#1e5038',
                          borderRadius: '4px',
                          padding: '2px 5px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Download consolidated batch invoice"
                      >
                        Batch Invoice
                      </button>
                    )}
                    <PriorityBadge priority={o.priority} />
                    <StatusPill status={o.status} />
                  </div>
                </div>
                <div className="m-compact-card__main">
                  <div className="m-compact-card__info">
                    <span className="m-compact-card__title">{o.patientName}</span>
                    <div className="m-compact-card__meta">
                      <span className="m-compact-card__tag">{o.serviceType || 'Standard'}</span>
                      <span>&bull;</span>
                      <span>Due {formatDate(o.dueDate)}</span>
                      <span>&bull;</span>
                      <strong style={{ color: '#1e5038' }}>₹{getOrderPrice(o).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <span className="m-compact-card__arrow">
                    {Icons.chevronRight(16)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="m-bottom-spacer" />
    </div>
  );

  const renderPayments = () => {
    const data = payments;

    const totalUnpaid = stats?.payments?.totalUnpaid || 0;
    const unpaidCount = (stats?.payments?.pending || 0) + (stats?.payments?.overdue || 0);
    const creditLimit = 200000;

    // Batch groups
    const batchMap = new Map();
    data.forEach(p => {
      if (p.batchId && (p.paymentStatus === 'Paid' || p.status === 'Paid')) {
        if (!batchMap.has(p.batchId)) {
          batchMap.set(p.batchId, {
            batchId: p.batchId,
            count: 0,
            totalAmount: 0,
            paymentMode: p.paymentMode || '',
            referenceNumber: p.referenceNumber || '',
            paidAt: p.paidAt || '',
          });
        }
        const g = batchMap.get(p.batchId);
        g.count += 1;
        g.totalAmount += Number(p.amount) || Number(p.paymentAmount) || 0;
      }
    });
    const batchGroups = Array.from(batchMap.values());

    const modeBadge = (mode) => <DentzyStatusPill type="mode" status={mode} />;

    return (
      <div className="m-tab-content">
        <h2 className="m-tab-title">Payments</h2>

        {/* Mobile Outstanding Bill Card */}
        {!statsLoaded ? (
          <BalanceCardSkeleton variant="mobile" />
        ) : (
          <BalanceCreditCard
            totalUnpaid={totalUnpaid}
            unpaidCount={unpaidCount}
            creditLimit={creditLimit}
            monthFilter={unpaidMonthFilter}
            onMonthChange={setUnpaidMonthFilter}
            onDownloadPendingBill={(month) => {
              const url = month ? `/invoice?unpaid=true&month=${encodeURIComponent(month)}` : '/invoice?unpaid=true';
              openInvoiceWindow(url);
            }}
            variant="mobile"
          />
        )}

        {/* Consolidated Monthly Batch Receipts */}
        {batchGroups.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2ece6',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '14px',
            boxShadow: '0 2px 8px rgba(30, 80, 56, 0.04)',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a3028', marginBottom: '10px' }}>
              Consolidated Monthly Batch Receipts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {batchGroups.map(bg => (
                <div
                  key={bg.batchId}
                  style={{
                    padding: '10px 12px',
                    background: '#f8faf9',
                    border: '1px solid #e8f0ec',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#1e5038', background: '#eaf3ee', padding: '2px 6px', borderRadius: '4px' }}>
                      {bg.batchId}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#1a3028' }}>
                      ₹{bg.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#666' }}>
                    {bg.count} {bg.count === 1 ? 'order' : 'orders'}
                    {bg.paymentMode && ` • Mode: ${bg.paymentMode}`}
                    {bg.referenceNumber && ` (Ref: ${bg.referenceNumber})`}
                  </div>
                  <button
                    type="button"
                    onClick={() => openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(bg.batchId)}`)}
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: '1px solid #c2dcd0',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#1e5038',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    {Icons.orders(13, 2.2)}
                    Download Batch Invoice
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
          <strong>Payment Modes:</strong> Direct UPI (mobile / UPI ID), Cash, or Cheque. Status is updated once verified by lab administration.
        </div>
        {error && (
          <div className="m-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <TwentyFirstIconButton
              icon={Icons.refresh ? Icons.refresh(16) : null}
              title="Retry"
              ariaLabel="Retry"
              onClick={fetchPayments}
              size="md"
              variant="secondary"
            />
          </div>
        )}
        {paymentsLoading && data.length === 0 ? (
          <MobileCompactCardSkeleton count={5} />
        ) : data.length === 0 ? (
          <EmptyState
            variant="payments"
            message="No payment records found"
            subtext="Payment records will appear here once orders are created."
          />
        ) : (
          <div className="m-cards-list" style={{ gap: '9px' }}>
            {data.map((p) => {
              const isPaid = p.paymentStatus === 'Paid';
              return (
                <div
                  key={p._id}
                  className="m-compact-card"
                  onClick={() => setSelectedPayment(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedPayment(p)}
                >
                  <div className="m-compact-card__top">
                    <span className="m-order-id">{p.caseId}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.paymentMode && modeBadge(p.paymentMode)}
                      <DentzyStatusPill type="payment" status={p.paymentStatus || 'Pending'} />
                      {p.batchId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(p.batchId)}`);
                          }}
                          style={{
                            background: '#e8f2ec',
                            border: '1px solid #c2dcd0',
                            color: '#1e5038',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Download consolidated batch invoice"
                        >
                          Batch Invoice
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="m-compact-card__main">
                    <div className="m-compact-card__info">
                      <span className="m-compact-card__title">{p.patientName}</span>
                      <div className="m-compact-card__meta">
                        <strong style={{ color: '#1e5038', fontWeight: 700 }}>
                          ₹{getOrderPrice(p).toLocaleString('en-IN')}
                        </strong>
                        <span>&bull;</span>
                        <span className="m-compact-card__tag">{p.serviceType || 'Lab Case'}</span>
                        <span>&bull;</span>
                        <span>{formatDate(p.dueDate || p.createdAt)}</span>
                      </div>
                    </div>
                    <span className="m-compact-card__arrow">
                      {Icons.chevronRight(16)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="m-bottom-spacer" />
      </div>
    );
  };



  /* ============================================================
     TAB ROUTER
  ============================================================ */
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderOverview();
      case 'orders':    return renderOrders();
      case 'completed-orders': return (
        <div className="m-tab-content">
          <CompletedOrdersView
            orders={orders}
            loading={ordersLoading}
            onSelectOrder={setSelectedOrder}
            onBack={() => setActiveTab('dashboard')}
            isMobile={true}
          />
        </div>
      );
      case 'payments':  return renderPayments();
      case 'profile':
      case 'settings':
        return (
          <div className="m-tab-content">
            <DentistProfileView
              initialSubView={activeTab === 'settings' ? 'settings' : null}
              resetTick={profileResetTick}
              onLogout={handleLogout}
              isMobile={true}
            />
          </div>
        );
      default:          return renderOverview();
    }
  };

  /* ============================================================
     LAYOUT
  ============================================================ */
  return (
    <div className="m-app-shell">
      <MobileHeader
        title={null}
        onAvatarClick={() => {
          setActiveTab('profile');
          setProfileResetTick((t) => t + 1);
        }}
      >
        <DentzySearchBar
          className="m-header-search-bar"
          placeholder="Search patient or case ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setActiveTab('orders');
              fetchOrders();
            }
          }}
        />
      </MobileHeader>

      <main className="m-dash-main">
        {renderContent()}
      </main>

      {/* -- 21st.dev: Floating Bottom Navigation -- */}
      <TwentyFirstBottomNav
        items={DENTIST_NAV_ITEMS}
        activeKey={activeTab === 'settings' ? 'profile' : activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === 'profile') setProfileResetTick((t) => t + 1);
        }}
        layoutId="dentist-nav-pill"
        ariaLabel="Dentist portal navigation"
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        isAdmin={false}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        isAdmin={false}
      />
    </div>
  );
};

export default MobileDashboard;