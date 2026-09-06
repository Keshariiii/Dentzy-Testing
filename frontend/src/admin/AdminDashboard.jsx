'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import DentistDetailModal from './DentistDetailModal';
import OrderDetailModal from '../components/OrderDetailModal';
import PaymentDetailModal from '../components/PaymentDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import './AdminDashboard.css';
import { formatINR } from '../utils/format';
const dentzyLogo = '/dentzy-logo-v2.png';

import { Icons as Ico } from '../components/common/DashboardIcons';

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
  const [adminView, setAdminView]         = useState('users'); // 'users' | 'orders' | 'payments'
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [users, setUsers]                 = useState([]);
  const [allOrders, setAllOrders]         = useState([]);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [sortOrder, setSortOrder]         = useState('desc');
  const [search, setSearch]               = useState('');
  const [toast, setToast]                 = useState(null);
  const [liveNotifs, setLiveNotifs]       = useState([]);
  const [visiblePw, setVisiblePw]         = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openMenuId, setOpenMenuId]         = useState(null);
  const [confirmConfig, setConfirmConfig]   = useState(null);
  // Payments view state
  const [paymentData, setPaymentData]       = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode]     = useState('all');
  const [paySearch, setPaySearch]             = useState('');
  // Record Payment modal state
  const [payModal, setPayModal] = useState(null); // { orderId, caseId, patientName, amount, ... }
  const [payForm, setPayForm]   = useState({ mode: 'Cash', referenceNumber: '', amount: '', notes: '' });
  const [payFormError, setPayFormError] = useState('');
  const [payFormSaving, setPayFormSaving] = useState(false);
  // Order & Payment detail modals
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
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

  const fetchAllOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders?limit=200&sort=createdAt&order=desc`);
      if (res.ok) { const d = await res.json(); setAllOrders(d.orders || []); }
    } catch {}
    setLoadingOrders(false);
  }, [ADMIN_API]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (payFilterStatus !== 'all') params.set('status', payFilterStatus);
      if (payFilterMode !== 'all') params.set('mode', payFilterMode);
      if (paySearch) params.set('search', paySearch);
      const res = await authFetchRef.current(`${ADMIN_API}/payments?${params}`);
      if (res.ok) { const d = await res.json(); setPaymentData(d); }
    } catch {}
    setLoadingPayments(false);
  }, [ADMIN_API, payFilterStatus, payFilterMode, paySearch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, [ADMIN_API]);

  const fetchUsers = useCallback(async () => {
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
    fetchAllOrders();
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.username]);

  // Re-fetch when tab or sort changes
  useEffect(() => {
    if (!admin?.username) return;
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortOrder]);

  // Re-fetch payments when filters change
  useEffect(() => {
    if (!admin?.username || adminView !== 'payments') return;
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payFilterStatus, payFilterMode]);

  // Refs for SSE callbacks
  const fetchUsersRef = useRef(fetchUsers);
  fetchUsersRef.current = fetchUsers;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;
  const fetchAllOrdersRef = useRef(fetchAllOrders);
  fetchAllOrdersRef.current = fetchAllOrders;
  const fetchPaymentsRef = useRef(fetchPayments);
  fetchPaymentsRef.current = fetchPayments;
  const playNotifSoundRef = useRef(playNotifSound);
  playNotifSoundRef.current = playNotifSound;

  /* ── SSE connection ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!admin?.username) return;

    let retryTimeout;
    let retryCount = 0;
    let stopped = false;
    let es = null;

    const connect = () => {
      if (stopped || retryCount >= 3) return;
      try {
        const url = `${ADMIN_API}/events`;
        es = new EventSource(url, { withCredentials: true });
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
          fetchAllOrdersRef.current?.();
        });
        es.addEventListener('order-created', () => { fetchAllOrdersRef.current?.(); });
        es.addEventListener('order-stage-updated', () => { fetchAllOrdersRef.current?.(); });
        es.addEventListener('order-deleted', () => { fetchAllOrdersRef.current?.(); });

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
    setConfirmConfig({
      title: 'Approve Dentist',
      message: `Are you sure you want to approve "${userName || 'this dentist'}"?`,
      type: 'primary',
      confirmText: 'Approve',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        setActionLoading(userId + '_approve');
        try {
          const res = await authFetch(`${ADMIN_API}/users/${userId}/approve`, { method: 'PATCH' });
          const data = await res.json();
          if (res.ok) { showToast('User approved successfully.'); fetchUsers(); fetchStats(); }
          else showToast(data.message || 'Failed to approve', 'error');
        } catch { showToast('Network error', 'error'); }
        setActionLoading(null);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleReject = async (userId, userName) => {
    setConfirmConfig({
      title: 'Reject Dentist',
      message: `Are you sure you want to reject "${userName || 'this dentist'}"?`,
      type: 'warning',
      confirmText: 'Reject',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
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
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleDelete = async (userId, userName) => {
    setConfirmConfig({
      title: 'Delete Dentist',
      message: `Are you sure you want to delete "${userName || 'this dentist'}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        setActionLoading(userId + '_delete');
        try {
          const res = await authFetch(`${ADMIN_API}/users/${userId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) { showToast('User deleted.'); fetchUsers(); fetchStats(); }
          else showToast(data.message || 'Failed to delete', 'error');
        } catch { showToast('Network error', 'error'); }
        setActionLoading(null);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleLogout = () => { adminLogout(); router.push('/login?role=admin'); };

  const openRecordPayment = (order) => {
    setPayModal(order);
    setPayForm({ mode: 'Cash', referenceNumber: '', amount: order.paymentAmount || order.amount || '', notes: '' });
    setPayFormError('');
    setPayFormSaving(false);
  };

  const handleRecordPayment = async () => {
    setPayFormError('');
    if (payForm.mode === 'Cheque' && (!payForm.referenceNumber || payForm.referenceNumber.trim().length < 3)) {
      setPayFormError('Cheque number is required (min 3 characters).');
      return;
    }
    if (payForm.mode === 'UPI' && (!payForm.referenceNumber || payForm.referenceNumber.trim().length < 4)) {
      setPayFormError('UPI transaction / UTR number is required (min 4 characters).');
      return;
    }
    setPayFormSaving(true);
    try {
      const body = {
        status: 'Paid',
        paymentMode: payForm.mode,
        referenceNumber: payForm.referenceNumber || '',
        notes: payForm.notes || '',
      };
      if (payForm.amount !== '' && !isNaN(Number(payForm.amount))) body.amount = Number(payForm.amount);
      const res = await authFetch(`${ADMIN_API}/orders/${payModal._id}/payment`, {
        method: 'PATCH', body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment recorded.');
        setPayModal(null);
        fetchAllOrders();
        fetchPaymentsRef.current?.();
      } else {
        setPayFormError(data.message || 'Failed to record payment.');
      }
    } catch { setPayFormError('Network error.'); }
    setPayFormSaving(false);
  };

  const handleRevertPayment = async (orderId) => {
    setActionLoading(orderId + '_payment');
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}/payment`, {
        method: 'PATCH', body: JSON.stringify({ status: 'Pending' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment reverted to Pending.');
        fetchAllOrders();
        fetchPaymentsRef.current?.();
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  const handleSendReminder = async (orderId) => {
    setActionLoading(orderId + '_remind');
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}/remind-payment`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) showToast(data.message || 'Reminder sent.');
      else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Order deleted successfully.');
        fetchAllOrders();
        fetchPayments();
      } else {
        showToast(data.message || 'Failed to delete order.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      const res = await authFetch(`${ADMIN_API}/payments/${paymentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Payment record deleted successfully.');
        fetchPayments();
        fetchAllOrders();
      } else {
        showToast(data.message || 'Failed to delete payment.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleUpdatePaymentAmount = async (payment, newAmount) => {
    const id = payment._id || payment.id || payment.caseId;
    const res = await authFetch(`${ADMIN_API}/payments/${id}/amount`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: newAmount }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || `Amount updated to ₹${newAmount.toLocaleString('en-IN')}.`);
      fetchPayments();
      fetchAllOrders();
      setSelectedPayment(prev => prev ? { ...prev, amount: newAmount } : null);
      setSelectedOrder(prev => prev ? { ...prev, amount: newAmount } : null);
    } else {
      throw new Error(data.message || 'Failed to update payment amount.');
    }
  };



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
              <button className={`ad-nav-item ${adminView === 'users' ? 'active' : ''}`} onClick={() => setAdminView('users')} aria-label="Dashboard">
                <span className="ad-nav-icon">{Ico.grid(16)}</span>
                Dentists
              </button>
              <button className={`ad-nav-item ${adminView === 'orders' ? 'active' : ''}`} onClick={() => { setAdminView('orders'); fetchAllOrders(); }} aria-label="Lab Orders">
                <span className="ad-nav-icon">{Ico.package ? Ico.package(16) : Ico.chart(16)}</span>
                Lab Orders
              </button>
              <button className={`ad-nav-item ${adminView === 'payments' ? 'active' : ''}`} onClick={() => { setAdminView('payments'); fetchPaymentsRef.current?.(); }} aria-label="Payments">
                <span className="ad-nav-icon">{Ico.payments ? Ico.payments(16) : Ico.wallet(16)}</span>
                Payments
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

            {adminView === 'payments' ? (
              /* ── Payments View ────────────────────────────────────── */
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="ad-section-title">Payments & Billing</p>
                  <button onClick={() => fetchPaymentsRef.current?.()} style={{ fontSize: '0.78rem', color: '#1e5038', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>↻ Refresh</button>
                </div>

                {/* Metrics Row */}
                {paymentData.summary && (
                  <div className="ad-pay-metrics">
                    <div className="ad-pay-metric ad-pay-metric--billed">
                      <span className="ad-pay-metric-label">Total Billed</span>
                      <span className="ad-pay-metric-value">{formatINR(paymentData.summary.totalBilled)}</span>
                    </div>
                    <div className="ad-pay-metric ad-pay-metric--collected">
                      <span className="ad-pay-metric-label">Collected</span>
                      <span className="ad-pay-metric-value">{formatINR(paymentData.summary.totalCollected)}</span>
                    </div>
                    <div className="ad-pay-metric ad-pay-metric--pending">
                      <span className="ad-pay-metric-label">Pending</span>
                      <span className="ad-pay-metric-value">{formatINR(paymentData.summary.totalPending)}</span>
                    </div>
                    <div className="ad-pay-metric ad-pay-metric--mode">
                      <span className="ad-pay-metric-label">By Mode</span>
                      <div className="ad-pay-mode-split">
                        <span className="ad-pay-mode-tag ad-pay-mode--cash">Cash {formatINR(paymentData.summary.byMode?.Cash || 0)}</span>
                        <span className="ad-pay-mode-tag ad-pay-mode--cheque">Cheque {formatINR(paymentData.summary.byMode?.Cheque || 0)}</span>
                        <span className="ad-pay-mode-tag ad-pay-mode--upi">UPI {formatINR(paymentData.summary.byMode?.UPI || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="ad-pay-filters">
                  <div className="ad-pay-filter-group">
                    {['all', 'Paid', 'Pending'].map(s => (
                      <button key={s} className={`ad-pay-filter-btn ${payFilterStatus === s ? 'active' : ''}`} onClick={() => setPayFilterStatus(s)}>
                        {s === 'all' ? 'All' : s}
                      </button>
                    ))}
                  </div>
                  <div className="ad-pay-filter-group">
                    {['all', 'Cash', 'Cheque', 'UPI'].map(m => (
                      <button key={m} className={`ad-pay-filter-pill ${payFilterMode === m ? 'active' : ''}`} onClick={() => setPayFilterMode(m)}>
                        {m === 'all' ? 'All Modes' : m}
                      </button>
                    ))}
                  </div>
                  <div className="ad-pay-search">
                    <span className="ad-search-icon">{Ico.search(14)}</span>
                    <input type="text" placeholder="Search patient, case ID, dentist…" value={paySearch}
                      onChange={e => setPaySearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchPaymentsRef.current?.()}
                    />
                  </div>
                </div>

                {/* Payments Table */}
                <div className="ad-content">
                  {loadingPayments ? (
                    <div className="ad-loading"><div className="ad-skeleton-list">{[1,2,3].map(i => <div key={i} className="ad-skeleton-card" />)}</div></div>
                  ) : (paymentData.payments || []).length === 0 ? (
                    <div className="ad-empty">{Ico.wallet(48)}<p>No payment records found.</p></div>
                  ) : (
                    <div className="ud-table-wrap" style={{ overflowX: 'auto' }}>
                      <table className="ud-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead><tr style={{ background: 'var(--surface, #f0f7f3)' }}>
                          {['Case ID', 'Patient', 'Dentist / Clinic', 'Amount', 'Status', 'Mode & Ref', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#4a7060', borderBottom: '2px solid var(--border, #e2ece6)' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {paymentData.payments.map((p, i) => (
                            <tr key={p._id} onClick={() => setSelectedPayment(p)} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface, #f8faf9)', borderBottom: '1px solid var(--border, #e2ece6)', cursor: 'pointer' }}>
                              <td style={{ padding: '10px 12px' }}><code style={{ fontSize: '0.78rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{p.caseId}</code></td>
                              <td style={{ padding: '10px 12px' }}><strong>{p.patientName}</strong></td>
                              <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                {formatINR(p.amount || 0)}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                  background: p.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                                  color: p.paymentStatus === 'Paid' ? '#16a34a' : '#92400e',
                                }}>{p.paymentStatus || 'Pending'}</span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {p.paymentStatus === 'Paid' && p.paymentMode ? (
                                  <span style={{ fontSize: '0.78rem' }}>
                                    <span className={`ad-pay-mode-tag ad-pay-mode--${(p.paymentMode || '').toLowerCase()}`}>{p.paymentMode}</span>
                                    {p.referenceNumber && <span style={{ color: '#708c80', marginLeft: '6px' }}>Ref: {p.referenceNumber}</span>}
                                  </span>
                                ) : <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                                {p.paymentStatus === 'Paid' ? (
                                  <button onClick={() => handleRevertPayment(p._id)} disabled={actionLoading === p._id + '_payment'}
                                    style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2ece6', background: '#fff', cursor: 'pointer', marginRight: '4px', color: '#92400e' }}>
                                    {actionLoading === p._id + '_payment' ? '...' : 'Mark Pending'}
                                  </button>
                                ) : (
                                  <button onClick={() => openRecordPayment(p)} style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', cursor: 'pointer', marginRight: '4px', fontWeight: 600 }}>
                                    Record Payment
                                  </button>
                                )}
                                {p.paymentStatus !== 'Paid' && (
                                  <button onClick={() => handleSendReminder(p._id)} disabled={actionLoading === p._id + '_remind'}
                                    style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', cursor: 'pointer', color: '#92400e' }}>
                                    {actionLoading === p._id + '_remind' ? '...' : 'Remind'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : adminView === 'orders' ? (
              /* ── Lab Orders View ─────────────────────────────────────── */
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="ad-section-title">All Lab Orders</p>
                  <button onClick={fetchAllOrders} style={{ fontSize: '0.78rem', color: '#1e5038', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>↻ Refresh</button>
                </div>
                <div className="ad-content">
                  {loadingOrders ? (
                    <div className="ad-loading"><div className="ad-skeleton-list">{[1,2,3].map(i => <div key={i} className="ad-skeleton-card" />)}</div></div>
                  ) : allOrders.length === 0 ? (
                    <div className="ad-empty">{Ico.chart(48)}<p>No lab orders found.</p></div>
                  ) : (
                    <div className="ud-table-wrap" style={{ overflowX: 'auto' }}>
                      <table className="ud-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead><tr style={{ background: 'var(--surface, #f0f7f3)' }}>
                          {['Patient', 'Case ID', 'Dentist', 'Service', 'Status', 'Payment', 'Created'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#4a7060', borderBottom: '2px solid var(--border, #e2ece6)' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {allOrders.map((o, i) => (
                            <tr key={o._id} onClick={() => setSelectedOrder(o)} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface, #f8faf9)', borderBottom: '1px solid var(--border, #e2ece6)', cursor: 'pointer' }}>
                              <td style={{ padding: '10px 12px' }}><strong>{o.patientName}</strong></td>
                              <td style={{ padding: '10px 12px' }}><code style={{ fontSize: '0.78rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{o.caseId}</code></td>
                              <td style={{ padding: '10px 12px', color: '#6b8a7a' }}>{o.owner?.name || o.dentistName || '—'}</td>
                              <td style={{ padding: '10px 12px' }}>{o.serviceType}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                  background: o.status === 'Completed' ? '#dcfce7' : o.status === 'In Progress' ? '#dbeafe' : o.status === 'Cancelled' ? '#fee2e2' : '#fef9c3',
                                  color: o.status === 'Completed' ? '#16a34a' : o.status === 'In Progress' ? '#1d4ed8' : o.status === 'Cancelled' ? '#dc2626' : '#92400e',
                                }}>{o.status}</span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                  background: (o.paymentStatus || 'Pending') === 'Paid' ? '#dcfce7' : '#fef9c3',
                                  color: (o.paymentStatus || 'Pending') === 'Paid' ? '#16a34a' : '#92400e',
                                }}>
                                  {o.paymentStatus || 'Pending'}
                                  {(o.paymentStatus === 'Paid' && o.paymentMode) ? ` · ${o.paymentMode}` : ''}
                                </span>
                                {(o.paymentStatus === 'Paid' && o.referenceNumber) && (
                                  <div style={{ fontSize: '0.7rem', color: '#708c80', marginTop: '2px' }}>Ref: {o.referenceNumber}</div>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.78rem' }}>
                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── User Management View ────────────────────────────────── */
              <div>

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
                  {filteredUsers.map(user => {
                    const uId = user._id || user.id;
                    return (
                    <div key={uId} className={`ad-user-card ${user.status}`}
                      onClick={() => setSelectedUserId(uId)}
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
                              {visiblePw === uId ? user.plainPassword : '••••••••'}
                            </span>
                            <button className="ad-pw-toggle"
                              onClick={(e) => { e.stopPropagation(); setVisiblePw(visiblePw === uId ? null : uId); }}
                              title={visiblePw === uId ? 'Hide password' : 'Show password'}
                            >
                              {visiblePw === uId ? Ico.eyeOff(13) : Ico.eye(13)}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline action buttons based on status */}
                      {(user.status === 'pending' || user.status === 'rejected') && (
                        <div className="ad-card-actions" onClick={e => e.stopPropagation()}>
                          <button className="ad-card-action-btn ad-action-approve" onClick={() => handleApprove(uId, user.name)} title="Approve">
                            {Ico.check(14)} Accept
                          </button>
                          {user.status === 'pending' && (
                            <button className="ad-card-action-btn ad-action-reject" onClick={() => handleReject(uId, user.name)} title="Reject">
                              {Ico.x(14)} Reject
                            </button>
                          )}
                          <button className="ad-card-action-btn ad-action-delete" onClick={() => handleDelete(uId, user.name)} title="Delete">
                            {Ico.trash(14)}
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            </div>
          )}

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
          onDeleteUser={() => { fetchUsers(); fetchStats(); }}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isAdmin={true}
          onDelete={handleDeleteOrder}
          onUpdateAmount={handleUpdatePaymentAmount}
        />
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          isAdmin={true}
          onDelete={handleDeletePayment}
          onRecordPayment={openRecordPayment}
          onUpdateAmount={handleUpdatePaymentAmount}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmConfig}
        {...confirmConfig}
      />

      {/* ── Record Payment Modal ──────────────────────────────────────── */}
      {payModal && (
        <div className="ad-modal-overlay" onClick={() => setPayModal(null)}>
          <div className="ad-pay-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-pay-modal-header">
              <h3>Record Payment</h3>
              <button className="ad-pay-modal-close" onClick={() => setPayModal(null)}>{Ico.x(16)}</button>
            </div>
            <div className="ad-pay-modal-meta">
              <span><strong>Case:</strong> {payModal.caseId}</span>
              <span><strong>Patient:</strong> {payModal.patientName}</span>
              {payModal.owner?.name && <span><strong>Dentist:</strong> {payModal.owner.name}</span>}
            </div>

            {/* Mode toggle */}
            <div className="ad-pay-mode-toggle">
              {['Cash', 'Cheque', 'UPI'].map(m => (
                <button key={m} className={`ad-pay-mode-btn ${payForm.mode === m ? 'active' : ''}`}
                  onClick={() => { setPayForm(f => ({ ...f, mode: m, referenceNumber: '' })); setPayFormError(''); }}>
                  {m}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="ad-pay-form-group">
              <label>Amount (₹)</label>
              <input type="number" min="0" placeholder="e.g. 5000" value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>

            {/* Conditional reference field */}
            {payForm.mode === 'Cheque' && (
              <div className="ad-pay-form-group">
                <label>Cheque Number *</label>
                <input type="text" placeholder="e.g. CHQ-650124" value={payForm.referenceNumber}
                  onChange={e => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))} />
              </div>
            )}
            {payForm.mode === 'UPI' && (
              <div className="ad-pay-form-group">
                <label>UPI Transaction ID / UTR *</label>
                <input type="text" placeholder="e.g. 428190382910" value={payForm.referenceNumber}
                  onChange={e => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))} />
              </div>
            )}
            {payForm.mode === 'Cash' && (
              <div className="ad-pay-form-group">
                <label>Notes (optional)</label>
                <input type="text" placeholder="e.g. Received by reception" value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            )}

            {payFormError && <div className="ad-pay-form-error">{payFormError}</div>}

            <div className="ad-pay-modal-actions">
              <button className="ad-pay-btn-cancel" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="ad-pay-btn-confirm" onClick={handleRecordPayment} disabled={payFormSaving}>
                {payFormSaving ? 'Saving…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
