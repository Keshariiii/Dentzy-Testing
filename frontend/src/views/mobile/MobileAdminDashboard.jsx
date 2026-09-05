'use client';
/**
 * MobileAdminDashboard -- Full-featured touch-native mobile admin dashboard.
 * Primary Navigation: Dentists, Lab Orders, Payments & Billing.
 * 100% responsive, zero emojis, clean design with NO colored side lines.
 */
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import MobileHeader from '../../components/mobile/MobileHeader';
import DentistDetailModal from '../../admin/DentistDetailModal';
import OrderDetailModal from '../../components/OrderDetailModal';
import PaymentDetailModal from '../../components/PaymentDetailModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import './MobileAdminDashboard.css';

import { Icons as Ico } from '../../components/common/DashboardIcons';

const DENTIST_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const ORDER_TABS = ['all', 'In Progress', 'Pending', 'Completed', 'Cancelled'];
const PAY_STATUS_TABS = ['all', 'Paid', 'Pending'];
const PAY_MODE_TABS = ['all', 'Cash', 'Cheque', 'UPI'];

const ADMIN_NAV = [
  { key: 'dentists', label: 'Dentists',   icon: (s) => Ico.usersS(s) },
  { key: 'orders',   label: 'Lab Orders', icon: (s) => Ico.labOrder(s) },
  { key: 'payments', label: 'Payments',   icon: (s) => Ico.payments(s) },
];

/* ============================================================
   HELPERS
============================================================ */
const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

