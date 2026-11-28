'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './DentistDashboard.css';
import { formatINR, formatDate, formatDoctorName } from '../utils/format';
import { getOrderPrice } from '../utils/pricing';
import { safeShowPicker, openInvoiceWindow } from '../utils/appleCompat';
import OrderDetailModal from './OrderDetailModal';
import PaymentDetailModal from './PaymentDetailModal';
import useDashboardUrlState from '../hooks/useDashboardUrlState';
import EmptyState from './common/EmptyState';
import ProductionPipeline from './common/ProductionPipeline';
import CompletedOrdersView from './dashboard/CompletedOrdersView';
import DentistProfileView from './dashboard/DentistProfileView';
const dentzyLogo = '/dentzy-logo-v2.png';

/* =============================================================================
   SVG ICON LIBRARY — shared across desktop & mobile dashboards
============================================================================= */
import { Icon, Icons } from './common/DashboardIcons';
import { TICKER_MESSAGES } from './dashboard/shared/constants';
import TwentyFirstNoticeBar from './ui/twentyfirst-notice-bar';
import DentistWelcomeBanner from './common/DentistWelcomeBanner';
import TwentyFirstIconButton from './ui/twentyfirst-icon-button';
import { triggerBirthdayConfettiOnce } from '../utils/birthdayConfetti';
import { DentzyCaseChip, DentzyStatusPill } from './common/DentzyCard';
import { DentzyDataTable } from './common/DentzyChartTable';
import DentzySearchBar from './common/DentzySearchBar';
import PortalNavbar from './common/PortalNavbar';
import PortalSidebar from './common/PortalSidebar';
import {
  RecentOrdersSkeleton,
  PipelineCardSkeleton,
  DataTableSkeleton,
  BalanceCardSkeleton,
} from './SkeletonBlocks';

/* =============================================================================
   NAV ITEMS
============================================================================= */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',  icon: Icons.dashboard },
  { key: 'orders',    label: 'Lab Orders', icon: Icons.labOrder },
  { key: 'payments',  label: 'Payments',   icon: Icons.payments },
  { key: 'profile',   label: 'Profile',    icon: Icons.user },
];

/* =============================================================================
   TICKER BANNER  (GATE 2027-inspired rolling announcements)
============================================================================= */
/* Ticker messages imported from dashboard/shared/constants.js */

