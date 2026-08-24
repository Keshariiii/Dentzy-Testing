'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import DentistDetailModal from './DentistDetailModal';
import './AdminDashboard.css';
const dentzyLogo = '/dentzy-logo-v2.png';

/* ═══════════════════════════════════════════════════════════════════════════════
   SVG ICON HELPERS  (identical to UserDashboard)
═══════════════════════════════════════════════════════════════════════════════ */
const I = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const Ico = {
  grid:     (s=16) => <I size={s} d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />,
  search:   (s=14) => <I size={s} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />,
  logout:   (s=15) => <I size={s} d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,
  check:    (s=13) => <I size={s} sw={2.5} d={<><polyline points="20 6 9 17 4 12"/></>} />,
  x:        (s=13) => <I size={s} sw={2.5} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  trash:    (s=14) => <I size={s} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>} />,
  users:    (s=48) => <I size={s} sw={1.2} d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>} />,
  usersS:   (s=22) => <I size={s} sw={1.6} d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>} />,
  bell:     (s=16) => <I size={s} d={<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>} />,
  clock:    (s=14) => <I size={s} sw={1.5} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />,
  clockS:   (s=22) => <I size={s} sw={1.6} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />,
  lock:     (s=12) => <I size={s} sw={1.8} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>} />,
  eye:      (s=13) => <I size={s} sw={1.8} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>} />,
  eyeOff:   (s=13) => <I size={s} sw={1.8} d={<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>} />,
  chart:    (s=16) => <I size={s} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
  settings: (s=16) => <I size={s} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>} />,
  checkS:   (s=22) => <I size={s} sw={2} d={<><polyline points="20 6 9 17 4 12"/></>} />,
  xS:       (s=22) => <I size={s} sw={2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
};

const TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending:  { label: 'Pending',  cls: 'badge-pending'  },
  approved: { label: 'Approved', cls: 'badge-approved' },
  rejected: { label: 'Rejected', cls: 'badge-rejected' },
};

