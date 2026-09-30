'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import './DentistDashboard.css';
import { formatINR, formatDate } from '../utils/format';
import OrderDetailModal from './OrderDetailModal';
import PaymentDetailModal from './PaymentDetailModal';
import EmptyState from './common/EmptyState';
import ProductionPipeline from './common/ProductionPipeline';
const dentzyLogo = '/dentzy-logo-v2.png';

/* =============================================================================
   SVG ICON LIBRARY — shared across desktop & mobile dashboards
============================================================================= */
import { Icon, Icons } from './common/DashboardIcons';
import { Info, ArrowRight, Phone, Mail as MailIcon, Calendar, Home, MapPin, Trash2, AlertTriangle, Eye as EyeIcon2, EyeOff as EyeOffIcon2 } from 'lucide-react';
import { TICKER_MESSAGES } from './dashboard/shared/constants';

/* =============================================================================
   NAV ITEMS
============================================================================= */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',  icon: Icons.dashboard },
  { key: 'orders',    label: 'Lab Orders',  icon: Icons.labOrder },
  { key: 'payments',  label: 'Payments',    icon: Icons.payments },
  { key: 'settings',  label: 'Settings',    icon: Icons.settings },
];

/* =============================================================================
   TICKER BANNER  (GATE 2027-inspired rolling announcements)
============================================================================= */
/* Ticker messages imported from dashboard/shared/constants.js */

