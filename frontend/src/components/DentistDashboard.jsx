'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './DentistDashboard.css';
import { formatINR, formatDate, formatDoctorName } from '../utils/format';
import { getOrderPrice } from '../utils/pricing';
import { openInvoiceWindow } from '../utils/appleCompat';
import OrderDetailModal from './OrderDetailModal';
import PaymentDetailModal from './PaymentDetailModal';
import useDashboardUrlState from '../hooks/useDashboardUrlState';
import EmptyState from './common/EmptyState';
import ProductionPipeline from './common/ProductionPipeline';
import BalanceCreditCard from './common/BalanceCreditCard';
import LabSupportBar from './common/LabSupportBar';
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
import { DentzyCaseChip, DentzyStatusPill, DentzyKpiRow } from './common/DentzyCard';
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
      {Icons.info(11, 2.5)}
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
            label={noticeData.isBirthday ? 'Birthday' : 'Notice'}
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
            <p className="ud-greet-sub">Here&apos;s your clinical practice overview.</p>
          </div>
          <span className="ud-date-pill">{today}</span>
        </div>

        {/* Stat Cards */}
        {stats ? (
          <DentzyKpiRow
            className="ud-stats-grid"
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
              },
            ]}
          />
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
            {Icons.warn(20, 2)}
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
                    <DentzyStatusPill type="workflow" status={order.status} />
                    <span className="ud-recent-case-chevron">→</span>
                  </div>
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
        <LabSupportBar variant="pc" />

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

  const handleDownloadUnpaid = (month = statementMonth) => {
    const query = month ? `&month=${encodeURIComponent(month)}` : '';
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
        <BalanceCreditCard
          totalUnpaid={totalUnpaid}
          unpaidCount={unpaidCount}
          creditLimit={creditLimit}
          monthFilter={statementMonth}
          onMonthChange={setStatementMonth}
          onDownloadPendingBill={handleDownloadUnpaid}
          variant="pc"
        />
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
                  {Icons.orders(13, 2.2)}
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
                  <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <DentzyStatusPill type="mode" status={p.paymentMode} />
                    {p.referenceNumber && <span style={{ color: '#708c80' }}>Ref: {p.referenceNumber}</span>}
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