const AdminDashboard = () => {
  const router = useRouter();
  const { admin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();

  const [activeTab, setActiveTab]         = useState('all');
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [users, setUsers]                 = useState([]);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [sortOrder, setSortOrder]         = useState('desc');
  const [search, setSearch]               = useState('');
  const [toast, setToast]                 = useState(null);
  const [liveNotifs, setLiveNotifs]       = useState([]);
  const [visiblePw, setVisiblePw]         = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const sseRef        = useRef(null);
  const toastTimerRef = useRef(null);

  /* ── Date string ───────────────────────────────────────────────────────── */
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ── Notification sound ────────────────────────────────────────────────── */
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch { /* audio blocked */ }
  }, []);

  // Stable ref for authFetch — breaks the circular dependency
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const fetchStats = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!token) return;
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, [ADMIN_API]);

  const fetchUsers = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!token) {
      setLoadingUsers(false);
      return;
    }
    setLoadingUsers(true);
    try {
      const statusParam = activeTab === 'all' ? '' : `status=${activeTab}&`;
      const res = await authFetchRef.current(`${ADMIN_API}/users?${statusParam}sort=createdAt&order=${sortOrder}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {}
    setLoadingUsers(false);
  }, [ADMIN_API, activeTab, sortOrder]);

  // Fire once when admin is confirmed (uses primitive string, not object reference)
  useEffect(() => {
    if (!admin?.username) return;
    fetchStats();
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.username]);

  // Re-fetch when tab or sort changes
  useEffect(() => {
    if (!admin?.username) return;
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortOrder]);

  // Refs for SSE callbacks
  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;
  const playNotifSoundRef = useRef(playNotifSound);
  playNotifSoundRef.current = playNotifSound;

  /* ── SSE connection ────────────────────────────────────────────────────── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!admin?.username || !token) return;

    let retryTimeout;
    let retryCount = 0;
    let stopped = false;
    let es = null;

    const connect = () => {
      if (stopped || retryCount >= 3) return;
      try {
        const url = `${ADMIN_API}/events?token=${encodeURIComponent(token)}`;
        es = new EventSource(url);
        sseRef.current = es;

        es.addEventListener('connected', () => {
          retryCount = 0;
        });

        es.addEventListener('new-registration', (e) => {
          try {
            const user = JSON.parse(e.data);
            playNotifSoundRef.current?.();
            const id = Date.now();
            setLiveNotifs(prev => [{ id, ...user }, ...prev]);
            setTimeout(() => setLiveNotifs(prev => prev.filter(n => n.id !== id)), 8000);
            fetchUsersRef.current?.();
            fetchStatsRef.current?.();
          } catch {}
        });

        es.addEventListener('user-updated', () => {
          fetchUsersRef.current?.();
          fetchStatsRef.current?.();
        });

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          if (!stopped && retryCount < 3) {
            retryCount += 1;
            retryTimeout = setTimeout(connect, 10000);
          }
        };
      } catch {
        // SSE not supported or network error
      }
    };

    connect();

    return () => {
      stopped = true;
      if (es) {
        es.close();
        es = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      clearTimeout(retryTimeout);
    };
  }, [admin?.username, ADMIN_API]);

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to approve "${userName || 'this dentist'}"?`)) return;
    setActionLoading(userId + '_approve');
    try {
      const res = await authFetch(`${ADMIN_API}/users/${userId}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) { showToast('User approved successfully.'); fetchUsers(); fetchStats(); }
      else showToast(data.message || 'Failed to approve', 'error');
    } catch { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject "${userName || 'this dentist'}"?`)) return;
    setActionLoading(userId + '_reject');
    try {
      const res = await authFetch(`${ADMIN_API}/users/${userId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ note: 'Rejected by admin' }),
      });
      const data = await res.json();
      if (res.ok) { showToast('User rejected.'); fetchUsers(); fetchStats(); }
      else showToast(data.message || 'Failed to reject', 'error');
    } catch { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName || 'this dentist'}"? This action cannot be undone.`)) return;
    setActionLoading(userId + '_delete');
    try {
      const res = await authFetch(`${ADMIN_API}/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { showToast('User deleted.'); fetchUsers(); fetchStats(); }
      else showToast(data.message || 'Failed to delete', 'error');
    } catch { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  const handleLogout = () => { adminLogout(); router.push('/login?role=admin'); };

  const filteredUsers = (users || []).filter(u =>
    (u?.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (u?.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const adminName = admin?.username || 'Admin';
  const initials  = (adminName || 'AD').slice(0, 2).toUpperCase();

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="ad-layout">

      {/* ── TOP HEADER BAR (mirrors ud-header) ─────────────────────────────── */}
      <header className="ad-top-header">
        {/* Hamburger */}
        <button className="ad-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          <span /><span /><span />
        </button>
        {/* Logo */}
        <div className="ad-header-logo">
          <img src={dentzyLogo} alt="Dentzy" className="ad-logo-img" />
        </div>

        {/* Search */}
        <div className="ad-header-search">
          <span className="ad-search-icon">{Ico.search(14)}</span>
          <input
            type="text"
            className="ad-search"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Admin info */}
        <div className="ad-header-user">
          <div className="ad-header-user-details">
            <span className="ad-header-admin-name">{adminName}</span>
            <span className="ad-header-admin-role">
              <span className="ad-live-dot" />
              Admin
            </span>
          </div>
          <div className="ad-header-avatar">{initials}</div>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="ad-body">

        {/* Sidebar overlay */}
        {sidebarOpen && <div className="ad-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR (mirrors ud-sidebar) ─────────────────────────────────── */}
        <aside className={`ad-sidebar ${sidebarOpen ? 'ad-sidebar--open' : ''}`}>
          <div className="ad-sidebar-top">

            {/* Nav — mirrors ud-nav */}
            <nav className="ad-nav">
              <button className="ad-nav-item active" aria-label="Dashboard">
                <span className="ad-nav-icon">{Ico.grid(16)}</span>
                Dashboard
              </button>
              <button className="ad-nav-item" aria-label="Analytics" disabled>
                <span className="ad-nav-icon">{Ico.chart(16)}</span>
                Analytics
              </button>
              <button className="ad-nav-item" aria-label="Settings" disabled>
                <span className="ad-nav-icon">{Ico.settings(16)}</span>
                Settings
              </button>
            </nav>

            {/* Stats overview */}
            <p className="ad-stats-label">Overview</p>
            <div className="ad-stats">
              <div className="ad-stat-row">
                <div className="ad-stat-pill">
                  <span className="ad-stat-num">{stats.total}</span>
                  <span className="ad-stat-lbl">Total</span>
                </div>
                <div className="ad-stat-pill ad-stat-pending">
                  <span className="ad-stat-num">{stats.pending}</span>
                  <span className="ad-stat-lbl">Pending</span>
                </div>
              </div>
              <div className="ad-stat-row">
                <div className="ad-stat-pill ad-stat-approved">
                  <span className="ad-stat-num">{stats.approved}</span>
                  <span className="ad-stat-lbl">Approved</span>
                </div>
                <div className="ad-stat-pill ad-stat-rejected">
                  <span className="ad-stat-num">{stats.rejected}</span>
                  <span className="ad-stat-lbl">Rejected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout — mirrors ud-logout */}
          <button id="admin-logout-btn" className="ad-logout" onClick={handleLogout}>
            {Ico.logout(15)} Logout
          </button>
        </aside>

        {/* ── MAIN (mirrors ud-main) ───────────────────────────────────────── */}
        <main className="ad-main">
          <div className="ad-content-inner">

            {/* Greeting — mirrors ud-greeting / ud-greet-sub */}
            <h1 className="ad-greeting">
              Hello, {adminName.charAt(0).toUpperCase() + adminName.slice(1)}
              <span className="ad-header-live-dot" title="Live notifications active" />
            </h1>
            <p className="ad-subheading">
              Manage user registrations and account approvals.
            </p>

            {/* Top row: date pill + total badge — mirrors ud-dash-top */}
            <div className="ad-dash-top">
              <div className="ad-date-pill">{todayStr}</div>
              <div className="ad-total-badge">
                <span>{stats.total}</span> Total Users
              </div>
            </div>

            {/* Stat cards — mirrors ud-stats-grid / ud-stat-card */}
            <div className="ad-stat-cards">
              <div className="ad-stat-card ad-sc--total">
                <div className="ad-sc-icon-wrap">{Ico.usersS(22)}</div>
                <div className="ad-sc-body">
                  <span className="ad-sc-num">{stats.total}</span>
                  <span className="ad-sc-lbl">Total Registered</span>
                </div>
              </div>
              <div className="ad-stat-card ad-sc--pending">
                <div className="ad-sc-icon-wrap">{Ico.clockS(22)}</div>
                <div className="ad-sc-body">
                  <span className="ad-sc-num">{stats.pending}</span>
                  <span className="ad-sc-lbl">Awaiting Approval</span>
                </div>
              </div>
              <div className="ad-stat-card ad-sc--approved">
                <div className="ad-sc-icon-wrap">{Ico.checkS(22)}</div>
                <div className="ad-sc-body">
                  <span className="ad-sc-num">{stats.approved}</span>
                  <span className="ad-sc-lbl">Approved Accounts</span>
                </div>
              </div>
              <div className="ad-stat-card ad-sc--rejected">
                <div className="ad-sc-icon-wrap">{Ico.xS(22)}</div>
                <div className="ad-sc-body">
                  <span className="ad-sc-num">{stats.rejected}</span>
                  <span className="ad-sc-lbl">Rejected</span>
                </div>
              </div>
            </div>

            {/* Live notification banners */}
            {liveNotifs.length > 0 && (
              <div className="ad-live-notifs">
                {liveNotifs.map(notif => (
                  <div key={notif.id} className="ad-live-notif">
                    <div className="ad-live-notif-icon">{Ico.bell(16)}</div>
                    <div className="ad-live-notif-body">
                      <strong>New Registration Request</strong>
                      <span>{notif.name} &lt;{notif.email}&gt; is awaiting your approval.</span>
                    </div>
                    <button className="ad-live-notif-close"
                      onClick={() => setLiveNotifs(prev => prev.filter(n => n.id !== notif.id))}
                    >
                      {Ico.x(12)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Section heading — mirrors ud-section-title */}
            <div className="ad-section-header">
              <p className="ad-section-title">User Management</p>
            </div>

            {/* Tabs + sort — mirrors ud-tab-header / ud-controls */}
            <div className="ad-controls">
              <div className="ad-tabs">
                {TABS.map(tab => (
                  <button key={tab.key}
                    className={`ad-tab ${activeTab === tab.key ? 'ad-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                    {tab.key !== 'all' && (
                      <span className="ad-tab-count">{stats[tab.key] || 0}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="ad-controls-right">
                <div className="ad-sort">
                  <span>Sort:</span>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="ad-sort-select">
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="ad-divider" />

            {/* User list */}
            <div className="ad-content">
              {loadingUsers ? (
                <div className="ad-loading">
                  <div className="ad-skeleton-list">
                    {[1,2,3,4].map(i => <div key={i} className="ad-skeleton-card" />)}
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="ad-empty">
                  {Ico.users(48)}
                  <p>No {activeTab === 'all' ? '' : activeTab + ' '}users found.</p>
                </div>
              ) : (
                <div className="ad-user-list">
                  {filteredUsers.map(user => (
                    <div key={user._id} className={`ad-user-card ${user.status}`}
                      onClick={() => setSelectedUserId(user._id)}
                      style={{ cursor: 'pointer' }}
                    >

                      <div className="ad-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>

                      <div className="ad-user-info">
                        <div className="ad-user-name">{user?.name || 'Unnamed Dentist'}</div>
                        <div className="ad-user-email">{user?.email || '—'}</div>
                        <div className="ad-user-date">
                          {Ico.clock(12)}
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          }) : '—'}
                        </div>
                        {user.plainPassword && (
                          <div className="ad-user-pw">
                            {Ico.lock(12)}
                            <span className="ad-pw-value">
                              {visiblePw === user._id ? user.plainPassword : '••••••••'}
                            </span>
                            <button className="ad-pw-toggle"
                              onClick={(e) => { e.stopPropagation(); setVisiblePw(visiblePw === user._id ? null : user._id); }}
                              title={visiblePw === user._id ? 'Hide password' : 'Show password'}
                            >
                              {visiblePw === user._id ? Ico.eyeOff(13) : Ico.eye(13)}
                            </button>
                          </div>
                        )}
                      </div>

                      <span className={`ad-badge ${STATUS_BADGE[user.status]?.cls}`}>
                        {STATUS_BADGE[user.status]?.label}
                      </span>

                      <div className="ad-actions">
                        {user.status !== 'approved' && (
                          <button id={`approve-${user._id}`} className="ad-btn ad-btn-approve"
                            onClick={(e) => { e.stopPropagation(); handleApprove(user._id, user.name); }}
                            disabled={actionLoading === user._id + '_approve'}
                          >
                            {actionLoading === user._id + '_approve'
                              ? <span className="ad-btn-spinner" />
                              : <>{Ico.check(13)} Approve</>
                            }
                          </button>
                        )}
                        {user.status !== 'rejected' && (
                          <button id={`reject-${user._id}`} className="ad-btn ad-btn-reject"
                            onClick={(e) => { e.stopPropagation(); handleReject(user._id, user.name); }}
                            disabled={actionLoading === user._id + '_reject'}
                          >
                            {actionLoading === user._id + '_reject'
                              ? <span className="ad-btn-spinner" />
                              : <>{Ico.x(13)} Reject</>
                            }
                          </button>
                        )}
                        <button id={`delete-${user._id}`} className="ad-btn ad-btn-delete"
                          onClick={(e) => { e.stopPropagation(); handleDelete(user._id, user.name); }}
                          disabled={actionLoading === user._id + '_delete'}
                          title="Delete user"
                        >
                          {actionLoading === user._id + '_delete'
                            ? <span className="ad-btn-spinner" />
                            : Ico.trash(14)
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>{/* /ad-content-inner */}
        </main>

      </div>{/* /ad-body */}

      {/* Toast */}
      {toast && (
        <div className={`ad-toast ${toast.type === 'error' ? 'ad-toast-error' : 'ad-toast-success'}`}>
          {toast.type === 'error' ? Ico.x(14) : Ico.check(14)}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Dentist Detail Modal */}
      {selectedUserId && (
        <DentistDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