const TickerBanner = () => (
  <div className="ud-ticker-wrap" aria-label="Lab announcements">
    <span className="ud-ticker-label">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Notice
    </span>
    <div className="ud-ticker-viewport">
      <div className="ud-ticker-track">
        {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((msg, i) => (
          <span key={i} className="ud-ticker-item">
            <span className="ud-ticker-sep">&#8226;</span> {msg}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* Pipeline component now imported from common/ProductionPipeline */

import { StatusBadge } from './ui/status-badge';



/* =============================================================================
   MAIN COMPONENT
============================================================================= */
const DentistDashboard = () => {
  const router = useRouter();
  const { user, logout, authFetch, DASH_URL } = useAuth();

  const [activeTab, setActiveTab] = useDashboardUrlState('tab', 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const [stats, setStats]             = useState(null);
  const [orders, setOrders]           = useState([]);
  const [payments, setPayments]       = useState([]);
  const [ordersLoading, setOrdersLoading]     = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statsLoaded, setStatsLoaded]         = useState(false);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Notice bar state
  const [noticeData, setNoticeData] = useState({ enabled: true, messages: TICKER_MESSAGES });

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch(`${DASH_URL}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
    finally {
      setStatsLoaded(true);
    }
  }, [authFetch, DASH_URL]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`${DASH_URL}/orders?limit=50${q}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
    } catch {}
    finally {
      setOrdersLoading(false);
    }
  }, [authFetch, DASH_URL, search]);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res = await authFetch(`${DASH_URL}/payments?limit=50`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } catch {}
    finally {
      setPaymentsLoading(false);
    }
  }, [authFetch, DASH_URL]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  // Fetch notice bar config on mount and on window focus
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
  const userName  = user?.name || 'Doctor';
  const initials  = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* #22 — Keyboard shortcuts for power users */
  const [showShortcuts, setShowShortcuts] = useState(false);
  useEffect(() => {
    const handleShortcut = (e) => {
      // Don't fire when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'n': setActiveTab('orders'); break;
        case 'p': setActiveTab('profile'); break;
        case 's': setActiveTab('settings'); break;
        case '?': setShowShortcuts(prev => !prev); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  /* ============================================================
     RENDER: Dashboard Overview  (GATE 2027-inspired layout)
  ============================================================ */
  const renderDashboard = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
      <div className="ud-content-inner">

        {/* Announcement Ticker */}
        {noticeData.enabled && noticeData.messages.length > 0 && (
          <TwentyFirstNoticeBar
            messages={noticeData.messages}
            label={noticeData.isBirthday ? '🎂 Birthday' : 'Notice'}
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

        {/* Greeting Row */}
        <div className="ud-dash-top">
          <div>
            <h2 className="ud-greeting">Hello, {formatDoctorName(userName)}</h2>
            <p className="ud-greet-sub">Here's your clinical practice overview.</p>
          </div>
          <span className="ud-date-pill">{today}</span>
        </div>

        {/* Stat Cards */}
        {stats ? (
          <div className="ud-stats-grid">
            <div
              className="ud-stat-card ud-stat-card--green ud-stat-card--clickable"
              title="Total lab orders submitted — click to view all orders"
              onClick={() => setActiveTab('orders')}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('orders'); } }}
            >
              <div className="ud-stat-icon-wrap ud-icon-blue">{Icons.orders(22)}</div>
              <div className="ud-stat-info">
                <span className="ud-stat-num">{stats.orders.total}</span>
                <span className="ud-stat-lbl">Total Orders</span>
              </div>
              <div className="ud-stat-breakdown">
                <span className="tag-pending">{stats.orders.pending} Pending</span>
                <span className="tag-progress">{stats.orders.inProgress} Active</span>
              </div>
            </div>

            <div
              className="ud-stat-card ud-stat-card--emerald ud-stat-card--clickable"
              title="Cases that have passed QC and been dispatched — click to view completed cases"
              onClick={() => setActiveTab('completed-orders')}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('completed-orders'); } }}
            >
              <div className="ud-stat-icon-wrap ud-icon-green">{Icons.checkCircle(22)}</div>
              <div className="ud-stat-info">
                <span className="ud-stat-num">{stats.orders.completed}</span>
                <span className="ud-stat-lbl">Completed</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="ud-stats-skeleton">
            {[1, 2].map(i => <div key={i} className="ud-skeleton-card" />)}
          </div>
        )}

        {/* Production Pipeline Timeline */}
        {!statsLoaded ? (
          <PipelineCardSkeleton />
        ) : stats ? (
          <ProductionPipeline stats={stats} orders={orders} onViewOrders={() => setActiveTab('orders')} />
        ) : null}

        {/* Credit Limit Warning */}
        {stats?.payments?.totalUnpaid >= 200000 && (
          <div className="ud-credit-warning" role="alert" style={{ marginTop: '24px', marginBottom: '28px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong>Credit limit reached:</strong> Your outstanding balance has crossed the {formatINR(200000)} credit limit.
              New orders may be held until dues are cleared.{' '}
              <a className="ud-credit-warning__link" href="tel:+919503668112">Contact lab support</a>
            </div>
          </div>
        )}



        {/* Recent Orders — Always displayed for everyone */}
        <div className="ud-recent-cases">
          <div className="ud-recent-cases-header">
            <span className="ud-section-title">Recent Orders</span>
            {orders.length > 0 && (
              <button onClick={() => setActiveTab('orders')} className="ud-view-all-link">View All →</button>
            )}
          </div>
          {ordersLoading && orders.length === 0 ? (
            <RecentOrdersSkeleton rows={5} variant="pc" />
          ) : orders.length > 0 ? (
            <div className="ud-recent-cases-list">
              {orders.slice(0, 5).map(order => (
                <div key={order._id || order.id} className="ud-recent-case-row" onClick={() => setSelectedOrder(order)}>
                  <div className="ud-recent-case-left">
                    <span className="ud-case-id-mono">{order.caseId}</span>
                    <span className="ud-recent-case-name">{order.patientName}</span>
                  </div>
                  <div className="ud-recent-case-right">
                    <span className="ud-case-tag">{order.serviceType}{order.toothNumber ? ` #${order.toothNumber}` : ''}</span>
                    <StatusBadge status={order.status} size="sm" />
                    <span className="ud-recent-case-chevron">→</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ud-recent-empty" style={{ padding: '24px 16px', textAlign: 'center', background: '#f8faf9', borderRadius: '12px', border: '1px dashed #d5e2da' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: '#6b8a7a' }}>No lab orders submitted yet. Start your first case with Dentzy!</p>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{ background: '#1e5038', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
              >
                + Place First Order
              </button>
            </div>
          )}
        </div>

        {/* Support Bar */}
        <div className="ud-support-bar">
          <div className="ud-support-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.12 12.71a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            <span><strong>Lab Support</strong> &mdash; Mon to Sat, 9 AM &ndash; 6 PM IST</span>
          </div>
          <div className="ud-support-links">
            <a href="tel:+919503668112" className="ud-support-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.12 12.71a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Call
            </a>
            <a href="mailto:support@dentzy.in" className="ud-support-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22 6 12 13 2 6"/>
              </svg>
              Email
            </a>
            <a href="https://wa.me/919503668112" target="_blank" rel="noreferrer" className="ud-support-link ud-support-wa">
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    );
  };

  /* ============================================================
     RENDER: Lab Orders
  ============================================================ */
  /* ============================================================
     RENDER: Lab Orders
  ============================================================ */
  const renderOrders = () => (
    <div className="ud-content-inner">
      <div className="ud-tab-header">
        <h2 className="ud-tab-title">Lab Orders</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <DentzySearchBar
            placeholder="Search patient or case ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
            style={{ width: '260px' }}
          />
        </div>
      </div>

      {ordersLoading && orders.length === 0 ? (
        <DataTableSkeleton
          headers={['Patient Name', 'Case ID', 'Service', 'Amount', 'Priority', 'Due Date', 'Payment', 'Status']}
          rows={6}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          variant="orders"
          message="No lab orders found"
          subtext="Orders placed through your dashboard will appear here."
        />
      ) : (
        <DentzyDataTable
          data={orders}
          onRowClick={(o) => setSelectedOrder(o)}
          columns={[
            { key: 'patientName', header: 'Patient Name', render: (o) => <strong>{o.patientName}</strong> },
            { key: 'caseId', header: 'Case ID', render: (o) => <DentzyCaseChip caseId={o.caseId} /> },
            { key: 'serviceType', header: 'Service' },
            { key: 'amount', header: 'Amount', render: (o) => <span style={{ fontWeight: 700, color: '#1e5038' }}>₹{getOrderPrice(o).toLocaleString('en-IN')}</span> },
            { key: 'priority', header: 'Priority', render: (o) => <span className={`ud-priority ud-priority-${o.priority?.toLowerCase()}`}>{o.priority}</span> },
            { key: 'dueDate', header: 'Due Date', render: (o) => formatDate(o.dueDate) },
            {
              key: 'paymentStatus',
              header: 'Payment',
              render: (o) => (
                <>
                  <DentzyStatusPill status={o.paymentStatus || 'Pending'} type="payment" />
                  {o.batchId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(o.batchId)}`);
                      }}
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        background: '#e8f2ec',
                        border: '1px solid #c2dcd0',
                        color: '#1e5038',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      title="Download consolidated batch invoice"
                    >
                      Batch Invoice
                    </button>
                  )}
                </>
              ),
            },
            { key: 'status', header: 'Status', render: (o) => <DentzyStatusPill status={o.status} type="workflow" /> },
          ]}
        />
      )}
    </div>
  );

  /* ============================================================
     RENDER: Tab Router & Profile
  ============================================================ */
  const [profileResetTick, setProfileResetTick] = useState(0);

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'orders')   return renderOrders();
    if (activeTab === 'completed-orders') return (
      <div className="ud-content-inner">
        <CompletedOrdersView
          orders={orders}
          loading={ordersLoading}
          onSelectOrder={setSelectedOrder}
          onBack={() => setActiveTab('dashboard')}
        />
      </div>
    );
    if (activeTab === 'profile' || activeTab === 'settings') {
      return (
        <div className="ud-content-inner">
          <DentistProfileView
            initialSubView={activeTab === 'settings' ? 'settings' : null}
            resetTick={profileResetTick}
            onLogout={handleLogout}
          />
        </div>
      );
    }
    if (activeTab === 'payments') return <PaymentsTab payments={payments} loading={paymentsLoading} title="Payments & Invoices" onSelectPayment={setSelectedPayment} stats={stats} statsLoaded={statsLoaded} />;
    return null;
  };

  /* ============================================================
     LAYOUT
  ============================================================ */
  const dentistUser = {
    name: formatDoctorName(userName),
    role: user?.clinicName || null,
    avatar: initials,
    onProfileClick: () => {
      setActiveTab('profile');
      setProfileResetTick((t) => t + 1);
    },
    title: 'My Profile',
  };

  return (
    <div className="ud-layout">
      {/* Unified Top Navbar */}
      <PortalNavbar
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        sidebarOpen={sidebarOpen}
        search={{
          placeholder: 'Search patient, case ID...',
          value: search,
          onChange: e => setSearch(e.target.value),
          onClear: () => setSearch(''),
          onKeyDown: e => e.key === 'Enter' && fetchOrders(),
          width: '240px',
        }}
        user={dentistUser}
      />

      <div className="ud-body">
        {/* Unified Sidebar */}
        <PortalSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          items={NAV_ITEMS}
          activeKey={activeTab === 'settings' ? 'profile' : activeTab}
          onSelect={(key) => {
            setActiveTab(key);
            if (key === 'profile') setProfileResetTick((t) => t + 1);
          }}
          user={dentistUser}
          onLogout={handleLogout}
          logoutId="user-logout-btn"
        />

        {/* Main Content */}
        <main className="ud-main">{renderContent()}</main>
      </div>

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

/* =============================================================================
   PAYMENTS TABLE SUB-COMPONENT
============================================================================= */
const PaymentsTab = ({ payments, loading, title, onSelectPayment, stats, statsLoaded }) => {
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const [statementMonth, setStatementMonth] = React.useState(currentMonthISO);

  const totalUnpaid = stats?.payments?.totalUnpaid || 0;
  const unpaidCount = (stats?.payments?.pending || 0) + (stats?.payments?.overdue || 0);
  const creditLimit = 200000;
  const creditUsedPct = Math.min(Math.round((totalUnpaid / creditLimit) * 100), 100);

  // Group batch receipts
  const batchStatements = React.useMemo(() => {
    const map = new Map();
    for (const p of payments) {
      if (p.batchId) {
        if (!map.has(p.batchId)) {
          map.set(p.batchId, {
            batchId: p.batchId,
            count: 0,
            totalAmount: 0,
            paymentMode: p.paymentMode || '',
            referenceNumber: p.referenceNumber || '',
            paidAt: p.paidAt,
          });
        }
        const b = map.get(p.batchId);
        b.count += 1;
        b.totalAmount += Number(p.amount) || 0;
      }
    }
    return Array.from(map.values());
  }, [payments]);

  const handleDownloadUnpaid = () => {
    const query = statementMonth ? `&month=${encodeURIComponent(statementMonth)}` : '';
    openInvoiceWindow(`/invoice?unpaid=true${query}`);
  };

  const handleDownloadBatch = (batchId) => {
    openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(batchId)}`);
  };

  return (
    <div className="ud-content-inner">
      <h2 className="ud-tab-title">{title}</h2>

      {/* Outstanding Bill & Credit Limit Card */}
      {!statsLoaded ? (
        <BalanceCardSkeleton variant="pc" />
      ) : (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2ece6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(30, 80, 56, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#708c80', letterSpacing: '0.05em' }}>
                Outstanding Balance / Amount to Pay
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalUnpaid > 0 ? '#b45309' : '#1e5038', marginTop: '4px' }}>
                ₹{totalUnpaid.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '2px' }}>
                Across {unpaidCount} unpaid {unpaidCount === 1 ? 'order' : 'orders'} pending lab clearance
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="month"
                value={statementMonth}
                placeholder="Select Month"
                data-empty={!statementMonth}
                onClick={safeShowPicker}
                onChange={(e) => setStatementMonth(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d0ded6',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1a3028',
                  background: '#f8faf9',
                  cursor: 'pointer',
                }}
                aria-label="Select Statement Month"
              />
              {statementMonth ? (
                <button
                  type="button"
                  onClick={() => setStatementMonth('')}
                  style={{
                    background: '#f0f4f2',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    color: '#4a7060',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  All Unpaid
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatementMonth(currentMonthISO)}
                  style={{
                    background: '#e8f5ee',
                    border: '1px solid rgba(30, 80, 56, 0.2)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    color: '#1e5038',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  This Month
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadUnpaid}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#1e5038',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Pending Bill
              </button>
            </div>
          </div>

          {/* Credit Limit Usage Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: '#4a7060', marginBottom: '6px' }}>
              <span>Lab Credit Limit Usage ({creditUsedPct}%)</span>
              <span>₹{totalUnpaid.toLocaleString('en-IN')} / ₹{creditLimit.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ height: '8px', background: '#e8f5ee', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${creditUsedPct}%`,
                background: creditUsedPct > 80 ? '#dc2626' : creditUsedPct > 50 ? '#f59e0b' : '#1e5038',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Batch Receipts Section */}
      {batchStatements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a3028', marginBottom: '10px' }}>
            Consolidated Monthly Batch Receipts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {batchStatements.map(b => (
              <div key={b.batchId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8faf9',
                border: '1px solid #e2ece6',
                borderRadius: '8px',
                padding: '12px 16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e5038', fontFamily: 'monospace' }}>
                    {b.batchId}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#555', marginLeft: '12px' }}>
                    {b.count} {b.count === 1 ? 'order' : 'orders'} • Total: <strong>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                    {b.paymentMode && ` • ${b.paymentMode}`}
                    {b.referenceNumber && ` (Ref: ${b.referenceNumber})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadBatch(b.batchId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#ffffff',
                    color: '#1e5038',
                    border: '1px solid #1e5038',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Download Batch Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
        <strong>Accepted Payment Modes:</strong> Direct UPI (to lab mobile number / UPI ID), Cash, or Cheque. No payment gateway required. Once your payment is received, lab administration will verify and mark the order as Paid.
      </div>
      {loading && payments.length === 0 ? (
        <DataTableSkeleton
          headers={['Patient Name', 'Case ID', 'Service', 'Amount', 'Due Date', 'Payment Status', 'Mode & Ref']}
          rows={6}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          variant="payments"
          message="No payment records found"
          subtext="Payment records will appear here once orders are created."
        />
      ) : (
        <DentzyDataTable
          data={payments}
          onRowClick={(p) => onSelectPayment?.(p)}
          columns={[
            { key: 'patientName', header: 'Patient Name', render: (p) => <strong>{p.patientName}</strong> },
            { key: 'caseId', header: 'Case ID', render: (p) => <DentzyCaseChip caseId={p.caseId} /> },
            { key: 'serviceType', header: 'Service', render: (p) => p.serviceType || '—' },
            { key: 'amount', header: 'Amount', render: (p) => <span className="ud-amount">₹{getOrderPrice(p).toLocaleString('en-IN')}</span> },
            { key: 'dueDate', header: 'Due Date', render: (p) => formatDate(p.dueDate) },
            { key: 'paymentStatus', header: 'Payment Status', render: (p) => <DentzyStatusPill status={p.paymentStatus || 'Pending'} type="payment" /> },
            {
              key: 'modeRef',
              header: 'Mode & Ref',
              render: (p) =>
                p.paymentStatus === 'Paid' && p.paymentMode ? (
                  <span style={{ fontSize: '0.78rem' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: p.paymentMode === 'Cash' ? '#dcfce7' : p.paymentMode === 'UPI' ? '#fae8ff' : '#dbeafe',
                        color: p.paymentMode === 'Cash' ? '#166534' : p.paymentMode === 'UPI' ? '#7e22ce' : '#1d4ed8',
                      }}
                    >
                      {p.paymentMode}
                    </span>
                    {p.referenceNumber && <span style={{ color: '#708c80', marginLeft: '6px' }}>Ref: {p.referenceNumber}</span>}
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>
                ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default DentistDashboard;
