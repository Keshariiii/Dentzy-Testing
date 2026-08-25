'use client';
/**
 * MobileAdminDashboard -- Full-featured native mobile admin dashboard.
 * Real-time SSE, search, filter tabs, sort, password reveal,
 * approve/reject/delete actions, toast, live notification banners.
 * Zero emojis.
 */
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import MobileHeader from '../../components/mobile/MobileHeader';
import DentistDetailModal from '../../admin/DentistDetailModal';
import './MobileAdminDashboard.css';

import { Icons as Ico } from '../../components/common/DashboardIcons';

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending:  { label: 'Pending',  cls: 'ma-badge--amber' },
  approved: { label: 'Approved', cls: 'ma-badge--green' },
  rejected: { label: 'Rejected', cls: 'ma-badge--red' },
};

/* ============================================================
   COMPONENT
============================================================ */
const MobileAdminDashboard = () => {
  const router = useRouter();
  const { admin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();

  const [activeTab, setActiveTab]         = useState('all');
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
  const [error, setError]                 = useState(null);

  const sseRef        = useRef(null);
  const toastTimerRef = useRef(null);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

  const adminName = admin?.username || 'Admin';
  const initials  = adminName.slice(0, 2).toUpperCase();

  /* -- Notification sound ------------------------------------------------ */
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

  /* -- Data fetching ----------------------------------------------------- */
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const fetchStats = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!token) return;
    setError(null);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to load stats');
      }
    } catch { setError('Network error while loading stats'); }
  }, [ADMIN_API]);

  const fetchUsers = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!token) { setLoadingUsers(false); return; }
    setLoadingUsers(true);
    setError(null);
    try {
      const statusParam = activeTab === 'all' ? '' : `status=${activeTab}&`;
      const res = await authFetchRef.current(`${ADMIN_API}/users?${statusParam}sort=createdAt&order=${sortOrder}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to load users');
      }
    } catch { setError('Network error while loading users'); }
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

  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;
  const playNotifSoundRef = useRef(playNotifSound);
  playNotifSoundRef.current = playNotifSound;

  /* -- SSE connection ---------------------------------------------------- */
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

  /* -- Actions ----------------------------------------------------------- */
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
        method: 'PATCH', body: JSON.stringify({ note: 'Rejected by admin' }),
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

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="ma-shell">
      <MobileHeader
        title={null}
        showLogin={false}
        rightElement={<div className="ma-avatar">{initials}</div>}
      />

      {/* Greeting */}
      <div className="ma-greeting">
        <div>
          <h2 className="ma-hello">Hello, {adminName.charAt(0).toUpperCase() + adminName.slice(1)}</h2>
          <p className="ma-date">{todayStr}</p>
        </div>
        <button className="ma-logout-btn" onClick={handleLogout} aria-label="Logout">
          {Ico.logout(16)}
        </button>
      </div>

      {/* Live Notification Banners */}
      {liveNotifs.length > 0 && (
        <div className="ma-live-notifs">
          {liveNotifs.map(notif => (
            <div key={notif.id} className="ma-live-notif">
              <div className="ma-notif-icon">{Ico.bell(16)}</div>
              <div className="ma-notif-body">
                <strong>New Registration</strong>
                <span>{notif.name} &lt;{notif.email}&gt; is awaiting approval.</span>
              </div>
              <button className="ma-notif-close"
                onClick={() => setLiveNotifs(prev => prev.filter(n => n.id !== notif.id))}>
                {Ico.x(12)}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="ma-error-banner">
          <span>{error}</span>
          <button onClick={() => { fetchStats(); fetchUsers(); }}>Retry</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="ma-search-wrap">
        <div className="ma-search-bar">
          {Ico.search(14)}
          <input type="text" className="ma-search-input" placeholder="Search dentists..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="ma-search-clear" onClick={() => setSearch('')}>
              {Ico.x(12)}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="ma-tabs-wrap">
        <div className="ma-tabs">
          {TABS.map(tab => (
            <button key={tab.key}
              className={`ma-tab ${activeTab === tab.key ? 'ma-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ma-tab-count">{stats[tab.key] || 0}</span>
              )}
            </button>
          ))}
        </div>
        <div className="ma-sort-wrap">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="ma-sort-select">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <main className="ma-main">
        {loadingUsers ? (
          <div className="ma-loading">
            {[1, 2, 3].map(i => <div key={i} className="ma-skeleton-card" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="ma-empty">
            {Ico.users(48)}
            <p>No {activeTab === 'all' ? '' : activeTab + ' '}dentists found.</p>
          </div>
        ) : (
          <div className="ma-user-list">
            {filteredUsers.map(user => (
              <div key={user._id} className={`ma-user-card ma-uc--${user.status}`}
                onClick={() => setSelectedUserId(user._id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="ma-uc-top">
                  <div className="ma-uc-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
                  <div className="ma-uc-info">
                    <span className="ma-uc-name">{user?.name || 'Unnamed Dentist'}</span>
                    <span className="ma-uc-email">{user?.email || '—'}</span>
                    <span className="ma-uc-date">
                      {Ico.clock(11)}
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </span>
                  </div>
                  <span className={`ma-badge ${STATUS_BADGE[user.status]?.cls}`}>
                    {STATUS_BADGE[user.status]?.label}
                  </span>
                </div>

                {user.plainPassword && (
                  <div className="ma-uc-pw">
                    {Ico.lock(11)}
                    <span className="ma-pw-value">
                      {visiblePw === user._id ? user.plainPassword : '--------'}
                    </span>
                    <button className="ma-pw-toggle"
                      onClick={(e) => { e.stopPropagation(); setVisiblePw(visiblePw === user._id ? null : user._id); }}
                      title={visiblePw === user._id ? 'Hide' : 'Show'}>
                      {visiblePw === user._id ? Ico.eyeOff(13) : Ico.eye(13)}
                    </button>
                  </div>
                )}

                <div className="ma-uc-actions">
                  {user.status !== 'approved' && (
                    <button className="ma-action-btn ma-action--approve"
                      onClick={(e) => { e.stopPropagation(); handleApprove(user._id, user.name); }}
                      disabled={actionLoading === user._id + '_approve'}>
                      {actionLoading === user._id + '_approve'
                        ? <span className="ma-btn-spinner" />
                        : <>{Ico.check(12)} Approve</>}
                    </button>
                  )}
                  {user.status !== 'rejected' && (
                    <button className="ma-action-btn ma-action--reject"
                      onClick={(e) => { e.stopPropagation(); handleReject(user._id, user.name); }}
                      disabled={actionLoading === user._id + '_reject'}>
                      {actionLoading === user._id + '_reject'
                        ? <span className="ma-btn-spinner" />
                        : <>{Ico.x(12)} Reject</>}
                    </button>
                  )}
                  <button className="ma-action-btn ma-action--delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(user._id, user.name); }}
                    disabled={actionLoading === user._id + '_delete'}
                    title="Delete user">
                    {actionLoading === user._id + '_delete'
                      ? <span className="ma-btn-spinner" />
                      : Ico.trash(13)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 24 }} />
      </main>

      {/* App-style Bottom Navigation Bar */}
      <div className="ma-bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`ma-bnav-btn ${activeTab === tab.key ? 'ma-bnav-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <div className="ma-bnav-icon-wrap">
              {tab.key === 'all' && Ico.usersS(18)}
              {tab.key === 'pending' && Ico.clockS(18)}
              {tab.key === 'approved' && Ico.checkS(18)}
              {tab.key === 'rejected' && Ico.xS(18)}
              {tab.key !== 'all' && (stats[tab.key] || 0) > 0 && (
                <span className={`ma-bnav-badge ma-bnav-badge--${tab.key}`}>
                  {stats[tab.key]}
                </span>
              )}
            </div>
            <span className="ma-bnav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`ma-toast ${toast.type === 'error' ? 'ma-toast--error' : 'ma-toast--success'}`}>
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

export default MobileAdminDashboard;
