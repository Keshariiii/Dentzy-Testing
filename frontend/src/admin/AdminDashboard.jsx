'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import DentistDetailModal from './DentistDetailModal';
import OrderDetailModal from '../components/OrderDetailModal';
import PaymentDetailModal from '../components/PaymentDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import StaffManagementView from './StaffManagementView';
import './AdminDashboard.css';
import { formatINR } from '../utils/format';
import TwentyFirstNoticeBar from '../components/ui/twentyfirst-notice-bar';
import TwentyFirstNavCard from '../components/ui/twentyfirst-nav-card';
import TwentyFirstNoticeList from '../components/ui/twentyfirst-notice-list';
const dentzyLogo = '/dentzy-logo-v2.png';

import { Icons as Ico } from '../components/common/DashboardIcons';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'badge-pending' },
  approved: { label: 'Approved', cls: 'badge-approved' },
  rejected: { label: 'Rejected', cls: 'badge-rejected' },
};

const AdminDashboard = () => {
  const router = useRouter();
  const { admin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [adminView, setAdminView] = useState('dentists'); // 'dentists' | 'staff' | 'settings'
  const [dentistSubView, setDentistSubView] = useState('users'); // 'users' | 'orders' | 'payments'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [liveNotifs, setLiveNotifs] = useState([]);
  const [visiblePw, setVisiblePw] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  // Payments view state
  const [paymentData, setPaymentData] = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode] = useState('all');
  const [paySearch, setPaySearch] = useState('');
  // Record Payment modal state
  const [payModal, setPayModal] = useState(null); // { orderId, caseId, patientName, amount, ... }
  const [payForm, setPayForm] = useState({ mode: 'Cash', referenceNumber: '', amount: '', notes: '' });
  const [payFormError, setPayFormError] = useState('');
  const [payFormSaving, setPayFormSaving] = useState(false);
  // Order & Payment detail modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  // Drill-down state for dentist-centric views
  const [drillDentistOrders, setDrillDentistOrders] = useState(null);
  const [drillDentistPayments, setDrillDentistPayments] = useState(null);
  const [settingsSubView, setSettingsSubView] = useState(null); // null | 'notice' | 'payments' | 'users' | 'account'
  // Notice bar settings state
  const [noticeEnabled, setNoticeEnabled] = useState(true);
  const [noticeMessages, setNoticeMessages] = useState([]);
  const [noticeNewMsg, setNoticeNewMsg] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeLoaded, setNoticeLoaded] = useState(false);
  // Staff view state
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const sseRef = useRef(null);
  const toastTimerRef = useRef(null);
  const prevAdminViewRef = useRef('dentists');

  useEffect(() => {
    if (adminView !== 'settings') {
      prevAdminViewRef.current = adminView;
    }
  }, [adminView]);

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
    } catch { }
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
    } catch { }
    setLoadingPayments(false);
  }, [ADMIN_API, payFilterStatus, payFilterMode, paySearch]);

  /* ── Notice bar fetch ───────────────────────────────────────────────── */
  const fetchNotice = useCallback(async () => {
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/settings/notice`);
      if (res.ok) {
        const d = await res.json();
        setNoticeEnabled(d.enabled !== false);
        setNoticeMessages(d.messages || []);
        setNoticeLoaded(true);
      }
    } catch { }
  }, [ADMIN_API]);

  const handleNoticeSave = useCallback(async () => {
    setNoticeSaving(true);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/settings/notice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: noticeEnabled, messages: noticeMessages }),
      });
      if (res.ok) {
        showToast('Notice bar updated.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to save.', 'error');
      }
    } catch {
      showToast('Failed to save notice.', 'error');
    }
    setNoticeSaving(false);
  }, [ADMIN_API, noticeEnabled, noticeMessages]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { }
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
    } catch { }
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
          } catch { }
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


  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff`);
      if (res.ok) { const d = await res.json(); setStaffList(d.staff || []); }
    } catch {}
    setLoadingStaff(false);
  }, [authFetch, ADMIN_API]);

  const filteredUsers = (users || []).filter(u =>
    (u?.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (u?.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  // ponytail: group orders/payments by dentist client-side
  const dentistOrderGroups = React.useMemo(() => {
    const map = {};
    (allOrders || []).forEach(o => {
      const id = o.owner?._id || o.ownerId || 'unknown';
      if (!map[id]) map[id] = { _id: id, name: o.owner?.name || o.dentistName || 'Unknown', clinicName: o.owner?.clinicName || '', orders: [] };
      map[id].orders.push(o);
    });
    return Object.values(map).sort((a, b) => b.orders.length - a.orders.length);
  }, [allOrders]);

  const dentistPaymentGroups = React.useMemo(() => {
    const map = {};
    (paymentData.payments || []).forEach(p => {
      const id = p.ownerId || p.owner?._id || 'unknown';
      if (!map[id]) map[id] = { _id: id, name: p.owner?.name || 'Unknown', clinicName: p.owner?.clinicName || '', payments: [], totalBilled: 0, totalCollected: 0, totalPending: 0 };
      map[id].payments.push(p);
      map[id].totalBilled += (p.amount || 0);
      if (p.paymentStatus === 'Paid') map[id].totalCollected += (p.amount || 0);
      else map[id].totalPending += (p.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [paymentData.payments]);

  const filteredOrdersForDrill = React.useMemo(() => {
    if (!drillDentistOrders) return [];
    return (allOrders || []).filter(o => (o.owner?._id || o.ownerId) === drillDentistOrders._id);
  }, [allOrders, drillDentistOrders]);

  const filteredPaymentsForDrill = React.useMemo(() => {
    if (!drillDentistPayments) return [];
    return (paymentData.payments || []).filter(p => {
      const id = p.ownerId || p.owner?._id;
      if (id !== drillDentistPayments._id) return false;
      if (payFilterStatus !== 'all' && p.paymentStatus !== payFilterStatus) return false;
      if (payFilterMode !== 'all' && p.paymentMode !== payFilterMode) return false;
      return true;
    });
  }, [paymentData.payments, drillDentistPayments, payFilterStatus, payFilterMode]);

  const adminName = admin?.username || 'Admin';
  const initials = (adminName || 'AD').slice(0, 2).toUpperCase();

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
        <button
          type="button"
          onClick={() => {
            setAdminView('settings');
            fetchStatsRef.current?.();
            fetchPaymentsRef.current?.();
          }}
          aria-label="Go to Settings"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className="ad-header-logo">
            <img src={dentzyLogo} alt="Dentzy" className="ad-logo-img" />
          </div>
        </button>

        {/* Search */}
        <div className="ad-header-search">
          <span className="ad-search-icon">{Ico.search(14)}</span>
          <input
            type="text"
            className="ad-search"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Admin info */}
        <button
          type="button"
          className="ad-header-user"
          onClick={() => {
            setAdminView('settings');
            fetchStatsRef.current?.();
            fetchPaymentsRef.current?.();
          }}
          aria-label="Admin Profile Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div className="ad-header-user-details">
            <span className="ad-header-admin-name">{adminName}</span>
            <span className="ad-header-admin-role">
              <span className="ad-live-dot" />
              Admin
            </span>
          </div>
          <div className="ad-header-avatar">{initials}</div>
        </button>
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
              <button className={`ad-nav-item ${adminView === 'dentists' ? 'active' : ''}`} onClick={() => setAdminView('dentists')} aria-label="Dentist">
                <span className="ad-nav-icon">{Ico.grid(16)}</span>
                Dentist
              </button>
              <button className={`ad-nav-item ${adminView === 'staff' ? 'active' : ''}`} onClick={() => { setAdminView('staff'); fetchStaff(); }} aria-label="Staff">
                <span className="ad-nav-icon">{Ico.usersS ? Ico.usersS(16) : Ico.grid(16)}</span>
                Staff
              </button>
              <button className={`ad-nav-item ${adminView === 'settings' ? 'active' : ''}`} onClick={() => { setAdminView('settings'); setSettingsSubView(null); fetchStatsRef.current?.(); fetchPaymentsRef.current?.(); }} aria-label="Settings">
                <span className="ad-nav-icon">{Ico.settings(16)}</span>
                Settings
              </button>
            </nav>


          </div>

          {/* Logout — mirrors ud-logout */}
          <button id="admin-logout-btn" className="ad-logout" onClick={handleLogout}>
            {Ico.logout(15)} Logout
          </button>
        </aside>

        {/* ── MAIN (mirrors ud-main) ───────────────────────────────────────── */}
        <main className="ad-main">
          <div className="ad-content-inner">





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

            {/* ── Dentist Sub-Nav ─────────────────────────────── */}
            {adminView === 'dentists' && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 0', marginBottom: '16px' }}>
                {[
                  { key: 'users', label: 'Dentists' },
                  { key: 'orders', label: 'Lab Orders' },
                  { key: 'payments', label: 'Payments' },
                ].map(sub => (
                  <button key={sub.key}
                    onClick={() => {
                      setDentistSubView(sub.key);
                      if (sub.key === 'orders') fetchAllOrders();
                      if (sub.key === 'payments') fetchPaymentsRef.current?.();
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: dentistSubView === sub.key ? '#1e5038' : '#f0f7f3',
                      color: dentistSubView === sub.key ? '#fff' : '#4a7060',
                      fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s ease',
                    }}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {adminView === 'dentists' && dentistSubView === 'payments' ? (
              /* ── Payments View ────────────────────────────────────────── */
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        if (drillDentistPayments) {
                          setDrillDentistPayments(null);
                          setPayFilterStatus('all');
                          setPayFilterMode('all');
                        } else {
                          setAdminView('users');
                        }
                      }}
                      title={drillDentistPayments ? "Back to All Payments" : "Back to Dentists"}
                      style={{ background: '#e2ece6', borderRadius: '8px', width: '34px', height: '34px', border: 'none', cursor: 'pointer', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {Ico.arrowLeft ? Ico.arrowLeft(18) : '←'}
                    </button>
                    <p className="ad-section-title" style={{ margin: 0 }}>
                      {drillDentistPayments ? (
                        `${drillDentistPayments.name}${drillDentistPayments.clinicName ? ` · ${drillDentistPayments.clinicName}` : ''}`
                      ) : 'Payments & Billing'}
                    </p>
                  </div>
                  <button onClick={() => fetchPaymentsRef.current?.()} style={{ fontSize: '0.78rem', color: '#1e5038', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>↻ Refresh</button>
                </div>



                {drillDentistPayments && (
                  <div className="ad-pay-filters">
                    <div className="ad-pay-filter-group">
                      {['all', 'Paid', 'Pending'].map(s => (
                        <button key={s} className={`ad-pay-filter-btn ${payFilterStatus === s ? 'active' : ''}`} onClick={() => setPayFilterStatus(s)}>
                          {s === 'all' ? 'All' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ad-content">
                  {loadingPayments ? (
                    <div className="ad-loading"><div className="ad-skeleton-list">{[1, 2, 3].map(i => <div key={i} className="ad-skeleton-card" />)}</div></div>
                  ) : drillDentistPayments ? (
                    /* Drill-down: single dentist's payment table */
                    filteredPaymentsForDrill.length === 0 ? (
                      <div className="ad-empty">{Ico.wallet(48)}<p>No payment records found.</p></div>
                    ) : (
                      <div className="ud-table-wrap" style={{ overflowX: 'auto' }}>
                        <table className="ud-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead><tr style={{ background: 'var(--surface, #f0f7f3)' }}>
                            {['Case ID', 'Patient', 'Amount', 'Status', 'Mode & Ref', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#4a7060', borderBottom: '2px solid var(--border, #e2ece6)' }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {filteredPaymentsForDrill.map((p, i) => (
                              <tr key={p._id} onClick={() => setSelectedPayment(p)} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface, #f8faf9)', borderBottom: '1px solid var(--border, #e2ece6)', cursor: 'pointer' }}>
                                <td style={{ padding: '10px 12px' }}><code style={{ fontSize: '0.78rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{p.caseId}</code></td>
                                <td style={{ padding: '10px 12px' }}><strong>{p.patientName}</strong></td>
                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatINR(p.amount || 0)}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
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
                    )
                  ) : (
                    /* Dentist cards overview for payments */
                    dentistPaymentGroups.length === 0 ? (
                      <div className="ad-empty">{Ico.wallet(48)}<p>No payment records found.</p></div>
                    ) : (
                      <div className="ad-user-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dentistPaymentGroups.map(d => {
                          const unpaid = d.payments.filter(p => p.paymentStatus !== 'Paid').length;
                          return (
                            <div key={d._id} className="ad-user-card" onClick={() => setDrillDentistPayments(d)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="ad-avatar">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                                <div className="ad-user-info">
                                  <div className="ad-user-name">{d.name}</div>
                                  {d.clinicName && <div className="ad-user-email">{d.clinicName}</div>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>Billed {formatINR(d.totalBilled)}</span>
                                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Collected {formatINR(d.totalCollected)}</span>
                                  {d.totalPending > 0 && <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#92400e' }}>Pending {formatINR(d.totalPending)}</span>}
                                  {unpaid > 0 && <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>{unpaid} Unpaid</span>}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e5038', whiteSpace: 'nowrap' }}>{d.payments.length} Cases ›</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : adminView === 'dentists' && dentistSubView === 'orders' ? (
              /* ── Lab Orders View ───────────────────────────────────────── */
              <div>
                <div className="ad-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        if (drillDentistOrders) {
                          setDrillDentistOrders(null);
                        } else {
                          setAdminView('users');
                        }
                      }}
                      title={drillDentistOrders ? "Back to All Lab Orders" : "Back to Dentists"}
                      style={{ background: '#e2ece6', borderRadius: '8px', width: '34px', height: '34px', border: 'none', cursor: 'pointer', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {Ico.arrowLeft ? Ico.arrowLeft(18) : '←'}
                    </button>
                    <p className="ad-section-title" style={{ margin: 0 }}>
                      {drillDentistOrders ? (
                        `${drillDentistOrders.name}${drillDentistOrders.clinicName ? ` · ${drillDentistOrders.clinicName}` : ''}`
                      ) : 'Lab Orders'}
                    </p>
                  </div>
                  <button onClick={fetchAllOrders} style={{ fontSize: '0.78rem', color: '#1e5038', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>↻ Refresh</button>
                </div>
                <div className="ad-content">
                  {loadingOrders ? (
                    <div className="ad-loading"><div className="ad-skeleton-list">{[1, 2, 3].map(i => <div key={i} className="ad-skeleton-card" />)}</div></div>
                  ) : drillDentistOrders ? (
                    /* Drill-down: single dentist's orders table */
                    filteredOrdersForDrill.length === 0 ? (
                      <div className="ad-empty">{Ico.chart(48)}<p>No orders for this dentist.</p></div>
                    ) : (
                      <div className="ud-table-wrap" style={{ overflowX: 'auto' }}>
                        <table className="ud-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead><tr style={{ background: 'var(--surface, #f0f7f3)' }}>
                            {['Patient', 'Case ID', 'Service', 'Status', 'Payment', 'Amount', 'Created'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#4a7060', borderBottom: '2px solid var(--border, #e2ece6)' }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {filteredOrdersForDrill.map((o, i) => (
                              <tr key={o._id} onClick={() => setSelectedOrder(o)} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface, #f8faf9)', borderBottom: '1px solid var(--border, #e2ece6)', cursor: 'pointer' }}>
                                <td style={{ padding: '10px 12px' }}><strong>{o.patientName}</strong></td>
                                <td style={{ padding: '10px 12px' }}><code style={{ fontSize: '0.78rem', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{o.caseId}</code></td>
                                <td style={{ padding: '10px 12px' }}>{o.serviceType}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                    background: o.status === 'Completed' ? '#dcfce7' : o.status === 'In Progress' ? '#dbeafe' : o.status === 'Cancelled' ? '#fee2e2' : '#fef9c3',
                                    color: o.status === 'Completed' ? '#16a34a' : o.status === 'In Progress' ? '#1d4ed8' : o.status === 'Cancelled' ? '#dc2626' : '#92400e',
                                  }}>{o.status}</span>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                    background: (o.paymentStatus || 'Pending') === 'Paid' ? '#dcfce7' : '#fef9c3',
                                    color: (o.paymentStatus || 'Pending') === 'Paid' ? '#16a34a' : '#92400e',
                                  }}>{o.paymentStatus || 'Pending'}</span>
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatINR(o.paymentAmount || o.amount || 0)}</td>
                                <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.78rem' }}>
                                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    /* Dentist cards overview */
                    dentistOrderGroups.length === 0 ? (
                      <div className="ad-empty">{Ico.chart(48)}<p>No lab orders found.</p></div>
                    ) : (
                      <div className="ad-user-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dentistOrderGroups.map(d => {
                          const inProgress = d.orders.filter(o => o.status === 'In Progress').length;
                          const pending = d.orders.filter(o => o.status === 'Pending').length;
                          const completed = d.orders.filter(o => o.status === 'Completed').length;
                          return (
                            <div key={d._id} className="ad-user-card" onClick={() => setDrillDentistOrders(d)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="ad-avatar">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                                <div className="ad-user-info">
                                  <div className="ad-user-name">{d.name}</div>
                                  {d.clinicName && <div className="ad-user-email">{d.clinicName}</div>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {inProgress > 0 && <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>{inProgress} In Progress</span>}
                                  {pending > 0 && <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#fef9c3', color: '#92400e' }}>{pending} Pending</span>}
                                  {completed > 0 && <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>{completed} Completed</span>}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e5038', whiteSpace: 'nowrap' }}>{d.orders.length} Orders ›</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : adminView === 'dentists' && dentistSubView === 'users' ? (
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
                        {[1, 2, 3, 4].map(i => <div key={i} className="ad-skeleton-card" />)}
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
            ) : adminView === 'staff' ? (
              /* ── Staff Management View ─────────────────────────────── */
              <StaffManagementView
                authFetch={authFetch}
                ADMIN_API={ADMIN_API}
                showToast={showToast}
                staffList={staffList}
                loadingStaff={loadingStaff}
                staffSearch={staffSearch}
                setStaffSearch={setStaffSearch}
                fetchStaff={fetchStaff}
                setStaffList={setStaffList}
                Ico={Ico}
                setConfirmConfig={setConfirmConfig}
              />
            ) : adminView === 'settings' ? (
              /* ── Settings View (Sub-view Architecture) ───────────────── */
              <div style={{ padding: '28px 20px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>

                {/* Sub-view Landing Grid (when settingsSubView === null) */}
                {!settingsSubView ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                      <button
                        type="button"
                        onClick={() => setAdminView(prevAdminViewRef.current || 'dentists')}
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                        style={{
                          background: '#e2ece6',
                          borderRadius: '10px',
                          width: '38px',
                          height: '38px',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#1e5038',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#d0e4d7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#e2ece6'; }}
                      >
                        {Ico.arrowLeft ? Ico.arrowLeft(20) : '←'}
                      </button>
                      <div className="ad-section-header" style={{ marginBottom: 0 }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a3028', margin: 0 }}>Settings & Analytics</h2>
                        <p style={{ color: '#6b8a7a', fontSize: '0.85rem', margin: '4px 0 0' }}>Select a portal management card below to configure options or view analytics.</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
                      <TwentyFirstNavCard
                        label="Dentist Portal Notice Bar"
                        desc="Manage scrolling announcements visible to all dentists"
                        icon={Ico.bell ? Ico.bell(22) : Ico.grid(22)}
                        onClick={() => {
                          setSettingsSubView('notice');
                          if (!noticeLoaded) fetchNotice();
                        }}
                      />
                      <TwentyFirstNavCard
                        label="Payment & Revenue Overview"
                        desc="View total billed, collected, and pending revenue statistics"
                        icon={Ico.payments ? Ico.payments(22) : Ico.wallet(22)}
                        onClick={() => setSettingsSubView('payments')}
                      />
                      <TwentyFirstNavCard
                        label="User Accounts Overview"
                        desc="Track registered, approved, pending, and rejected dentist accounts"
                        icon={Ico.usersS ? Ico.usersS(22) : Ico.users(22)}
                        onClick={() => setSettingsSubView('users')}
                      />
                      <TwentyFirstNavCard
                        label="Administrator Account"
                        desc="View active session, security options, and account logout"
                        icon={Ico.user ? Ico.user(22) : Ico.settings(22)}
                        onClick={() => setSettingsSubView('account')}
                      />
                    </div>
                  </>
                ) : (
                  /* Sub-Page Content Views */
                  <div>
                    {/* Common Sub-Page Header with Back Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                      <button
                        type="button"
                        onClick={() => setSettingsSubView(null)}
                        title="Back to Settings"
                        aria-label="Back to Settings"
                        style={{ background: '#e2ece6', borderRadius: '10px', width: '38px', height: '38px', border: 'none', cursor: 'pointer', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#d0e4d7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#e2ece6'; }}
                      >
                        {Ico.arrowLeft ? Ico.arrowLeft(20) : '←'}
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3028', margin: 0 }}>
                          {settingsSubView === 'notice' && 'Dentist Portal Notice Bar'}
                          {settingsSubView === 'payments' && 'Payment & Revenue Overview'}
                          {settingsSubView === 'users' && 'User Accounts Overview'}
                          {settingsSubView === 'account' && 'Administrator Account'}
                        </h2>
                        <p style={{ color: '#6b8a7a', fontSize: '0.82rem', margin: '2px 0 0' }}>Settings & Analytics / Sub-view</p>
                      </div>
                    </div>

                    {/* Sub-Page 1: Notice Bar Manager */}
                    {settingsSubView === 'notice' && (
                      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        {/* Master Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px 20px', background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>Show Notice Bar to Dentists</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b8a7a', marginTop: '2px' }}>When disabled, the announcement ticker is hidden across all dentist dashboards</div>
                          </div>
                          <button
                            onClick={() => setNoticeEnabled(v => !v)}
                            style={{
                              width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative',
                              background: noticeEnabled ? '#22c55e' : '#d1d5db', transition: 'background 0.2s',
                            }}
                            aria-label="Toggle notice bar"
                          >
                            <span style={{
                              position: 'absolute', top: '3px', left: noticeEnabled ? '27px' : '3px',
                              width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                            }} />
                          </button>
                        </div>

                        {/* Live Preview */}
                        {noticeMessages.length > 0 && (
                          <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Live Preview</div>
                            <div style={{ opacity: noticeEnabled ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: noticeEnabled ? 'auto' : 'none' }}>
                              <TwentyFirstNoticeBar messages={noticeMessages} />
                            </div>
                          </div>
                        )}

                        {/* Add New Message */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                          <input
                            type="text"
                            value={noticeNewMsg}
                            onChange={e => setNoticeNewMsg(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && noticeNewMsg.trim()) {
                                setNoticeMessages(prev => [...prev, noticeNewMsg.trim()]);
                                setNoticeNewMsg('');
                              }
                            }}
                            placeholder="Type a new announcement message..."
                            maxLength={250}
                            style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1px solid #d4ddd8', fontSize: '0.88rem', outline: 'none' }}
                          />
                          <button
                            disabled={!noticeNewMsg.trim()}
                            onClick={() => { setNoticeMessages(prev => [...prev, noticeNewMsg.trim()]); setNoticeNewMsg(''); }}
                            style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: noticeNewMsg.trim() ? '#1e5038' : '#d4ddd8', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: noticeNewMsg.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                          >
                            + Add Message
                          </button>
                        </div>

                        {/* Draggable Reorderable List (21st.dev) */}
                        <div style={{ marginBottom: '24px' }}>
                          <TwentyFirstNoticeList
                            messages={noticeMessages}
                            onChange={setNoticeMessages}
                          />
                        </div>

                        {/* Action Footer */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #edf2ef' }}>
                          <button
                            onClick={() => {
                              setNoticeMessages([
                                'Welcome to Dentzy Clinical Lab Portal',
                                'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
                                'New: Zirconia monolithic crowns with multi-shade gradients now available',
                                'Submit STL files for faster digital impression processing',
                                'Invoices are generated upon case dispatch — check the Payments tab',
                                'All cases backed by the Dentzy 1-Year Quality Guarantee',
                                'Lab support: Mon-Sat, 9 AM to 6 PM IST',
                              ]);
                              setNoticeEnabled(true);
                            }}
                            style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #d4ddd8', background: '#fff', color: '#6b8a7a', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                          >
                            Reset to Defaults
                          </button>
                          <button
                            onClick={handleNoticeSave}
                            disabled={noticeSaving}
                            style={{ padding: '10px 26px', borderRadius: '12px', border: 'none', background: '#1e5038', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: noticeSaving ? 'default' : 'pointer', opacity: noticeSaving ? 0.7 : 1 }}
                          >
                            {noticeSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sub-Page 2: Payments & Revenue Analytics */}
                    {settingsSubView === 'payments' && (
                      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Billed</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a3028', marginTop: '8px' }}>
                              {formatINR(paymentData.summary?.totalBilled || 0)}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collected</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', marginTop: '8px' }}>
                              {formatINR(paymentData.summary?.totalCollected || 0)}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '8px' }}>
                              {formatINR(paymentData.summary?.totalPending || 0)}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Records</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e5038', marginTop: '8px' }}>
                              {paymentData.summary?.totalPayments || paymentData.payments?.length || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Page 3: User Accounts Overview */}
                    {settingsSubView === 'users' && (
                      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a3028', marginTop: '8px' }}>
                              {stats.total || 0}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Accounts</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', marginTop: '8px' }}>
                              {stats.approved || 0}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approval</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '8px' }}>
                              {stats.pending || 0}
                            </div>
                          </div>
                          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejected</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
                              {stats.rejected || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Page 4: Administrator Account */}
                    {settingsSubView === 'account' && (
                      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a3028' }}>Administrator Account</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b8a7a', marginTop: '4px' }}>Logged in as <strong style={{ color: '#1e5038' }}>{admin?.username || 'admin'}</strong></div>
                        </div>
                        <button
                          className="ad-logout"
                          onClick={handleLogout}
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {Ico.logout(16)} Logout
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ) : null}

          </div>{/* /ad-content-inner */}
        </main>

      </div>{/* /ad-body */}

      {/* Toast */}
      {toast && (
        <div className={`ad-toast ${toast.type === 'error' ? 'ad-toast-error' : 'ad-toast-success'}`} role="alert">
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