/* ============================================================
   COMPONENT
============================================================ */
const MobileAdminDashboard = () => {
  const router = useRouter();
  const { admin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();

  // Primary view: 'dentists' | 'orders' | 'payments'
  const [adminView, setAdminView] = useState('dentists');

  // Dentists view state
  const [activeTab, setActiveTab]         = useState('all');
  const [users, setUsers]                 = useState([]);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [sortOrder, setSortOrder]         = useState('desc');
  const [search, setSearch]               = useState('');
  const [visiblePw, setVisiblePw]         = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Orders view state
  const [allOrders, setAllOrders]         = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter]     = useState('all');
  const [orderSearch, setOrderSearch]     = useState('');

  // Payments view state
  const [paymentData, setPaymentData]         = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode]     = useState('all');
  const [paySearch, setPaySearch]             = useState('');

  // Record Payment modal state
  const [payModal, setPayModal]         = useState(null);
  const [payForm, setPayForm]           = useState({ mode: 'Cash', referenceNumber: '', amount: '', notes: '' });
  const [payFormError, setPayFormError] = useState('');
  const [payFormSaving, setPayFormSaving] = useState(false);

  // Detail modals
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Common state
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]                 = useState(null);
  const [liveNotifs, setLiveNotifs]       = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
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

  const fetchAllOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders?limit=200&sort=createdAt&order=desc`);
      if (res.ok) {
        const d = await res.json();
        setAllOrders(d.orders || []);
      }
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
      if (res.ok) {
        const d = await res.json();
        setPaymentData(d);
      }
    } catch {}
    setLoadingPayments(false);
  }, [ADMIN_API, payFilterStatus, payFilterMode, paySearch]);

  // Initial load
  useEffect(() => {
    if (!admin?.username) return;
    fetchStats();
    fetchUsers();
    fetchAllOrders();
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.username]);

  // Re-fetch users on tab or sort change
  useEffect(() => {
    if (!admin?.username) return;
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortOrder]);

  // Re-fetch payments when payment filters change
  useEffect(() => {
    if (!admin?.username || adminView !== 'payments') return;
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payFilterStatus, payFilterMode]);

  // Stable refs for SSE
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

  /* -- SSE connection ---------------------------------------------------- */
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

        es.addEventListener('connected', () => { retryCount = 0; });

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

        es.addEventListener('order-created', () => {
          fetchAllOrdersRef.current?.();
          fetchPaymentsRef.current?.();
        });

        es.addEventListener('order-stage-updated', () => {
          fetchAllOrdersRef.current?.();
          fetchPaymentsRef.current?.();
        });

        es.addEventListener('order-deleted', () => {
          fetchAllOrdersRef.current?.();
          fetchPaymentsRef.current?.();
        });

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
      if (es) { es.close(); es = null; }
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      clearTimeout(retryTimeout);
    };
  }, [admin?.username, ADMIN_API]);

  /* -- Toast helper ------------------------------------------------------ */
  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  /* -- User Actions ------------------------------------------------------ */
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
            method: 'PATCH', body: JSON.stringify({ note: 'Rejected by admin' }),
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

  /* -- Payment Actions --------------------------------------------------- */
  const openRecordPayment = (order) => {
    setPayModal(order);
    setPayForm({
      mode: 'Cash',
      referenceNumber: '',
      amount: order.paymentAmount || order.amount || '',
      notes: ''
    });
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
      if (payForm.amount !== '' && !isNaN(Number(payForm.amount))) {
        body.amount = Number(payForm.amount);
      }
      const res = await authFetch(`${ADMIN_API}/orders/${payModal._id || payModal.id || payModal.caseId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment recorded successfully.');
        setPayModal(null);
        fetchAllOrders();
        fetchPayments();
      } else {
        setPayFormError(data.message || 'Failed to record payment.');
      }
    } catch {
      setPayFormError('Network error.');
    }
    setPayFormSaving(false);
  };

  const handleRevertPayment = async (orderId) => {
    setActionLoading(orderId + '_payment');
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Pending' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment reverted to Pending.');
        fetchAllOrders();
        fetchPayments();
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

  const handleLogout = () => { adminLogout(); router.push('/login?role=admin'); };

  /* -- Filtered lists ---------------------------------------------------- */
  const filteredUsers = (users || []).filter(u =>
    (u?.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (u?.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const filteredOrders = (allOrders || []).filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      const patient = (o.patientName || '').toLowerCase();
      const caseId = (o.caseId || '').toLowerCase();
      const dentist = (o.owner?.name || o.dentistName || '').toLowerCase();
      return patient.includes(q) || caseId.includes(q) || dentist.includes(q);
    }
    return true;
  });

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

      {/* Greeting Header */}
      <div className="ma-greeting">
        <div>
          {adminView === 'dentists' && (
            <>
              <h2 className="ma-hello">Hello, {adminName.charAt(0).toUpperCase() + adminName.slice(1)}</h2>
              <p className="ma-date">{todayStr}</p>
            </>
          )}
          {adminView === 'orders' && (
            <>
              <h2 className="ma-hello">Lab Orders</h2>
              <p className="ma-date">{allOrders.length} Total Orders</p>
            </>
          )}
          {adminView === 'payments' && (
            <>
              <h2 className="ma-hello">Payments & Billing</h2>
              <p className="ma-date">{paymentData.payments?.length || 0} Records</p>
            </>
          )}
        </div>
        <div className="ma-greeting-right">
          {adminView === 'orders' && (
            <button className="ma-refresh-btn" onClick={fetchAllOrders} title="Refresh orders">
              ↻
            </button>
          )}
          {adminView === 'payments' && (
            <button className="ma-refresh-btn" onClick={fetchPayments} title="Refresh payments">
              ↻
            </button>
          )}
          <button className="ma-logout-btn" onClick={handleLogout} aria-label="Logout">
            {Ico.logout(16)}
          </button>
        </div>
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

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: DENTISTS
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'dentists' && (
        <>
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
              {DENTIST_TABS.map(tab => (
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
                {filteredUsers.map(user => {
                  const uId = user._id || user.id;
                  return (
                  <div key={uId} className={`ma-user-card ma-uc--${user.status}`}
                    onClick={() => setSelectedUserId(uId)}
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
                    </div>

                    {user.plainPassword && (
                      <div className="ma-uc-pw" style={{ marginTop: '12px' }}>
                        {Ico.lock(11)}
                        <span className="ma-pw-value">
                          {visiblePw === uId ? user.plainPassword : '••••••••'}
                        </span>
                        <button className="ma-pw-toggle"
                          onClick={(e) => { e.stopPropagation(); setVisiblePw(visiblePw === uId ? null : uId); }}
                          title={visiblePw === uId ? 'Hide' : 'Show'}>
                          {visiblePw === uId ? Ico.eyeOff(13) : Ico.eye(13)}
                        </button>
                      </div>
                    )}

                    {/* Inline action buttons based on status */}
                    {(user.status === 'pending' || user.status === 'rejected') && (
                      <div className="ma-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="ma-card-action-btn ma-action-approve" onClick={() => handleApprove(uId, user.name)}>
                          {Ico.check(14)} Accept
                        </button>
                        {user.status === 'pending' && (
                          <button className="ma-card-action-btn ma-action-reject" onClick={() => handleReject(uId, user.name)}>
                            {Ico.x(14)} Reject
                          </button>
                        )}
                        <button className="ma-card-action-btn ma-action-delete" onClick={() => handleDelete(uId, user.name)}>
                          {Ico.trash(14)}
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
            <div style={{ height: 24 }} />
          </main>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: LAB ORDERS
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'orders' && (
        <>
          {/* Search Bar */}
          <div className="ma-search-wrap">
            <div className="ma-search-bar">
              {Ico.search(14)}
              <input type="text" className="ma-search-input" placeholder="Search patient, case ID, dentist..."
                value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              {orderSearch && (
                <button className="ma-search-clear" onClick={() => setOrderSearch('')}>
                  {Ico.x(12)}
                </button>
              )}
            </div>
          </div>

          {/* Filter Status Chips */}
          <div className="ma-tabs-wrap">
            <div className="ma-tabs">
              {ORDER_TABS.map(st => (
                <button key={st}
                  className={`ma-tab ${orderFilter === st ? 'ma-tab--active' : ''}`}
                  onClick={() => setOrderFilter(st)}>
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>

          <main className="ma-main">
            {loadingOrders ? (
              <div className="ma-loading">
                {[1, 2, 3].map(i => <div key={i} className="ma-skeleton-card" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="ma-empty">
                {Ico.orders(48)}
                <p>No lab orders found.</p>
              </div>
            ) : (
              <div className="ma-order-list">
                {filteredOrders.map(o => (
                  <div key={o._id} className="ma-card" onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                    <div className="ma-card-top">
                      <div>
                        <span className="ma-card-title">{o.patientName}</span>
                        <div className="ma-card-sub">
                          <span>{o.owner?.name || o.dentistName || '—'}</span>
                          {o.serviceType && <span> · {o.serviceType}</span>}
                        </div>
                      </div>
                      <span className="ma-case-badge">{o.caseId}</span>
                    </div>

                    <div className="ma-card-meta-row">
                      <span className={`ma-pill ma-pill--status-${(o.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.status}
                      </span>
                      <span className={`ma-pill ma-pill--pay-${(o.paymentStatus || 'pending').toLowerCase()}`}>
                        {o.paymentStatus || 'Pending'}
                        {o.paymentStatus === 'Paid' && o.paymentMode ? ` · ${o.paymentMode}` : ''}
                      </span>
                      {o.amount > 0 && (
                        <span className="ma-card-amount">{formatINR(o.amount)}</span>
                      )}
                    </div>

                    {o.paymentStatus === 'Paid' && o.referenceNumber && (
                      <div className="ma-ref-line">
                        Ref: {o.referenceNumber}
                      </div>
                    )}

                    <div className="ma-card-date">
                      {Ico.clock(11)}
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 24 }} />
          </main>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 3: PAYMENTS & BILLING
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'payments' && (
        <>
          {/* Summary Metrics (NO side colored lines) */}
          {paymentData.summary && (
            <div className="ma-pay-metrics-grid">
              <div className="ma-pay-metric-box">
                <span className="ma-pay-metric-lbl">Total Billed</span>
                <span className="ma-pay-metric-val">{formatINR(paymentData.summary.totalBilled)}</span>
              </div>
              <div className="ma-pay-metric-box">
                <span className="ma-pay-metric-lbl">Collected</span>
                <span className="ma-pay-metric-val ma-val--green">{formatINR(paymentData.summary.totalCollected)}</span>
              </div>
              <div className="ma-pay-metric-box">
                <span className="ma-pay-metric-lbl">Pending</span>
                <span className="ma-pay-metric-val ma-val--amber">{formatINR(paymentData.summary.totalPending)}</span>
              </div>
              <div className="ma-pay-metric-box">
                <span className="ma-pay-metric-lbl">By Mode</span>
                <div className="ma-pay-mode-tags">
                  <span className="ma-pay-mode-tag ma-mode--cash">Cash {formatINR(paymentData.summary.byMode?.Cash || 0)}</span>
                  <span className="ma-pay-mode-tag ma-mode--cheque">Cheque {formatINR(paymentData.summary.byMode?.Cheque || 0)}</span>
                  <span className="ma-pay-mode-tag ma-mode--upi">UPI {formatINR(paymentData.summary.byMode?.UPI || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Status Pills */}
          <div className="ma-tabs-wrap">
            <div className="ma-tabs">
              {PAY_STATUS_TABS.map(st => (
                <button key={st}
                  className={`ma-tab ${payFilterStatus === st ? 'ma-tab--active' : ''}`}
                  onClick={() => setPayFilterStatus(st)}>
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
            <div className="ma-tabs">
              {PAY_MODE_TABS.map(m => (
                <button key={m}
                  className={`ma-tab ${payFilterMode === m ? 'ma-tab--active' : ''}`}
                  onClick={() => setPayFilterMode(m)}>
                  {m === 'all' ? 'All Modes' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="ma-search-wrap">
            <div className="ma-search-bar">
              {Ico.search(14)}
              <input type="text" className="ma-search-input" placeholder="Search patient, case ID, dentist..."
                value={paySearch} onChange={e => setPaySearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchPayments()} />
              {paySearch && (
                <button className="ma-search-clear" onClick={() => { setPaySearch(''); fetchPayments(); }}>
                  {Ico.x(12)}
                </button>
              )}
            </div>
          </div>

          {/* Payments List */}
          <main className="ma-main">
            {loadingPayments ? (
              <div className="ma-loading">
                {[1, 2, 3].map(i => <div key={i} className="ma-skeleton-card" />)}
              </div>
            ) : (paymentData.payments || []).length === 0 ? (
              <div className="ma-empty">
                {Ico.wallet(48)}
                <p>No payment records found.</p>
              </div>
            ) : (
              <div className="ma-pay-list">
                {paymentData.payments.map(p => (
                  <div key={p._id} className="ma-card" onClick={() => setSelectedPayment(p)} style={{ cursor: 'pointer' }}>
                    <div className="ma-card-top">
                      <div>
                        <span className="ma-card-title">{p.patientName}</span>
                        <div className="ma-card-sub">
                          {p.owner?.name || '—'}{p.owner?.clinicName ? ` · ${p.owner.clinicName}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="ma-case-badge">{p.caseId}</span>
                        <div className="ma-card-amount-lg">
                          {p.amount > 0 ? (
                            formatINR(p.amount)
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(p);
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px dashed #1e5038',
                                background: '#f0fdf4',
                                color: '#1e5038',
                                cursor: 'pointer',
                                fontWeight: 600,
                                marginTop: '3px',
                              }}
                            >
                              + Add Amount
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ma-card-meta-row">
                      <span className={`ma-pill ma-pill--pay-${(p.paymentStatus || 'pending').toLowerCase()}`}>
                        {p.paymentStatus || 'Pending'}
                      </span>
                      {p.paymentStatus === 'Paid' && p.paymentMode && (
                        <span className={`ma-pay-mode-tag ma-mode--${(p.paymentMode || '').toLowerCase()}`}>
                          {p.paymentMode}
                        </span>
                      )}
                      {p.paymentStatus === 'Paid' && p.referenceNumber && (
                        <span className="ma-ref-line">Ref: {p.referenceNumber}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ma-card-actions" onClick={e => e.stopPropagation()}>
                      {p.paymentStatus === 'Paid' ? (
                        <button className="ma-card-action-btn ma-action-revert"
                          onClick={() => handleRevertPayment(p._id)}
                          disabled={actionLoading === p._id + '_payment'}>
                          {actionLoading === p._id + '_payment' ? '...' : 'Mark Pending'}
                        </button>
                      ) : (
                        <button className="ma-card-action-btn ma-action-pay"
                          onClick={() => openRecordPayment(p)}>
                          {Ico.check(13)} Record Payment
                        </button>
                      )}
                      {p.paymentStatus !== 'Paid' && (
                        <button className="ma-card-action-btn ma-action-remind"
                          onClick={() => handleSendReminder(p._id)}
                          disabled={actionLoading === p._id + '_remind'}>
                          {actionLoading === p._id + '_remind' ? '...' : 'Remind'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 24 }} />
          </main>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          APP BOTTOM NAVIGATION BAR: Dentists | Lab Orders | Payments
          ───────────────────────────────────────────────────────────── */}
      <div className="ma-bottom-nav">
        {ADMIN_NAV.map((item) => {
          const isActive = adminView === item.key;
          return (
            <button
              key={item.key}
              className={`ma-bnav-btn ${isActive ? 'ma-bnav-btn--active' : ''}`}
              onClick={() => setAdminView(item.key)}
            >
              <div className="ma-bnav-icon-wrap">
                {item.icon(20)}
                {item.key === 'dentists' && stats.pending > 0 && (
                  <span className="ma-bnav-badge ma-bnav-badge--pending">
                    {stats.pending}
                  </span>
                )}
                {item.key === 'payments' && (paymentData.summary?.pendingCount || 0) > 0 && (
                  <span className="ma-bnav-badge ma-bnav-badge--pending">
                    {paymentData.summary.pendingCount}
                  </span>
                )}
              </div>
              <span className="ma-bnav-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RECORD PAYMENT MODAL (Mobile Bottom Sheet / Dialog)
          ───────────────────────────────────────────────────────────── */}
      {payModal && (
        <div className="ma-modal-overlay" onClick={() => setPayModal(null)}>
          <div className="ma-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="ma-modal-header">
              <h3>Record Payment</h3>
              <button className="ma-modal-close" onClick={() => setPayModal(null)}>
                {Ico.x(16)}
              </button>
            </div>

            <div className="ma-modal-info">
              <div><strong>Case:</strong> {payModal.caseId}</div>
              <div><strong>Patient:</strong> {payModal.patientName}</div>
              {payModal.owner?.name && <div><strong>Dentist:</strong> {payModal.owner.name}</div>}
            </div>

            {/* Mode Switcher */}
            <div className="ma-modal-mode-toggle">
              {['Cash', 'Cheque', 'UPI'].map(m => (
                <button
                  key={m}
                  className={`ma-modal-mode-btn ${payForm.mode === m ? 'active' : ''}`}
                  onClick={() => { setPayForm(f => ({ ...f, mode: m, referenceNumber: '' })); setPayFormError(''); }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="ma-modal-field">
              <label>Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>

            {/* Conditional Mode Fields */}
            {payForm.mode === 'Cheque' && (
              <div className="ma-modal-field">
                <label>Cheque Number *</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-650124"
                  value={payForm.referenceNumber}
                  onChange={e => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
            )}
            {payForm.mode === 'UPI' && (
              <div className="ma-modal-field">
                <label>UPI Transaction ID / UTR *</label>
                <input
                  type="text"
                  placeholder="e.g. 428190382910"
                  value={payForm.referenceNumber}
                  onChange={e => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
            )}
            {payForm.mode === 'Cash' && (
              <div className="ma-modal-field">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received at reception"
                  value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            )}

            {payFormError && <div className="ma-modal-error">{payFormError}</div>}

            <div className="ma-modal-actions">
              <button className="ma-modal-btn-cancel" onClick={() => setPayModal(null)}>
                Cancel
              </button>
              <button
                className="ma-modal-btn-confirm"
                onClick={handleRecordPayment}
                disabled={payFormSaving}
              >
                {payFormSaving ? 'Saving…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          onDeleteUser={() => { fetchUsers(); fetchStats(); }}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
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
          isOpen={!!selectedPayment}
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
    </div>
  );
};

export default MobileAdminDashboard;
