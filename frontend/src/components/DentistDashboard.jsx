'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import './DentistDashboard.css';
const dentzyLogo = '/dentzy-logo-v2.png';

/* =============================================================================
   SVG ICON LIBRARY — shared across desktop & mobile dashboards
============================================================================= */
import { Icon, Icons } from './common/DashboardIcons';

/* =============================================================================
   NAV + REVENUE ITEMS
============================================================================= */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',  icon: Icons.dashboard },
  { key: 'orders',    label: 'Lab Orders',  icon: Icons.labOrder },
  { key: 'reports',   label: 'Reports',     icon: Icons.reports },
  { key: 'payments',  label: 'Payments',    icon: Icons.payments },
  { key: 'settings',  label: 'Settings',    icon: Icons.settings },
];

const REVENUE_ITEMS = [
  { key: 'revenue-month',   label: 'This Month' },
  { key: 'revenue-pending', label: 'Pending Payments' },
  { key: 'revenue-paid',    label: 'Paid Invoices' },
  { key: 'revenue-report',  label: 'Invoice Report' },
];

/* =============================================================================
   TICKER BANNER  (GATE 2027-inspired rolling announcements)
============================================================================= */
const TICKER_MESSAGES = [
  'Welcome to Dentzy Clinical Lab Portal',
  'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
  'New: Zirconia monolithic crowns with multi-shade gradients now available',
  'Submit STL files for faster digital impression processing',
  'Invoices are generated upon case dispatch — check the Payments tab',
  'All cases backed by the Dentzy 1-Year Quality Guarantee',
  'Lab support: Mon-Sat, 9 AM to 6 PM IST',
];

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

