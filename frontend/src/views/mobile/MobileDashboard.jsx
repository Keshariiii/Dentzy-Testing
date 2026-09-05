/**
 * MobileDashboard — Full-featured native app-style mobile dashboard.
 * 100% feature parity with UserDashboard.jsx (PC version).
 * No emojis. All features: ticker, pipeline, action hub, resources,
 * support bar, orders with search, payments, full settings,
 * delete account modal.
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Skeleton, SkeletonGroup, OrderSkeleton, StatCardSkeleton } from '../../components/Skeleton';
import MobileHeader from '../../components/mobile/MobileHeader';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import OrderDetailModal from '../../components/OrderDetailModal';
import PaymentDetailModal from '../../components/PaymentDetailModal';
import './MobileDashboard.css';

/* ============================================================
   ICONS — shared across desktop & mobile dashboards
============================================================ */
import { Icon, Icons } from '../../components/common/DashboardIcons';

/* ============================================================
   TICKER
============================================================ */
const TICKER_MESSAGES = [
  'Welcome to Dentzy Clinical Lab Portal',
  'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
  'New: Zirconia monolithic crowns with multi-shade gradients now available',
  'Submit STL files for faster digital impression processing',
  'Invoices are generated upon case dispatch — check the Payments tab',
  'All cases backed by the Dentzy 1-Year Quality Guarantee',
  'Lab support: Mon-Sat, 9 AM to 6 PM IST',
];

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