const TickerBanner = () => (
  <div className="ud-ticker-wrap" aria-label="Lab announcements">
    <span className="ud-ticker-label">
      <Info size={11} strokeWidth={2.5} />
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
   STATUS BADGE
============================================================================= */
const StatusBadge = ({ status }) => {
  const map = {
    'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled', 'Paid': 'badge-paid', 'Overdue': 'badge-overdue',
  };
  return <span className={`ud-badge ${map[status] || 'badge-pending'}`}>{status}</span>;
};



/* =============================================================================
   MAIN COMPONENT
============================================================================= */
const DentistDashboard = () => {
  const router = useRouter();
  const { user, logout, authFetch, updateUserState, API_URL, DASH_URL } = useAuth();

  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const [stats, setStats]             = useState(null);
  const [orders, setOrders]           = useState([]);
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
    try {
      const res = await authFetch(`${DASH_URL}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [authFetch, DASH_URL]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await authFetch(`${DASH_URL}/orders?limit=50${q}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
    } catch {}
    setLoading(false);
  }, [authFetch, DASH_URL, search]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${DASH_URL}/payments?limit=50`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments || []); }
    } catch {}
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
        onClick: () => setActiveTab('payments'),
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

        {/* #17 — Welcome banner for first-time users */}
        {stats && stats.orders.total === 0 && (
          <div className="ud-welcome-banner">
            <h3>Welcome, Dr. {userName}! ✓</h3>
            <p>Here's how to get started with Dentzy:</p>
            <ol>
              <li>Complete your <strong>profile</strong> in Settings</li>
              <li>Submit your first <strong>lab order</strong></li>
              <li>Track your case through the <strong>production pipeline</strong></li>
            </ol>
          </div>
        )}

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
            <div className="ud-stat-card ud-stat-card--green" title="Total lab orders submitted — includes pending, in-progress, and completed cases">
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

            <div className="ud-stat-card ud-stat-card--emerald" title="Cases that have passed QC and been dispatched to your clinic">
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
          <ProductionPipeline stats={stats} orders={orders} onViewOrders={() => setActiveTab('orders')} />
        )}

        {/* Important Sections — Action Hub */}
        <div className="ud-actions-section">
          <div className="ud-section-header">
            <h3 className="ud-section-heading">Quick Actions</h3>
            <p className="ud-section-sub">Jump to key areas of your dental lab portal</p>
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
                  <ArrowRight size={13} strokeWidth={2.5} />
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
            <Phone size={15} strokeWidth={2} />
            <span><strong>Lab Support</strong> &mdash; Mon to Sat, 9 AM &ndash; 6 PM IST</span>
          </div>
          <div className="ud-support-links">
            <a href="tel:+919503668112" className="ud-support-link">
              <Phone size={13} strokeWidth={2} />
              Call
            </a>
            <a href="mailto:dentzyemail@gmail.com" className="ud-support-link">
              <MailIcon size={13} strokeWidth={2} />
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
          <input
            type="text" placeholder="Search patient or case ID..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
            className="ud-search-inline"
          />
        </div>
      </div>

      {loading ? (
        <div className="ud-loading"><div className="ud-spinner" /><span>Loading orders...</span></div>
      ) : orders.length === 0 ? (
        <EmptyState
          variant="orders"
          message="No lab orders found"
          subtext="Orders placed through your dashboard will appear here."
        />
      ) : (
        <div className="ud-table-wrap">
          <table className="ud-table">
            <thead><tr>
              <th>Patient Name</th><th>Case ID</th><th>Service</th><th>Priority</th><th>Due Date</th><th>Status</th>
            </tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o._id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
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
    show ? <EyeOffIcon2 size={16} strokeWidth={2} /> : <EyeIcon2 size={16} strokeWidth={2} />
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
                <Calendar size={12} strokeWidth={2} />
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
                <Phone size={12} strokeWidth={2} />
                {' '}Phone
              </span>
              <span className="ud-settings-info-value">{user?.phone || '—'}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <Home size={12} strokeWidth={2} />
                {' '}Clinic Name
              </span>
              <span className="ud-settings-info-value">{user?.clinicName || '—'}</span>
            </div>
            <div className="ud-settings-info-row">
              <span className="ud-settings-info-label">
                <MapPin size={12} strokeWidth={2} />
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
                <Calendar size={12} strokeWidth={2} />
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
                <Phone size={12} strokeWidth={2} />
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
                <Home size={12} strokeWidth={2} />
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
                <MapPin size={12} strokeWidth={2} />
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
                <Info size={12} strokeWidth={2} />
                Forgot your password?
              </Link>
            </div>
          </form>
        )}

        <div className="ud-settings-divider" />

        <div className="ud-settings-action-row">
          <div className="ud-settings-action-info">
            <span className="ud-settings-action-label ud-settings-action-label--danger">
              <Trash2 size={14} strokeWidth={2} />
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
              <AlertTriangle size={26} strokeWidth={2} color="#c0392b" />
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

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'orders')   return renderOrders();
    if (activeTab === 'settings') return renderSettings();
    if (activeTab === 'payments') return <PaymentsTab payments={payments} loading={loading} title="Payments & Invoices" onSelectPayment={setSelectedPayment} />;
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
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              >
                <span className="ud-nav-icon">{item.icon(16)}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <button id="user-logout-btn" className="ud-logout" onClick={handleLogout}>
            {Icons.logout(15)} Logout
          </button>
        </aside>

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
const PaymentsTab = ({ payments, loading, title, onSelectPayment }) => (
  <div className="ud-content-inner">
    <h2 className="ud-tab-title">{title}</h2>
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
      <strong>Accepted Payment Modes:</strong> Direct UPI (to lab mobile number / UPI ID), Cash, or Cheque. No payment gateway required. Once your payment is received, lab administration will verify and mark the order as Paid.
    </div>
    {loading ? (
      <div className="ud-loading"><div className="ud-spinner" /><span>Loading payments...</span></div>
    ) : payments.length === 0 ? (
      <EmptyState
        variant="payments"
        message="No payment records found"
        subtext="Payment records will appear here once orders are created."
      />
    ) : (
      <div className="ud-table-wrap">
        <table className="ud-table">
          <thead><tr>
            <th>Patient Name</th><th>Case ID</th><th>Service</th><th>Amount</th>
            <th>Due Date</th><th>Payment Status</th><th>Mode & Ref</th>
          </tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p._id} onClick={() => onSelectPayment?.(p)} style={{ cursor: 'pointer' }}>
              <td><strong>{p.patientName}</strong></td>
              <td><code className="ud-code">{p.caseId}</code></td>
              <td>{p.serviceType || '—'}</td>
              <td className="ud-amount">{p.amount > 0 ? `₹${p.amount.toLocaleString('en-IN')}` : '—'}</td>
              <td>{formatDate(p.dueDate)}</td>
              <td>
                <span style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                  background: p.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                  color: p.paymentStatus === 'Paid' ? '#16a34a' : '#92400e',
                }}>
                  {p.paymentStatus || 'Pending'}
                </span>
              </td>
              <td>
                {p.paymentStatus === 'Paid' && p.paymentMode ? (
                  <span style={{ fontSize: '0.78rem' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                      background: p.paymentMode === 'Cash' ? '#dcfce7' : p.paymentMode === 'UPI' ? '#fae8ff' : '#dbeafe',
                      color: p.paymentMode === 'Cash' ? '#166534' : p.paymentMode === 'UPI' ? '#7e22ce' : '#1d4ed8',
                    }}>{p.paymentMode}</span>
                    {p.referenceNumber && <span style={{ color: '#708c80', marginLeft: '6px' }}>Ref: {p.referenceNumber}</span>}
                  </span>
                ) : <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    )}
  </div>
);

export default DentistDashboard;