/* =============================================================================
   PRODUCTION PIPELINE TIMELINE  (GATE 2027-inspired Important Dates section)
============================================================================= */
const PIPELINE_STEPS = [
  { key: 'received',   label: 'Order\nReceived',   iconD: 'M9 2h6l3 7H6L9 2zM5 9h14v13a2 2 0 01-2 2H7a2 2 0 01-2-2V9z' },
  { key: 'design',     label: 'CAD\nDesign',       iconD: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'production', label: 'Milling /\nPrinting', iconD: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { key: 'qc',         label: 'Quality\nCheck',    iconD: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  { key: 'dispatched', label: 'Dispatched', iconD: 'M5 12h14M12 5l7 7-7 7' },
];

const PipelineRow = ({ order }) => {
  const activeIdx = order ? ['received', 'design', 'production', 'qc', 'dispatched', 'completed'].indexOf(order.stage) : -1;
  return (
    <div className="ud-timeline-steps">
      {PIPELINE_STEPS.map((step, idx) => {
        const isPast    = activeIdx >= 0 && idx < activeIdx;
        const isCurrent = idx === activeIdx;
        const cls       = isPast ? 'past' : isCurrent ? 'current' : 'future';
        return (
          <React.Fragment key={step.key}>
            <div className={`ud-ts-step ud-ts-${cls}`}>
              <div className="ud-ts-icon">
                {isPast || order?.stage === 'completed' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.iconD}/>
                  </svg>
                )}
              </div>
              <span className="ud-ts-label">{step.label}</span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`ud-ts-connector${isPast || order?.stage === 'completed' ? ' filled' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const LabTimeline = ({ stats, orders, onViewOrders }) => {
  const [showAllPipelines, setShowAllPipelines] = useState(false);
  const inProgress = stats?.orders?.inProgress ?? 0;
  
  const unfinishedOrders = orders?.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled') || [];
  const activeOrder = unfinishedOrders[0] || orders?.[0];
  const displayOrders = showAllPipelines ? unfinishedOrders : [activeOrder];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {displayOrders.map((order, index) => (
        <div key={order?._id || index} className="ud-timeline-card">
          <div className="ud-timeline-header">
            <div>
              <h3 className="ud-timeline-title">Production Pipeline</h3>
              <p className="ud-timeline-sub">
                {order 
                  ? `Case ${order.caseId} • ${order.patientName} (${order.serviceType})`
                  : 'Live status of your active lab cases'}
              </p>
            </div>
            <div className="ud-timeline-hdr-right">
              {index === 0 && inProgress > 0 && (
                <span className="ud-live-pill">
                  <span className="ud-pulse-dot" />
                  {inProgress} In Progress
                </span>
              )}
              {index === 0 && unfinishedOrders.length > 1 && (
                <button 
                  className="ud-timeline-view-btn" 
                  style={{ marginLeft: '1rem' }} 
                  onClick={() => setShowAllPipelines(!showAllPipelines)}
                >
                  {showAllPipelines ? 'View Less' : 'View More'}
                </button>
              )}
            </div>
          </div>
          <PipelineRow order={order} />
        </div>
      ))}
    </div>
  );
};

/* =============================================================================
   STATUS BADGE
============================================================================= */
const StatusBadge = ({ status }) => {
  const map = {
    'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled', 'Paid': 'badge-paid', 'Overdue': 'badge-overdue',
  };
  return <span className={`ud-badge ${map[status] || 'badge-pending'}`}>{status}</span>;
};

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* =============================================================================
   MAIN COMPONENT
============================================================================= */
const DentistDashboard = () => {
  const router = useRouter();
  const { user, logout, authFetch, updateUserState, API_URL, DASH_URL } = useAuth();

  const [activeTab, setActiveTab]     = useState('dashboard');
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const [stats, setStats]             = useState(null);
  const [orders, setOrders]           = useState([]);
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(false);

  // Settings form state
  const [profileForm, setProfileForm]     = useState({ name: '', dob: '', phone: '', clinicName: '', address: '' });
  const [profileMsg, setProfileMsg]       = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg]     = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving]   = useState(false);
  const [showPw, setShowPw]   = useState({ current: false, new: false, confirm: false });

  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteMsg, setDeleteMsg]           = useState({ type: '', text: '' });
  const [deleting, setDeleting]             = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isEditingProfile, setIsEditingProfile]     = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Sync profile form when user changes
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
    if (!token) return;
    try {
      const res = await authFetch(`${DASH_URL}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [authFetch, DASH_URL]);

  const fetchOrders = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`${DASH_URL}/orders?limit=50${q}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
    } catch {}
    setLoading(false);
  }, [authFetch, DASH_URL, search]);

  const fetchPayments = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const statusMap = { 'revenue-pending': 'Pending', 'revenue-paid': 'Paid' };
      const statusParam = statusMap[activeTab] ? `&status=${statusMap[activeTab]}` : '';
      const res = await authFetch(`${DASH_URL}/payments?limit=50${statusParam}`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } catch {}
    setLoading(false);
  }, [authFetch, DASH_URL, activeTab]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'orders' || activeTab === 'dashboard') fetchOrders();
      if (['payments', 'revenue-month', 'revenue-pending', 'revenue-paid', 'revenue-report'].includes(activeTab)) fetchPayments();
    }
  }, [user, activeTab, fetchOrders, fetchPayments]);

  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Real-time SSE synchronization with Admin updates
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_token') : null;
    if (!user || !token) return;

    let es = null;
    let retryTimeout;
    let retryCount = 0;
    let stopped = false;

    const connect = () => {
      if (stopped || retryCount >= 3) return;
      try {
        const url = `${DASH_URL}/events?token=${encodeURIComponent(token)}`;
        es = new EventSource(url);
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
  const userName  = user?.name || 'Doctor';
  const initials  = userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ============================================================
     RENDER: Dashboard Overview  (GATE 2027-inspired layout)
  ============================================================ */
  const renderDashboard = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

    const ACTION_ITEMS = [
      {
        id: 'action-lab-orders',
        icon: Icons.labOrder(22),
        title: 'Lab Orders',
        desc: 'View and track all your active and completed dental lab cases.',
        cta: 'View Orders',
        variant: 'green',
        onClick: () => setActiveTab('orders'),
      },
      {
        id: 'action-payments',
        icon: Icons.payments(22),
        title: 'Payments & Invoices',
        desc: 'Review outstanding balances and access your full payment history.',
        cta: 'View Payments',
        variant: 'teal',
        onClick: () => setActiveTab('payments'),
      },
      {
        id: 'action-pending',
        icon: Icons.clock(22),
        title: 'Pending Invoices',
        desc: 'Cases awaiting payment — clear dues to avoid processing delays.',
        cta: 'View Pending',
        variant: 'amber',
        onClick: () => { setActiveTab('revenue-pending'); setRevenueOpen(true); },
      },
      {
        id: 'action-reports',
        icon: Icons.reports(22),
        title: 'Reports & Analytics',
        desc: 'Practice insights, turnaround times, and monthly order trends.',
        cta: 'View Reports',
        variant: 'green',
        onClick: () => setActiveTab('reports'),
      },
      {
        id: 'action-support',
        icon: Icons.chat(22),
        title: 'Lab Support',
        desc: 'Reach our clinical team for urgent case queries and technical help.',
        cta: 'Contact Support',
        variant: 'teal',
        onClick: () => {},
      },
      {
        id: 'action-settings',
        icon: Icons.settings(22),
        title: 'Account Settings',
        desc: 'Manage your profile, change your password, and account preferences.',
        cta: 'Go to Settings',
        variant: 'teal',
        onClick: () => setActiveTab('settings'),
      },
    ];

    const RESOURCES = [
      { id: 'res-lab-form', icon: Icons.fileText(20), title: 'Lab Prescription Form',   desc: 'Standard case submission form' },
      { id: 'res-warranty', icon: Icons.shield(20), title: 'Warranty Certificate',     desc: 'Dentzy 1-year quality guarantee' },
    ];

    return (
      <div className="ud-content-inner">

        {/* Announcement Ticker */}
        <TickerBanner />

        {/* Greeting Row */}
        <div className="ud-dash-top">
          <div>
            <h2 className="ud-greeting">Hello, {userName}</h2>
            <p className="ud-greet-sub">Here's your clinical practice overview.</p>
          </div>
          <span className="ud-date-pill">{today}</span>
        </div>

        {/* Stat Cards */}
        {stats ? (
          <div className="ud-stats-grid">
            <div className="ud-stat-card ud-stat-card--green">
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

            <div className="ud-stat-card ud-stat-card--emerald">
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
        {stats && (
          <LabTimeline stats={stats} orders={orders} onViewOrders={() => setActiveTab('orders')} />
        )}

        {/* Important Sections — Action Hub */}
        <div className="ud-actions-section">
          <div className="ud-section-header">
            <h3 className="ud-section-heading">Important Sections</h3>
            <p className="ud-section-sub">Explore key areas of your dental lab portal</p>
          </div>
          <div className="ud-actions-hub">
            {ACTION_ITEMS.map((a) => (
              <div
                key={a.id}
                id={a.id}
                className={`ud-action-card ud-action-card--${a.variant}`}
                onClick={a.onClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && a.onClick()}
              >
                <div className="ud-action-icon-wrap">{a.icon}</div>
                <h4 className="ud-action-title">{a.title}</h4>
                <p className="ud-action-desc">{a.desc}</p>
                <span className="ud-action-cta">
                  {a.cta}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lab Resources & Downloads */}
        <div className="ud-resources-section">
          <div className="ud-section-header">
            <h3 className="ud-section-heading">Lab Resources & Downloads</h3>
            <p className="ud-section-sub">Forms, clinical guides, and specification documents</p>
          </div>
          <div className="ud-resources-grid">
            {RESOURCES.map(r => (
              <div className="ud-resource-card" key={r.id}>
                <div className="ud-resource-icon-wrap">{r.icon}</div>
                <div className="ud-resource-info">
                  <h4 className="ud-resource-title">{r.title}</h4>
                  <p className="ud-resource-desc">{r.desc}</p>
                </div>
                <div className="ud-resource-download">{Icons.download(16)}</div>
              </div>
            ))}
          </div>
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
            <a href="mailto:dentzyemail@gmail.com" className="ud-support-link">
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
  const renderOrders = () => (
    <div className="ud-content-inner">
      <div className="ud-tab-header">
        <h2 className="ud-tab-title">Lab Orders</h2>
        <input
          type="text" placeholder="Search patient or case ID..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchOrders()}
          className="ud-search-inline"
        />
      </div>
      {loading ? (
        <div className="ud-loading"><div className="ud-spinner" /><span>Loading orders...</span></div>
      ) : orders.length === 0 ? (
        <div className="ud-empty">
          <div className="ud-empty-icon">{Icons.inbox(40)}</div>
          <p>No lab orders found</p>
          <p className="ud-empty-sub">Orders placed through your dashboard will appear here.</p>
        </div>
      ) : (
        <div className="ud-table-wrap">
          <table className="ud-table">
            <thead><tr>
              <th>Patient Name</th><th>Case ID</th><th>Service</th><th>Priority</th><th>Due Date</th><th>Status</th>
            </tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o._id}>
                <td><strong>{o.patientName}</strong></td>
                <td><code className="ud-code">{o.caseId}</code></td>
                <td>{o.serviceType}</td>
                <td><span className={`ud-priority ud-priority-${o.priority?.toLowerCase()}`}>{o.priority}</span></td>
                <td>{formatDate(o.dueDate)}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ============================================================
     RENDER: Reports
  ============================================================ */
  const renderReports = () => (
    <div className="ud-content-inner">
      <h2 className="ud-tab-title">Reports</h2>
      <div className="ud-coming-soon">
        <div className="ud-cs-icon">{Icons.barChart(40)}</div>
        <h3>Analytics Coming Soon</h3>
        <p>Your practice insights, monthly order trends, and revenue charts will appear here.</p>
      </div>
    </div>
  );

  /* ============================================================
     SETTINGS HANDLERS
  ============================================================ */
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
          name:       profileForm.name,
          dob:        profileForm.dob || null,
          phone:      profileForm.phone,
          clinicName: profileForm.clinicName,
          address:    profileForm.address,
        }),
      });
      updateUserState(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

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
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setShowChangePassword(false); setPwMsg({ type: '', text: '' }); }, 1800);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

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
    } finally {
      setDeleting(false);
    }
  };

  const EyeIcon = ({ show }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (
        <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      ) : (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      )}
    </svg>
  );

  const formatDob = (dob) => {
    if (!dob) return '—';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  /* ============================================================
     RENDER: Settings
  ============================================================ */
  const renderSettings = () => (
    <div className="ud-content-inner">
      <h2 className="ud-settings-title">Account Settings</h2>

      {/* Profile Card */}
      <div className="ud-settings-card">
        <div className="ud-settings-card-head">
          <div className="ud-settings-avatar">{initials}</div>
          <div className="ud-settings-card-head-info">
            <span className="ud-settings-card-name">{user?.name}</span>
            <span className="ud-settings-card-email">{user?.email}</span>
          </div>
          {!isEditingProfile && (
            <button
              type="button"
              id="edit-profile-btn"
              className="ud-settings-edit-btn"
              onClick={() => { setIsEditingProfile(true); setProfileMsg({ type: '', text: '' }); }}
            >
              Edit
            </button>
          )}
        </div>

        {!isEditingProfile && (
          <div className="ud-settings-info-rows">
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">{Icons.user(12)} Full Name</span>
              <span className="ud-settings-info-value">{user?.name || '—'}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {' '}Date of Birth
              </span>
              <span className="ud-settings-info-value">{formatDob(user?.dob)}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">{Icons.mail(12)} Email</span>
              <span className="ud-settings-info-value">
                {user?.email}
                <span className="ud-settings-verified-tag">Verified</span>
              </span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.12 12.71a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                {' '}Phone
              </span>
              <span className="ud-settings-info-value">{user?.phone || '—'}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {' '}Clinic Name
              </span>
              <span className="ud-settings-info-value">{user?.clinicName || '—'}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {' '}Address
              </span>
              <span className="ud-settings-info-value">{user?.address || '—'}</span>
            </div>
          </div>
        )}

        {isEditingProfile && (
          <form className="ud-settings-edit-form" onSubmit={handleProfileSave} noValidate>
            <div className="ud-settings-field">
              <label htmlFor="settings-name">{Icons.user(12)} Full Name</label>
              <input
                id="settings-name"
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                maxLength={60}
                className="ud-settings-input"
                autoFocus
              />
            </div>
            <div className="ud-settings-field">
              <label htmlFor="settings-dob">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {' '}Date of Birth
              </label>
              <input
                id="settings-dob"
                type="date"
                value={profileForm.dob}
                onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="ud-settings-input"
              />
            </div>
            <div className="ud-settings-field">
              <label htmlFor="settings-phone">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.12 12.71a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                {' '}Phone
              </label>
              <input
                id="settings-phone"
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Your phone number"
                maxLength={20}
                className="ud-settings-input"
              />
            </div>
            <div className="ud-settings-field">
              <label htmlFor="settings-clinic">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {' '}Clinic Name
              </label>
              <input
                id="settings-clinic"
                type="text"
                value={profileForm.clinicName}
                onChange={e => setProfileForm(p => ({ ...p, clinicName: e.target.value }))}
                placeholder="Your clinic or practice name"
                maxLength={100}
                className="ud-settings-input"
              />
            </div>
            <div className="ud-settings-field">
              <label htmlFor="settings-address">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {' '}Address
              </label>
              <textarea
                id="settings-address"
                value={profileForm.address}
                onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Clinic address"
                maxLength={300}
                rows={2}
                className="ud-settings-input ud-settings-textarea"
              />
            </div>
            {profileMsg.text && (
              <div className={`ud-settings-msg ${profileMsg.type === 'success' ? 'ud-settings-msg--success' : 'ud-settings-msg--error'}`}>
                {profileMsg.text}
              </div>
            )}
            <div className="ud-settings-edit-actions">
              <button type="submit" className="ud-settings-save-btn" disabled={profileSaving}>
                {profileSaving ? <span className="auth-spinner" /> : 'Save Changes'}
              </button>
              <button
                type="button"
                className="ud-settings-cancel-btn"
                onClick={() => { setIsEditingProfile(false); setProfileMsg({ type: '', text: '' }); }}
                disabled={profileSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Card */}
      <div className="ud-settings-card ud-settings-security-card">
        <div className="ud-settings-action-row">
          <div className="ud-settings-action-info">
            <span className="ud-settings-action-label">{Icons.shield(14)} Change Password</span>
            <span className="ud-settings-action-sub">Update your login password.</span>
          </div>
          <button
            type="button"
            id="toggle-change-password-btn"
            className="ud-settings-edit-btn"
            onClick={() => {
              setShowChangePassword(v => !v);
              setPwMsg({ type: '', text: '' });
              setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
          >
            {showChangePassword ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showChangePassword && (
          <form className="ud-settings-edit-form ud-settings-pw-form" onSubmit={handlePasswordChange} noValidate>
            {[
              { key: 'current', label: 'Current Password', field: 'currentPassword', autoComplete: 'current-password' },
              { key: 'new',     label: 'New Password',     field: 'newPassword',     autoComplete: 'new-password' },
              { key: 'confirm', label: 'Confirm Password', field: 'confirmPassword', autoComplete: 'new-password' },
            ].map(({ key, label, field, autoComplete }) => (
              <div className="ud-settings-field" key={key}>
                <label htmlFor={`pw-${key}`}>{label}</label>
                <div className="ud-settings-pw-wrap">
                  <input
                    id={`pw-${key}`}
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={label}
                    className="ud-settings-input"
                    autoComplete={autoComplete}
                  />
                  <button
                    type="button"
                    className="ud-settings-pw-toggle"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    aria-label={showPw[key] ? 'Hide' : 'Show'}
                  >
                    <EyeIcon show={showPw[key]} />
                  </button>
                </div>
              </div>
            ))}
            {pwMsg.text && (
              <div className={`ud-settings-msg ${pwMsg.type === 'success' ? 'ud-settings-msg--success' : 'ud-settings-msg--error'}`}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" className="ud-settings-save-btn" disabled={pwSaving}>
              {pwSaving ? <span className="auth-spinner" /> : 'Update Password'}
            </button>
            <div className="ud-settings-forgot-wrap">
              <Link href="/forgot-password" className="ud-settings-forgot-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Forgot your password?
              </Link>
            </div>
          </form>
        )}

        <div className="ud-settings-divider" />

        <div className="ud-settings-action-row">
          <div className="ud-settings-action-info">
            <span className="ud-settings-action-label ud-settings-action-label--danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              {' '}Delete Account
            </span>
            <span className="ud-settings-action-sub">Permanently remove your account and data.</span>
          </div>
          <button
            id="delete-account-btn"
            type="button"
            className="ud-settings-delete-outline-btn"
            onClick={() => { setShowDeleteModal(true); setDeleteMsg({ type: '', text: '' }); setDeleteConfirm(''); }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="ud-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="ud-modal" onClick={e => e.stopPropagation()}>
            <div className="ud-modal-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="ud-modal-title">Delete Account?</h3>
            <p className="ud-modal-body">
              This will permanently delete your account and all associated data. Enter your password to confirm.
            </p>
            <input
              id="delete-confirm-password"
              type="password"
              className="ud-settings-input"
              placeholder="Enter your password"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              autoFocus
            />
            {deleteMsg.text && (
              <div className="ud-settings-msg ud-settings-msg--error">{deleteMsg.text}</div>
            )}
            <div className="ud-modal-actions">
              <button
                type="button"
                className="ud-modal-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-btn"
                className="ud-settings-delete-btn"
                onClick={handleDeleteAccount}
                disabled={deleting || !deleteConfirm}
              >
                {deleting ? <span className="auth-spinner" /> : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ============================================================
     TAB TITLES
  ============================================================ */
  const paymentsTitles = {
    'payments':        'All Payments',
    'revenue-month':   "This Month's Payments",
    'revenue-pending': 'Pending Payments',
    'revenue-paid':    'Paid Invoices',
    'revenue-report':  'Invoice Report',
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'orders')   return renderOrders();
    if (activeTab === 'reports')  return renderReports();
    if (activeTab === 'settings') return renderSettings();

    if (paymentsTitles[activeTab]) {
      let data = payments;
      if (activeTab === 'revenue-month') {
        const now = new Date();
        data = payments.filter(p => {
          const d = new Date(p.invoiceDate);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      }
      return <PaymentsTab payments={data} loading={loading} title={paymentsTitles[activeTab]} />;
    }
    return null;
  };

  /* ============================================================
     LAYOUT
  ============================================================ */
  return (
    <div className="ud-layout">

      {/* Top Header */}
      <header className="ud-header">
        <button className="ud-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          <span /><span /><span />
        </button>
        <div className="ud-header-logo">
          <img src={dentzyLogo} alt="Dentzy" className="ud-logo-img" />
        </div>

        <div className="ud-header-search">
          <span className="ud-search-icon">{Icons.search(15)}</span>
          <input type="text" className="ud-search-input" placeholder="Search patient, case ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div
          className="ud-header-user"
          onClick={() => setActiveTab('settings')}
          title="Account Settings"
          role="button"
          tabIndex={0}
        >
          <div className="ud-user-details">
            <span className="ud-user-name">{userName}</span>
          </div>
          <div className="ud-user-avatar">{initials}</div>
        </div>
      </header>

      <div className="ud-body">
        {/* Sidebar overlay */}
        {sidebarOpen && <div className="ud-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        {/* Sidebar */}
        <aside className={`ud-sidebar ${sidebarOpen ? 'ud-sidebar--open' : ''}`}>
          <nav className="ud-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.key} id={`nav-${item.key}`}
                className={`ud-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.key); setRevenueOpen(false); setSidebarOpen(false); }}
              >
                <span className="ud-nav-icon">{item.icon(16)}</span>
                {item.label}
              </button>
            ))}

            {/* Revenue & Billing accordion */}
            <button id="nav-revenue"
              className={`ud-nav-item ud-nav-accordion ${REVENUE_ITEMS.some(r => r.key === activeTab) ? 'active' : ''}`}
              onClick={() => setRevenueOpen(v => !v)}
            >
              <span className="ud-nav-icon">{Icons.revenue(16)}</span>
              Revenue &amp; Billing
              <span className={`ud-chevron ${revenueOpen ? 'open' : ''}`}>&#8250;</span>
            </button>

            {revenueOpen && (
              <div className="ud-sub-nav">
                {REVENUE_ITEMS.map(item => (
                  <button key={item.key} id={`nav-${item.key}`}
                    className={`ud-sub-nav-item ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </nav>

          <button id="user-logout-btn" className="ud-logout" onClick={handleLogout}>
            {Icons.logout(15)} Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="ud-main">{renderContent()}</main>
      </div>
    </div>
  );
};

/* =============================================================================
   PAYMENTS TABLE SUB-COMPONENT
============================================================================= */
const PaymentsTab = ({ payments, loading, title }) => (
  <div className="ud-content-inner">
    <h2 className="ud-tab-title">{title}</h2>
    {loading ? (
      <div className="ud-loading"><div className="ud-spinner" /><span>Loading payments...</span></div>
    ) : payments.length === 0 ? (
      <div className="ud-empty">
        <div className="ud-empty-icon">{Icons.inbox(40)}</div>
        <p>No payment records found</p>
        <p className="ud-empty-sub">Payment records will appear here once added.</p>
      </div>
    ) : (
      <div className="ud-table-wrap">
        <table className="ud-table">
          <thead><tr>
            <th>Patient Name</th><th>Case ID</th><th>Invoice #</th><th>Amount</th>
            <th>Invoice Date</th><th>Due Date</th><th>Status</th>
          </tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p._id}>
              <td><strong>{p.patientName}</strong></td>
              <td><code className="ud-code">{p.caseId}</code></td>
              <td>{p.invoiceNumber || '—'}</td>
              <td className="ud-amount">&#8377;{p.amount?.toLocaleString('en-IN')}</td>
              <td>{formatDate(p.invoiceDate)}</td>
              <td>{formatDate(p.dueDate)}</td>
              <td><StatusBadge status={p.status} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    )}
  </div>
);

export default DentistDashboard;