/* ============================================================
   PIPELINE
============================================================ */
const PIPELINE_STEPS = [
  { key: 'received',   label: 'Received',    d: 'M9 2h6l3 7H6L9 2zM5 9h14v13a2 2 0 01-2 2H7a2 2 0 01-2-2V9z' },
  { key: 'design',     label: 'CAD Design',  d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'production', label: 'Milling',     d: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { key: 'qc',         label: 'QC',          d: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  { key: 'dispatched', label: 'Dispatched',  d: 'M5 12h14M12 5l7 7-7 7' },
];

const MobilePipelineRow = ({ order }) => {
  const activeIdx = order ? ['received', 'design', 'production', 'qc', 'dispatched', 'completed'].indexOf(order.stage) : -1;
  return (
    <div className="m-pipeline-steps">
      {PIPELINE_STEPS.map((step, idx) => {
        const isPast    = activeIdx >= 0 && idx < activeIdx;
        const isCurrent = idx === activeIdx;
        const cls       = isPast ? 'past' : isCurrent ? 'current' : 'future';
        return (
          <React.Fragment key={step.key}>
            <div className={`m-ps-step m-ps-${cls}`}>
              <div className="m-ps-icon">
                {isPast || order?.stage === 'completed' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.d} />
                  </svg>
                )}
              </div>
              <span className="m-ps-label">{step.label}</span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`m-ps-connector${isPast || order?.stage === 'completed' ? ' filled' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MobilePipeline = ({ stats, orders, onViewOrders }) => {
  const [showAllPipelines, setShowAllPipelines] = useState(false);
  const inProgress = stats?.orders?.inProgress ?? 0;
  
  const unfinishedOrders = orders?.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled') || [];
  const activeOrder = unfinishedOrders[0] || orders?.[0];
  const displayOrders = showAllPipelines ? unfinishedOrders : [activeOrder];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {displayOrders.map((order, index) => (
        <div key={order?._id || index} className="m-pipeline-card">
          <div className="m-pipeline-hdr">
            <div>
              <h3 className="m-pipeline-title">Production Pipeline</h3>
              <p className="m-pipeline-sub">
                {order 
                  ? `Case ${order.caseId} • ${order.patientName}`
                  : 'Live status of your active lab cases'}
              </p>
            </div>
            <div className="m-pipeline-hdr-right" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              {index === 0 && inProgress > 0 && (
                <span className="m-live-pill">
                  <span className="m-pulse-dot" />
                  {inProgress} In Progress
                </span>
              )}
              {index === 0 && unfinishedOrders.length > 1 && (
                <button 
                  className="m-link-btn" 
                  onClick={() => setShowAllPipelines(!showAllPipelines)}
                >
                  {showAllPipelines ? 'View Less' : 'View More'}
                </button>
              )}
            </div>
          </div>
          
          <MobilePipelineRow order={order} />
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   STATUS PILL
============================================================ */
const StatusPill = ({ status }) => {
  const map = {
    'Pending':     'm-pill--amber',
    'In Progress': 'm-pill--blue',
    'Completed':   'm-pill--green',
    'Cancelled':   'm-pill--red',
    'Paid':        'm-pill--green',
    'Overdue':     'm-pill--red',
  };
  return <span className={`m-pill ${map[status] || 'm-pill--gray'}`}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const cls = priority?.toLowerCase() === 'rush' ? 'm-priority--rush' : 'm-priority--standard';
  return <span className={`m-priority-badge ${cls}`}>{priority || 'Standard'}</span>;
};

/* ============================================================
   HELPERS
============================================================ */
const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatDob = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

/* ============================================================
   TABS CONFIG
============================================================ */
const TABS = [
  { key: 'dashboard', label: 'Overview',  icon: Icons.dashboard },
  { key: 'orders',    label: 'Orders',    icon: Icons.labOrder },
  { key: 'payments',  label: 'Payments',  icon: Icons.payments },
  { key: 'settings',  label: 'Settings',  icon: Icons.settings },
];

/* ============================================================
   MAIN COMPONENT
============================================================ */
const MobileDashboard = () => {
  const router = useRouter();
  const { user, logout, authFetch, updateUserState, API_URL, DASH_URL } = useAuth();
  const { showToast } = useToast();

  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [search,      setSearch]      = useState('');
  const [stats,       setStats]       = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  // Settings state
  const [profileForm, setProfileForm]           = useState({ name: '', dob: '', phone: '', clinicName: '', address: '' });
  const [profileMsg,  setProfileMsg]            = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving]       = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [pwForm,  setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg,   setPwMsg]    = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw]    = useState({ current: false, new: false, confirm: false });
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteMsg, setDeleteMsg]           = useState({ type: '', text: '' });
  const [deleting, setDeleting]             = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const userName = user?.name || 'Doctor';
  const initials = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Sync profile form
  useEffect(() => {
    if (user) {
      setProfileForm({
        name:       user.name       || '',
        dob:        user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        phone:      user.phone      || '',
        clinicName: user.clinicName || '',
        address:    user.address    || '',
      });
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${DASH_URL}/stats`);
      if (res.ok) setStats(await res.json());
      else setError('Failed to load stats');
    } catch { setError('Network error while loading stats'); }
  }, [authFetch, DASH_URL]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`${DASH_URL}/orders?limit=50${q}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
      else setError('Failed to load orders');
    } catch { setError('Network error while loading orders'); }
    setLoading(false);
  }, [authFetch, DASH_URL, search]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${DASH_URL}/payments?limit=50`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
      else setError('Failed to load payments');
    } catch { setError('Network error while loading payments'); }
    setLoading(false);
  }, [authFetch, DASH_URL]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'orders' || activeTab === 'dashboard') fetchOrders();
      if (activeTab === 'payments') fetchPayments();
    }
  }, [user, activeTab, fetchOrders, fetchPayments]);

  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Real-time SSE synchronization with Admin updates
  useEffect(() => {
    if (!user) return;

    let es = null;
    let retryTimeout;
    let retryCount = 0;
    let stopped = false;

    const connect = () => {
      if (stopped || retryCount >= 3) return;
      try {
        const url = `${DASH_URL}/events`;
        es = new EventSource(url, { withCredentials: true });
        es.addEventListener('connected', () => { retryCount = 0; });
        const refresh = () => { fetchStatsRef.current?.(); fetchOrdersRef.current?.(); };
        ['new-order', 'order-stage-updated', 'order-deleted'].forEach(evt => es.addEventListener(evt, refresh));
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

  const handleLogout = () => { logout(); router.push('/login'); };

  /* ── Profile save ─────────────────────────── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (profileForm.name.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }
    if (profileForm.phone && profileForm.phone.trim().length > 0 && profileForm.phone.trim().length < 7) {
      setProfileMsg({ type: 'error', text: 'Phone number is too short.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const data = await apiFetch(`${API_URL}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name, dob: profileForm.dob || null,
          phone: profileForm.phone, clinicName: profileForm.clinicName, address: profileForm.address,
        }),
      });
      updateUserState(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      showToast('Profile updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally { setProfileSaving(false); }
  };

  /* ── Password change ──────────────────────── */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      const data = await apiFetch(`${API_URL}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      setPwMsg({ type: 'success', text: data.message || 'Password changed successfully!' });
      showToast('Password changed successfully!', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setShowChangePassword(false); setPwMsg({ type: '', text: '' }); }, 1800);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password.' });
      showToast(err.message || 'Failed to change password.', 'error');
    } finally { setPwSaving(false); }
  };

  /* ── Delete account ───────────────────────── */
  const handleDeleteAccount = async () => {
    setDeleteMsg({ type: '', text: '' });
    setDeleting(true);
    try {
      await apiFetch(`${API_URL}/profile`, {
        method: 'DELETE',
        body: JSON.stringify({ password: deleteConfirm }),
      });
      logout();
      router.push('/login');
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message || 'Failed to delete account.' });
    } finally { setDeleting(false); }
  };

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
      { key: 'settings',    icon: Icons.settings(20),  title: 'Account Settings',     desc: 'Manage profile, change password, and account preferences.',  cta: 'Go to Settings',color: 'teal',   onClick: () => setActiveTab('settings') },
    ];

    const RESOURCES = [
      { key: 'lab-form',  title: 'Lab Prescription Form',  desc: 'Standard case submission form' },
      { key: 'warranty',  title: 'Warranty Certificate',    desc: 'Dentzy 1-year quality guarantee' },
    ];

    return (
      <div className="m-tab-content">
        <Ticker />

        {/* Greeting */}
        <div className="m-overview-greeting">
          <div>
            <h2 className="m-dash-hello">Hello, {userName}</h2>
            <p className="m-dash-date">{today}</p>
          </div>
        </div>

        {/* Stat Cards */}
        {error && !stats ? (
          <div className="m-error-banner">
            <span>{error}</span>
            <button onClick={fetchStats}>Retry</button>
          </div>
        ) : stats ? (
          <div className="m-stats-row">
            <div className="m-stat-card m-stat--primary">
              <div className="m-stat-top">
                <span className="m-stat-num">{stats.orders.total}</span>
                <span className="m-stat-icon">{Icons.orders(22)}</span>
              </div>
              <span className="m-stat-label">Total Orders</span>
              <div className="m-stat-tags">
                <span className="m-tag m-tag--amber">{stats.orders.pending} Pending</span>
                <span className="m-tag m-tag--blue">{stats.orders.inProgress} Active</span>
              </div>
            </div>
            <div className="m-stat-card m-stat--success">
              <div className="m-stat-top">
                <span className="m-stat-num">{stats.orders.completed}</span>
                <span className="m-stat-icon">{Icons.checkCircle(22)}</span>
              </div>
              <span className="m-stat-label">Completed</span>
            </div>
          </div>
        ) : (
          <SkeletonGroup>
            <div className="m-stats-row">
              <div className="m-stat-card" style={{ padding: '16px' }}>
                <Skeleton width="50%" height="28px" style={{ marginBottom: '10px' }} />
                <Skeleton width="70%" height="12px" style={{ marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Skeleton width="60px" height="20px" borderRadius="20px" />
                  <Skeleton width="60px" height="20px" borderRadius="20px" />
                </div>
              </div>
              <div className="m-stat-card" style={{ padding: '16px' }}>
                <Skeleton width="40%" height="28px" style={{ marginBottom: '10px' }} />
                <Skeleton width="60%" height="12px" />
              </div>
            </div>
          </SkeletonGroup>
        )}

        {/* Pipeline */}
        {stats && <MobilePipeline stats={stats} orders={orders} onViewOrders={() => setActiveTab('orders')} />}

        {/* Action Hub */}
        <div className="m-section">
          <div className="m-section-hdr">
            <h3 className="m-section-h">Important Sections</h3>
            <p className="m-section-sub">Explore key areas of your dental lab portal</p>
          </div>
          <div className="m-action-hub">
            {ACTION_ITEMS.map((a) => (
              <button key={a.key} className={`m-action-card m-action-card--${a.color}`} onClick={a.onClick}>
                <div className="m-action-icon">{a.icon}</div>
                <h4 className="m-action-title">{a.title}</h4>
                <p className="m-action-desc">{a.desc}</p>
                <span className="m-action-cta">
                  {a.cta}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="m-section">
          <div className="m-section-hdr">
            <h3 className="m-section-h">Lab Resources & Downloads</h3>
            <p className="m-section-sub">Forms, clinical guides, and specification documents</p>
          </div>
          <div className="m-resources-list">
            {RESOURCES.map((r) => (
              <div key={r.key} className="m-resource-card">
                <div className="m-resource-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="m-resource-info">
                  <span className="m-resource-title">{r.title}</span>
                  <span className="m-resource-desc">{r.desc}</span>
                </div>
                <span className="m-resource-badge">PDF</span>
                <button className="m-resource-dl-btn" aria-label={`Download ${r.title}`}>
                  {Icons.download(15)}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Support Bar */}
        <div className="m-support-bar" id="m-support-bar">
          <div className="m-support-label">
            {Icons.phone(13)}
            <span><strong>Lab Support</strong> &mdash; Mon to Sat, 9 AM &ndash; 6 PM IST</span>
          </div>
          <div className="m-support-actions">
            <a href="tel:+919503668112" className="m-support-link">
              {Icons.phone(13)} Call
            </a>
            <a href="mailto:dentzyemail@gmail.com" className="m-support-link">
              {Icons.mail(13)} Email
            </a>
            <a href="https://wa.me/919503668112" target="_blank" rel="noreferrer" className="m-support-link m-support-link--wa">
              WhatsApp
            </a>
          </div>
        </div>

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
        <div className="m-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="m-search-input"
            placeholder="Search patient or case ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
          />
          {search && (
            <button className="m-search-clear" onClick={() => { setSearch(''); fetchOrders(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-error-banner">
          <span>{error}</span>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {loading ? (
        <SkeletonGroup>
          <OrderSkeleton count={4} />
        </SkeletonGroup>
      ) : orders.length === 0 ? (
        <div className="m-empty">
          {Icons.inbox(40)}
          <p>No lab orders found</p>
          <p className="m-empty-sub">Orders placed through your portal will appear here.</p>
        </div>
      ) : (
        <>
          <div className="m-count-label">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
          <div className="m-cards-list">
            {orders.map((o) => (
              <div key={o._id} className="m-order-card" onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                <div className="m-order-card__top">
                  <span className="m-order-id">{o.caseId}</span>
                  <StatusPill status={o.status} />
                </div>
                <div className="m-order-card__body">
                  <div className="m-order-row">
                    <span className="m-order-field">Patient</span>
                    <span className="m-order-value">{o.patientName}</span>
                  </div>
                  <div className="m-order-row">
                    <span className="m-order-field">Service</span>
                    <span className="m-order-value">{o.serviceType}</span>
                  </div>
                  <div className="m-order-row">
                    <span className="m-order-field">Priority</span>
                    <span className="m-order-value"><PriorityBadge priority={o.priority} /></span>
                  </div>
                  <div className="m-order-row">
                    <span className="m-order-field">Due Date</span>
                    <span className="m-order-value">{formatDate(o.dueDate)}</span>
                  </div>
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

    const modeBadge = (mode) => {
      const colors = { Cash: { bg: '#dcfce7', fg: '#166534' }, Cheque: { bg: '#dbeafe', fg: '#1d4ed8' }, UPI: { bg: '#fae8ff', fg: '#7e22ce' } };
      const c = colors[mode] || { bg: '#f0f0f0', fg: '#666' };
      return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600, background: c.bg, color: c.fg }}>{mode}</span>;
    };

    return (
      <div className="m-tab-content">
        <h2 className="m-tab-title">Payments</h2>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
          <strong>Payment Modes:</strong> Direct UPI (mobile / UPI ID), Cash, or Cheque. Status is updated once verified by lab administration.
        </div>
        {error && (
          <div className="m-error-banner">
            <span>{error}</span>
            <button onClick={fetchPayments}>Retry</button>
          </div>
        )}
        {loading ? (
          <SkeletonGroup>
            <OrderSkeleton count={3} />
          </SkeletonGroup>
        ) : data.length === 0 ? (
          <div className="m-empty">
            {Icons.inbox(40)}
            <p>No payment records found</p>
            <p className="m-empty-sub">Payment records will appear here once orders are created.</p>
          </div>
        ) : (
          <div className="m-cards-list">
            {data.map((p) => (
              <div key={p._id} className="m-order-card" onClick={() => setSelectedPayment(p)} style={{ cursor: 'pointer' }}>
                <div className="m-order-card__top">
                  <span className="m-order-id">{p.caseId}</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                    background: p.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                    color: p.paymentStatus === 'Paid' ? '#16a34a' : '#92400e',
                  }}>
                    {p.paymentStatus || 'Pending'}
                  </span>
                </div>
                <div className="m-order-card__body">
                  <div className="m-order-row">
                    <span className="m-order-field">Patient</span>
                    <span className="m-order-value">{p.patientName}</span>
                  </div>
                  <div className="m-order-row">
                    <span className="m-order-field">Service</span>
                    <span className="m-order-value">{p.serviceType || '—'}</span>
                  </div>
                  <div className="m-order-row">
                    <span className="m-order-field">Amount</span>
                    <span className="m-order-value m-order-amount">{p.amount > 0 ? formatINR(p.amount) : '—'}</span>
                  </div>
                  {p.paymentStatus === 'Paid' && p.paymentMode && (
                    <div className="m-order-row">
                      <span className="m-order-field">Mode</span>
                      <span className="m-order-value">{modeBadge(p.paymentMode)}</span>
                    </div>
                  )}
                  {p.paymentStatus === 'Paid' && p.referenceNumber && (
                    <div className="m-order-row">
                      <span className="m-order-field">Ref #</span>
                      <span className="m-order-value" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.referenceNumber}</span>
                    </div>
                  )}
                  <div className="m-order-row">
                    <span className="m-order-field">Due Date</span>
                    <span className="m-order-value">{formatDate(p.dueDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="m-bottom-spacer" />
      </div>
    );
  };



  /* ============================================================
     SETTINGS TAB
  ============================================================ */
  const renderSettings = () => (
    <div className="m-tab-content">
      <h2 className="m-tab-title">Account Settings</h2>

      {/* Profile Card */}
      <div className="m-settings-card">
        <div className="m-settings-card__head">
          <div className="m-settings-avatar">{initials}</div>
          <div className="m-settings-identity">
            <span className="m-settings-name">{user?.name}</span>
            <span className="m-settings-email">{user?.email}</span>
          </div>
          {!isEditingProfile && (
            <button className="m-settings-edit-btn"
              onClick={() => { setIsEditingProfile(true); setProfileMsg({ type: '', text: '' }); }}>
              Edit
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="m-info-rows">
            {[
              { label: 'Full Name',    value: user?.name || '—',        icon: Icons.user(12) },
              { label: 'Date of Birth', value: formatDob(user?.dob),    icon: null },
              { label: 'Email',         value: user?.email,             icon: Icons.mail(12), verified: true },
              { label: 'Phone',         value: user?.phone || '—',      icon: Icons.phone(12) },
              { label: 'Clinic Name',   value: user?.clinicName || '—', icon: null },
              { label: 'Address',       value: user?.address || '—',    icon: null },
            ].map((row) => (
              <div key={row.label} className="m-info-row">
                <span className="m-info-label">{row.icon} {row.label}</span>
                <span className="m-info-value">
                  {row.value}
                  {row.verified && <span className="m-verified-tag">Verified</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <form className="m-settings-form" onSubmit={handleProfileSave} noValidate>
            {profileMsg.text && (
              <div className={`m-msg m-msg--${profileMsg.type}`}>{profileMsg.text}</div>
            )}
            <div className="m-form-group">
              <label>Full Name</label>
              <input type="text" value={profileForm.name} maxLength={60}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div className="m-form-group">
              <label>Date of Birth</label>
              <input type="date" value={profileForm.dob}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))} />
            </div>
            <div className="m-form-group">
              <label>Phone</label>
              <input type="tel" value={profileForm.phone} maxLength={20} placeholder="Your phone number"
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="m-form-group">
              <label>Clinic Name</label>
              <input type="text" value={profileForm.clinicName} maxLength={100} placeholder="Your clinic name"
                onChange={e => setProfileForm(p => ({ ...p, clinicName: e.target.value }))} />
            </div>
            <div className="m-form-group">
              <label>Address</label>
              <textarea rows="2" value={profileForm.address} maxLength={300} placeholder="Clinic address"
                onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="m-form-actions">
              <button type="submit" className="m-btn m-btn--primary" disabled={profileSaving}>
                {profileSaving ? <span className="m-spinner-sm" /> : 'Save Changes'}
              </button>
              <button type="button" className="m-btn m-btn--ghost"
                onClick={() => { setIsEditingProfile(false); setProfileMsg({ type: '', text: '' }); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Card */}
      <div className="m-settings-card">
        <div className="m-settings-action-row">
          <div className="m-settings-action-info">
            <span className="m-settings-action-label">{Icons.shield(14)} Change Password</span>
            <span className="m-settings-action-sub">Update your login password.</span>
          </div>
          <button className="m-settings-edit-btn"
            onClick={() => { setShowChangePassword(v => !v); setPwMsg({ type: '', text: '' }); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
            {showChangePassword ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showChangePassword && (
          <form className="m-settings-form" onSubmit={handlePasswordChange} noValidate>
            {pwMsg.text && <div className={`m-msg m-msg--${pwMsg.type}`}>{pwMsg.text}</div>}
            {[
              { key: 'current', label: 'Current Password', field: 'currentPassword', ac: 'current-password' },
              { key: 'new',     label: 'New Password',     field: 'newPassword',     ac: 'new-password' },
              { key: 'confirm', label: 'Confirm Password', field: 'confirmPassword', ac: 'new-password' },
            ].map(({ key, label, field, ac }) => (
              <div className="m-form-group" key={key}>
                <label>{label}</label>
                <div className="m-pw-wrap">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[field]}
                    placeholder={label}
                    autoComplete={ac}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                  />
                  <button type="button" className="m-pw-eye"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}>
                    {Icons.eye(16, showPw[key])}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" className="m-btn m-btn--primary" disabled={pwSaving}>
              {pwSaving ? <span className="m-spinner-sm" /> : 'Update Password'}
            </button>
            <div className="m-forgot-wrap">
              <Link href="/forgot-password" className="m-forgot-link">Forgot your password?</Link>
            </div>
          </form>
        )}

        <div className="m-settings-divider" />

        <div className="m-settings-action-row">
          <div className="m-settings-action-info">
            <span className="m-settings-action-label m-settings-action-label--danger">
              {Icons.trash(14)} Delete Account
            </span>
            <span className="m-settings-action-sub">Permanently remove your account and data.</span>
          </div>
          <button className="m-settings-delete-outline-btn"
            onClick={() => { setShowDeleteModal(true); setDeleteMsg({ type: '', text: '' }); setDeleteConfirm(''); }}>
            Delete
          </button>
        </div>
      </div>

      {/* Logout */}
      <button className="m-logout-btn" onClick={handleLogout}>
        {Icons.logout(15)} Logout
      </button>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="m-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="m-modal" onClick={e => e.stopPropagation()}>
            <div className="m-modal-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="m-modal-title">Delete Account?</h3>
            <p className="m-modal-body">
              This will permanently delete your account and all associated data. Enter your password to confirm.
            </p>
            <input
              type="password"
              className="m-modal-input"
              placeholder="Enter your password"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoFocus
            />
            {deleteMsg.text && (
              <div className="m-msg m-msg--error">{deleteMsg.text}</div>
            )}
            <div className="m-modal-actions">
              <button className="m-btn m-btn--ghost" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="m-btn m-btn--danger" onClick={handleDeleteAccount}
                disabled={deleting || !deleteConfirm}>
                {deleting ? <span className="m-spinner-sm" /> : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="m-bottom-spacer" />
    </div>
  );

  /* ============================================================
     TAB ROUTER
  ============================================================ */
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderOverview();
      case 'orders':    return renderOrders();
      case 'payments':  return renderPayments();
      case 'settings':  return renderSettings();
      default:          return renderOverview();
    }
  };

  /* ============================================================
     LAYOUT
  ============================================================ */
  return (
    <div className="m-app-shell">
      <MobileHeader title={null} onAvatarClick={() => setActiveTab('settings')}>
        <div className="m-header-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="m-header-search-input"
            placeholder="Search patient or case ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setActiveTab('orders');
                fetchOrders();
              }
            }}
          />
          {search && (
            <button className="m-header-search-clear" onClick={() => { setSearch(''); fetchOrders(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </MobileHeader>

      <main className="m-dash-main">
        {renderContent()}
      </main>

      {/* App-style Bottom Navigation Bar */}
      <div className="m-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`m-tab-btn ${activeTab === t.key ? 'm-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <span className="m-tab-icon">{t.icon(activeTab === t.key ? 20 : 18)}</span>
            <span className="m-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        isAdmin={false}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        isAdmin={false}
      />
    </div>
  );
};

export default MobileDashboard;
