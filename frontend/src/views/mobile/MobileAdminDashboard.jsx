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
import EmptyState from '../../components/common/EmptyState';
import StaffManagementView from '../../admin/StaffManagementView';
import { formatINR, formatDate } from '../../utils/format';
import './MobileAdminDashboard.css';

import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstSegmentedTabs } from '../../components/ui/twentyfirst-segmented-tabs';
import { TwentyFirstBadge } from '../../components/ui/twentyfirst-badge';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import { TwentyFirstNavCard } from '../../components/ui/twentyfirst-nav-card';
import TwentyFirstNoticeBar from '../../components/ui/twentyfirst-notice-bar';

const DENTIST_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const ORDER_TABS = ['all', 'In Progress', 'Pending', 'Completed', 'Cancelled'];
const PAY_STATUS_TABS = ['all', 'Paid', 'Pending'];
const PAY_MODE_TABS = ['all', 'Cash', 'Cheque', 'UPI'];

/* ponytail: ADMIN_NAV_ITEMS feeds TwentyFirstBottomNav -- badge is dynamic via stats.pending */
const ADMIN_NAV_BASE = [
  { key: 'dentists', label: 'Dentists', icon: () => Ico.usersS(20) },
  { key: 'staff',    label: 'Staff',    icon: () => Ico.user(20)   },
  { key: 'settings', label: 'Settings', icon: () => Ico.settings(20) },
];

/* ============================================================
   HELPERS
============================================================ */
/* #63 — Removed duplicate formatINR. Now imported from ../../utils/format */

/* ============================================================
   COMPONENT
============================================================ */
const MobileAdminDashboard = () => {
  const router = useRouter();
  const { admin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();

  // Primary view: 'dentists' | 'staff' | 'settings'
  const [adminView, setAdminView] = useState('dentists');
  // Dentist sub-view: null (landing) | 'users' | 'orders' | 'payments'
  const [dentistSubView, setDentistSubView] = useState(null);
  // Staff sub-view: null (landing) | 'members' | 'attendance' | 'inventory' | 'metrics'
  const [staffSubView, setStaffSubView] = useState(null);
  // Staff view state
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

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
  const [drillDentistOrders, setDrillDentistOrders] = useState(null); // { _id, name, clinicName }

  // Payments view state
  const [paymentData, setPaymentData]         = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode]     = useState('all');
  const [paySearch, setPaySearch]             = useState('');
  const [drillDentistPayments, setDrillDentistPayments] = useState(null); // { _id, name, clinicName }

  // Record Payment modal state
  const [payModal, setPayModal]         = useState(null);
  const [payForm, setPayForm]           = useState({ mode: 'Cash', referenceNumber: '', amount: '', notes: '' });
  const [payFormError, setPayFormError] = useState('');
  const [payFormSaving, setPayFormSaving] = useState(false);

  // Detail modals
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [expandedMobileSetting, setExpandedMobileSetting] = useState(null); // 'notice' | 'payments' | 'users' | null

  // Notice bar settings state
  const [noticeEnabled, setNoticeEnabled] = useState(true);
  const [noticeMessages, setNoticeMessages] = useState([]);
  const [noticeNewMsg, setNoticeNewMsg] = useState('');
  const [noticeEditIdx, setNoticeEditIdx] = useState(null);
  const [noticeEditVal, setNoticeEditVal] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeLoaded, setNoticeLoaded] = useState(false);

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

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await authFetch(`${ADMIN_API}/staff`);
      if (res.ok) { const d = await res.json(); setStaffList(d.staff || []); }
    } catch {}
    setLoadingStaff(false);
  }, [authFetch, ADMIN_API]);

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

  const fetchNotice = useCallback(async () => {
    try {
      const res = await authFetch(`${ADMIN_API}/settings/notice`);
      if (res.ok) {
        const d = await res.json();
        setNoticeEnabled(d.enabled !== false);
        setNoticeMessages(d.messages || []);
        setNoticeLoaded(true);
      }
    } catch {}
  }, [authFetch, ADMIN_API]);

  const handleNoticeSave = async () => {
    setNoticeSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/settings/notice`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: noticeEnabled, messages: noticeMessages }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: 'Notice bar updated successfully.', type: 'success' });
      } else {
        setToast({ msg: data.message || 'Failed to update notice bar.', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Network error.', type: 'error' });
    }
    setNoticeSaving(false);
  };

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
    if (!admin?.username || (adminView !== 'dentists' || dentistSubView !== 'payments')) return;
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
    if (drillDentistOrders && (o.owner?._id || o.ownerId) !== drillDentistOrders._id) return false;
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

  // ponytail: group orders by dentist client-side, no new endpoint
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

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="ma-shell">
      <MobileHeader
        title={null}
        showLogin={false}
        onLogoClick={() => {
          setAdminView('settings');
          setDentistSubView(null);
          setStaffSubView(null);
          fetchStats();
          fetchPayments();
        }}
        rightElement={
          <button
            type="button"
            className="ma-avatar"
            onClick={() => {
              setAdminView('settings');
              setDentistSubView(null);
              setStaffSubView(null);
              fetchStats();
              fetchPayments();
            }}
            aria-label="Admin Settings"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {initials}
          </button>
        }
      />




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
      {adminView === 'dentists' && !dentistSubView && (
        /* Dentist Landing Page with 3 sub-section cards */
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: '0 0 16px' }}>Dentist Management</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { key: 'users', label: 'Dentists', desc: 'Manage registered dentists', iconFn: () => Ico.usersS(22) },
              { key: 'orders', label: 'Lab Orders', desc: 'Track all lab orders', iconFn: () => Ico.labOrder(22) },
              { key: 'payments', label: 'Payments', desc: 'Billing and payment records', iconFn: () => Ico.payments(22) },
            ].map(card => (
              <TwentyFirstNavCard
                key={card.key}
                label={card.label}
                desc={card.desc}
                icon={card.iconFn()}
                onClick={() => {
                  setDentistSubView(card.key);
                  if (card.key === 'orders') fetchAllOrders();
                  if (card.key === 'payments') fetchPaymentsRef.current?.();
                }}
              />
            ))}
          </div>
        </div>
      )}

      {adminView === 'dentists' && dentistSubView === 'users' && (
        <>
          {/* Back to Dentist landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
            <button onClick={() => setDentistSubView(null)} aria-label="Back"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
          </div>

          {/* #50 -- Section heading with count badge */}
          <div style={{ padding: '0 16px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Registered Dentists
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--dz-color-primary-muted)', color: 'var(--dz-color-primary-dark)', padding: '2px 8px', borderRadius: '12px' }}>
                {stats.total || users.length}
              </span>
            </h2>
          </div>

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

          {/* ── 21st.dev: Segmented Filter Tabs ────────────────────── */}
          <div className="ma-tabs-wrap" style={{ padding: '0 16px', marginBottom: '12px', marginTop: '12px' }}>
            <TwentyFirstSegmentedTabs
              tabs={DENTIST_TABS.map(tab => ({
                key: tab.key,
                label: tab.label,
                count: tab.key !== 'all' ? (stats[tab.key] || 0) : undefined,
              }))}
              activeKey={activeTab}
              onTabChange={setActiveTab}
              layoutId="dentist-filter-pill"
            />
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
              <EmptyState
                variant="dentists"
                message={`No ${activeTab === 'all' ? '' : activeTab + ' '}dentists found`}
                subtext="New dentists will appear here once they register and await approval."
              />
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
                        <span className="ma-uc-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {user?.name || 'Unnamed Dentist'}
                          <TwentyFirstBadge
                            variant={user.status === 'approved' ? 'approved' : user.status === 'rejected' ? 'rejected' : 'pending'}
                            pulse={user.status === 'pending'}
                          >
                            {user.status}
                          </TwentyFirstBadge>
                        </span>
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

      {adminView === 'dentists' && dentistSubView === 'orders' && (
        <>
          {/* Back to Dentist landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
            <button onClick={() => setDentistSubView(null)} aria-label="Back"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
          </div>
          {drillDentistOrders ? (
            /* ── Drill-down: single dentist's orders ── */
            <>
              {/* Back Arrow Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}>
                <button
                  onClick={() => { setDrillDentistOrders(null); setOrderFilter('all'); setOrderSearch(''); }}
                  aria-label="Back"
                  title="Back"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2ece6',
                    background: '#ffffff', color: '#1e5038', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1a3028' }}>{drillDentistOrders.name}</div>
                  {drillDentistOrders.clinicName && <div style={{ fontSize: '0.78rem', color: '#708c80' }}>{drillDentistOrders.clinicName}</div>}
                </div>
              </div>

              {/* Search Bar */}
              <div className="ma-search-wrap">
                <div className="ma-search-bar">
                  {Ico.search(14)}
                  <input type="text" className="ma-search-input" placeholder="Search patient, case ID..."
                    value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                  {orderSearch && (
                    <button className="ma-search-clear" onClick={() => setOrderSearch('')}>
                      {Ico.x(12)}
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Status Chips */}
              <div className="ma-tabs-wrap" style={{ padding: '0 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--color-primary-dark)' }}>{Ico.filter(18)}</span>
                  <select 
                    value={orderFilter} 
                    onChange={e => setOrderFilter(e.target.value)} 
                    style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)', outline: 'none' }}
                  >
                    {ORDER_TABS.map(st => (
                      <option key={st} value={st}>
                        {st === 'all' ? 'All Orders' : st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <main className="ma-main">
                {filteredOrders.length === 0 ? (
                  <EmptyState
                    variant="orders"
                    message="No orders found for this dentist"
                    subtext="Orders will appear here once the dentist submits a lab case."
                  />
                ) : (
                  <div className="ma-order-list">
                    {filteredOrders.map(o => (
                      <div key={o._id} className="ma-card" onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                        <div className="ma-card-top">
                          <div>
                            <span className="ma-card-title">{o.patientName}</span>
                            <div className="ma-card-sub">
                              {o.serviceType && <span>{o.serviceType}</span>}
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
          ) : (
            /* ── Dentist cards overview ── */
            <main className="ma-main">
              {loadingOrders ? (
                <div className="ma-loading">
                  {[1, 2, 3].map(i => <div key={i} className="ma-skeleton-card" />)}
                </div>
              ) : dentistOrderGroups.length === 0 ? (
                <EmptyState
                  variant="orders"
                  message="No lab orders found"
                  subtext="Lab orders from registered dentists will appear here."
                />
              ) : (
                <div className="ma-user-list">
                  {dentistOrderGroups.map(d => {
                    const inProgress = d.orders.filter(o => o.status === 'In Progress').length;
                    const pending = d.orders.filter(o => o.status === 'Pending').length;
                    const completed = d.orders.filter(o => o.status === 'Completed').length;
                    return (
                      <div key={d._id} className="ma-card" onClick={() => setDrillDentistOrders(d)} style={{ cursor: 'pointer' }}>
                        <div className="ma-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="ma-uc-avatar">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                            <div>
                              <span className="ma-card-title">{d.name}</span>
                              {d.clinicName && <div className="ma-card-sub">{d.clinicName}</div>}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e5038' }}>{d.orders.length} {d.orders.length === 1 ? 'Order' : 'Orders'} ›</span>
                        </div>
                        <div className="ma-card-meta-row" style={{ marginTop: '8px' }}>
                          {inProgress > 0 && <span className="ma-pill ma-pill--status-in-progress">{inProgress} In Progress</span>}
                          {pending > 0 && <span className="ma-pill ma-pill--status-pending">{pending} Pending</span>}
                          {completed > 0 && <span className="ma-pill ma-pill--status-completed">{completed} Completed</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ height: 24 }} />
            </main>
          )}
        </>
      )}

      {adminView === 'dentists' && dentistSubView === 'payments' && (
        <>
          {/* Back to Dentist landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
            <button onClick={() => setDentistSubView(null)} aria-label="Back"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
          </div>
          {drillDentistPayments ? (
            /* ── Drill-down: single dentist's payments ── */
            <>
              {/* Back Arrow Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}>
                <button
                  onClick={() => { setDrillDentistPayments(null); setPayFilterStatus('all'); setPayFilterMode('all'); setPaySearch(''); }}
                  aria-label="Back"
                  title="Back"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2ece6',
                    background: '#ffffff', color: '#1e5038', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1a3028' }}>{drillDentistPayments.name}</div>
                  {drillDentistPayments.clinicName && <div style={{ fontSize: '0.78rem', color: '#708c80' }}>{drillDentistPayments.clinicName}</div>}
                </div>
              </div>

              {/* Filter Status Pills */}
              <div className="ma-tabs-wrap" style={{ padding: '0 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--color-primary-dark)' }}>{Ico.filter(18)}</span>
                  <select 
                    value={payFilterStatus} 
                    onChange={e => setPayFilterStatus(e.target.value)} 
                    style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-charcoal)', outline: 'none' }}
                  >
                    {PAY_STATUS_TABS.map(st => (
                      <option key={st} value={st}>
                        {st === 'all' ? 'All Status' : st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <main className="ma-main">
                {filteredPaymentsForDrill.length === 0 ? (
                  <EmptyState
                    variant="payments"
                    message="No payment records found"
                    subtext="Payment records for this dentist will appear here."
                  />
                ) : (
                  <div className="ma-pay-list">
                    {filteredPaymentsForDrill.map(p => (
                      <div key={p._id} className="ma-card" onClick={() => setSelectedPayment(p)} style={{ cursor: 'pointer' }}>
                        <div className="ma-card-top">
                          <div>
                            <span className="ma-card-title">{p.patientName}</span>
                            <div className="ma-card-sub">{p.serviceType || p.caseId}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="ma-case-badge">{p.caseId}</span>
                            <div className="ma-card-amount-lg">
                              {formatINR(p.amount || 0)}
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
          ) : (
            /* ── Dentist cards overview for payments ── */
            <>

              {/* #57 — Total summary bar */}
              {paymentData.summary && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
                  padding: '12px 16px', marginBottom: '4px'
                }}>
                  <div style={{ background: 'var(--dz-color-bg-surface)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid var(--dz-color-border-light)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--dz-color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Billed</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', marginTop: '2px' }}>{formatINR(paymentData.summary.totalBilled || 0)}</div>
                  </div>
                  <div style={{ background: 'var(--dz-color-success-bg)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid var(--dz-color-border-light)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--dz-color-success-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Collected</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dz-color-success-text)', marginTop: '2px' }}>{formatINR(paymentData.summary.totalCollected || 0)}</div>
                  </div>
                  <div style={{ background: 'var(--dz-color-warning-bg)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid var(--dz-color-border-light)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--dz-color-warning-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Outstanding</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dz-color-warning-text)', marginTop: '2px' }}>{formatINR((paymentData.summary.totalBilled || 0) - (paymentData.summary.totalCollected || 0))}</div>
                  </div>
                </div>
              )}

              <main className="ma-main">
                {loadingPayments ? (
                  <div className="ma-loading">
                    {[1, 2, 3].map(i => <div key={i} className="ma-skeleton-card" />)}
                  </div>
                ) : dentistPaymentGroups.length === 0 ? (
                  <EmptyState
                    variant="payments"
                    message="No payment records found"
                    subtext="Payment and billing records will appear here as orders are processed."
                  />
                ) : (
                  <div className="ma-user-list">
                    {dentistPaymentGroups.map(d => {
                      const unpaid = d.payments.filter(p => p.paymentStatus !== 'Paid').length;
                      return (
                        <div key={d._id} className="ma-card" onClick={() => setDrillDentistPayments(d)} style={{ cursor: 'pointer' }}>
                          <div className="ma-card-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="ma-uc-avatar">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                              <div>
                                <span className="ma-card-title">{d.name}</span>
                                {d.clinicName && <div className="ma-card-sub">{d.clinicName}</div>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e5038' }}>{d.payments.length} {d.payments.length === 1 ? 'Case' : 'Cases'} ›</span>
                          </div>
                          <div className="ma-card-meta-row" style={{ marginTop: '8px' }}>
                            {/* #56 — Only show non-zero values */}
                            {d.totalBilled > 0 && (
                              <span className="ma-pill" style={{ background: 'var(--dz-color-bg-surface-alt)', color: 'var(--dz-color-text-body)', fontWeight: 600 }}>Billed {formatINR(d.totalBilled)}</span>
                            )}
                            {d.totalCollected > 0 && (
                              <span className="ma-pill" style={{ background: 'var(--dz-color-success-bg)', color: 'var(--dz-color-success-text)', fontWeight: 600 }}>Collected {formatINR(d.totalCollected)}</span>
                            )}
                            {d.totalPending > 0 && (
                              <span className="ma-pill" style={{ background: 'var(--dz-color-warning-bg)', color: 'var(--dz-color-warning-text)', fontWeight: 600 }}>Pending {formatINR(d.totalPending)}</span>
                            )}
                            {unpaid > 0 && (
                              <span className="ma-pill" style={{ background: 'var(--dz-color-error-bg)', color: 'var(--dz-color-error-text)', fontWeight: 600 }}>{unpaid} Unpaid</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ height: 24 }} />
              </main>
            </>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: STAFF
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'staff' && !staffSubView && (
        /* Staff Landing Page with 4 sub-section cards */
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: '0 0 16px' }}>Staff Management</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { key: 'members', label: 'Members', desc: 'Manage staff directory and roles', iconFn: () => Ico.usersS ? Ico.usersS(22) : Ico.user(22) },
              { key: 'attendance', label: 'Attendance', desc: 'Daily check-in and attendance history', iconFn: () => Ico.clockS ? Ico.clockS(22) : Ico.clock(22) },
              { key: 'inventory', label: 'Inventory', desc: 'Lab materials and stock levels', iconFn: () => Ico.package(22) },
              { key: 'metrics', label: 'Metrics', desc: 'Staff performance and analytics', iconFn: () => Ico.chart ? Ico.chart(22) : Ico.dashboard(22) },
            ].map(card => (
              <TwentyFirstNavCard
                key={card.key}
                label={card.label}
                desc={card.desc}
                icon={card.iconFn()}
                onClick={() => setStaffSubView(card.key)}
              />
            ))}
          </div>
        </div>
      )}

      {adminView === 'staff' && staffSubView && (
        <>
          {/* Back to Staff landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
            <button
              onClick={() => setStaffSubView(null)}
              aria-label="Back to Staff Management"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
          </div>

          <div style={{ padding: '16px', paddingBottom: '90px' }}>
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
              activeSubView={staffSubView}
              onSubViewChange={setStaffSubView}
              hideSubNav={true}
            />
          </div>
        </>
      )}

      {adminView === 'settings' && (
        <main className="ma-main" style={{ paddingTop: '16px', paddingBottom: '90px' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            <div style={{ padding: '0 16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>Settings & Analytics</h2>
              <p style={{ color: '#6b8a7a', fontSize: '0.82rem', margin: '4px 0 0' }}>Admin overview and portal management</p>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Card 0: Dentist Portal Notice Bar */}
              <div className="ma-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => {
                    const next = expandedMobileSetting === 'notice' ? null : 'notice';
                    setExpandedMobileSetting(next);
                    if (next === 'notice' && !noticeLoaded) fetchNotice();
                  }}
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedMobileSetting === 'notice' ? '#f8faf9' : '#fff' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f5ee', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {Ico.bell ? Ico.bell(20) : Ico.grid(20)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>Dentist Portal Notice Bar</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b8a7a' }}>Manage scrolling announcements for dentists</div>
                    </div>
                  </div>
                  <div style={{ color: '#6b8a7a' }}>
                    {expandedMobileSetting === 'notice' ? Ico.chevronUp(18) : Ico.chevronDown(18)}
                  </div>
                </div>

                {expandedMobileSetting === 'notice' && (
                  <div style={{ padding: '16px', borderTop: '1px solid #edf2ef', background: '#fafcfa' }}>
                    {/* Master Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 14px', background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a3028' }}>Show Notice Bar</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b8a7a' }}>Toggle ticker across dentist portals</div>
                      </div>
                      <button
                        onClick={() => setNoticeEnabled(v => !v)}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative',
                          background: noticeEnabled ? '#22c55e' : '#d1d5db', transition: 'background 0.2s',
                        }}
                        aria-label="Toggle notice bar"
                      >
                        <span style={{
                          position: 'absolute', top: '3px', left: noticeEnabled ? '23px' : '3px',
                          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                        }} />
                      </button>
                    </div>

                    {/* Live Preview */}
                    {noticeMessages.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Live Preview</div>
                        <div style={{ opacity: noticeEnabled ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: noticeEnabled ? 'auto' : 'none' }}>
                          <TwentyFirstNoticeBar messages={noticeMessages} />
                        </div>
                      </div>
                    )}

                    {/* Add New Message */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
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
                        placeholder="New announcement..."
                        maxLength={250}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4ddd8', fontSize: '0.82rem', outline: 'none' }}
                      />
                      <button
                        disabled={!noticeNewMsg.trim()}
                        onClick={() => { setNoticeMessages(prev => [...prev, noticeNewMsg.trim()]); setNoticeNewMsg(''); }}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: noticeNewMsg.trim() ? '#1e5038' : '#d4ddd8', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: noticeNewMsg.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                      >
                        + Add
                      </button>
                    </div>

                    {/* Message List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      {noticeMessages.map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: '#fff', border: '1px solid #e2ece6', borderRadius: '8px' }}>
                          {/* Reorder */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                            <button
                              disabled={idx === 0}
                              onClick={() => { const arr = [...noticeMessages]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setNoticeMessages(arr); }}
                              style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#d4ddd8' : '#6b8a7a', fontSize: '9px', padding: '0 2px', lineHeight: 1 }}
                              aria-label="Move up"
                            >
                              &#9650;
                            </button>
                            <button
                              disabled={idx === noticeMessages.length - 1}
                              onClick={() => { const arr = [...noticeMessages]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; setNoticeMessages(arr); }}
                              style={{ background: 'none', border: 'none', cursor: idx === noticeMessages.length - 1 ? 'default' : 'pointer', color: idx === noticeMessages.length - 1 ? '#d4ddd8' : '#6b8a7a', fontSize: '9px', padding: '0 2px', lineHeight: 1 }}
                              aria-label="Move down"
                            >
                              &#9660;
                            </button>
                          </div>
                          {/* Message text */}
                          {noticeEditIdx === idx ? (
                            <input
                              autoFocus
                              type="text"
                              value={noticeEditVal}
                              onChange={e => setNoticeEditVal(e.target.value)}
                              onBlur={() => {
                                if (noticeEditVal.trim()) {
                                  const arr = [...noticeMessages]; arr[idx] = noticeEditVal.trim(); setNoticeMessages(arr);
                                }
                                setNoticeEditIdx(null);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') e.target.blur();
                                if (e.key === 'Escape') setNoticeEditIdx(null);
                              }}
                              maxLength={250}
                              style={{ flex: 1, padding: '4px 6px', borderRadius: '6px', border: '1px solid #1e5038', fontSize: '0.8rem', outline: 'none' }}
                            />
                          ) : (
                            <span
                              onClick={() => { setNoticeEditIdx(idx); setNoticeEditVal(msg); }}
                              style={{ flex: 1, fontSize: '0.8rem', color: '#2a4a3c', cursor: 'text' }}
                            >
                              {msg}
                            </span>
                          )}
                          <button
                            onClick={() => { setNoticeEditIdx(idx); setNoticeEditVal(msg); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8a7a', padding: '2px' }}
                            aria-label="Edit"
                          >
                            {Ico.edit ? Ico.edit(12) : '\u270E'}
                          </button>
                          <button
                            onClick={() => setNoticeMessages(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}
                            aria-label="Delete"
                          >
                            {Ico.trash ? Ico.trash(12) : '\u2715'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d4ddd8', background: '#fff', color: '#6b8a7a', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Defaults
                      </button>
                      <button
                        onClick={handleNoticeSave}
                        disabled={noticeSaving}
                        style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#1e5038', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: noticeSaving ? 'default' : 'pointer', opacity: noticeSaving ? 0.7 : 1 }}
                      >
                        {noticeSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 1: Payments & Revenue Overview */}
            <div className="ma-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedMobileSetting(expandedMobileSetting === 'payments' ? null : 'payments')}
                style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedMobileSetting === 'payments' ? '#f8faf9' : '#fff' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f5ee', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Ico.payments ? Ico.payments(20) : Ico.wallet(20)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>Payment & Revenue Overview</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b8a7a' }}>Tap to view billed, collected, and pending</div>
                  </div>
                </div>
                <div style={{ color: '#6b8a7a' }}>
                  {expandedMobileSetting === 'payments' ? Ico.chevronUp(18) : Ico.chevronDown(18)}
                </div>
              </div>

              {expandedMobileSetting === 'payments' && (
                <div style={{ padding: '16px', borderTop: '1px solid #edf2ef', background: '#fafcfa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase' }}>Total Billed</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a3028', marginTop: '4px' }}>
                        {formatINR(paymentData.summary?.totalBilled || 0)}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>Collected</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                        {formatINR(paymentData.summary?.totalCollected || 0)}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Pending</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                        {formatINR(paymentData.summary?.totalPending || 0)}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase' }}>Records</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e5038', marginTop: '4px' }}>
                        {paymentData.summary?.totalPayments || paymentData.payments?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: User Accounts Overview */}
            <div className="ma-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedMobileSetting(expandedMobileSetting === 'users' ? null : 'users')}
                style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedMobileSetting === 'users' ? '#f8faf9' : '#fff' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f5ee', color: '#1e5038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Ico.usersS ? Ico.usersS(20) : Ico.users(20)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>User Accounts Overview</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b8a7a' }}>Tap to view registered, approved, and rejected</div>
                  </div>
                </div>
                <div style={{ color: '#6b8a7a' }}>
                  {expandedMobileSetting === 'users' ? Ico.chevronUp(18) : Ico.chevronDown(18)}
                </div>
              </div>

              {expandedMobileSetting === 'users' && (
                <div style={{ padding: '16px', borderTop: '1px solid #edf2ef', background: '#fafcfa' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase' }}>Total Registered</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3028', marginTop: '4px' }}>
                        {stats.total || 0}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>Approved</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                        {stats.approved || 0}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Pending</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                        {stats.pending || 0}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>Rejected</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                        {stats.rejected || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Account and Logout */}
            <div className="ma-card" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3028' }}>Administrator Account</div>
                <div style={{ fontSize: '0.78rem', color: '#6b8a7a' }}>Logged in as <strong style={{ color: '#1e5038' }}>{admin?.username || 'admin'}</strong></div>
              </div>
              <button
                className="btn"
                onClick={handleLogout}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', fontWeight: 600, fontSize: '0.9rem' }}
              >
                {Ico.logout(16)} Logout
              </button>
            </div>
          </div>
        </div>
      </main>
      )}

      {/* ── 21st.dev: Floating Bottom Navigation ────────────────────── */}
      <TwentyFirstBottomNav
        items={ADMIN_NAV_BASE.map(item => ({
          ...item,
          badge: item.key === 'dentists' && stats.pending > 0 ? stats.pending : undefined,
        }))}
        activeKey={adminView}
        onChange={(key) => {
          setAdminView(key);
          if (key === 'dentists') setDentistSubView(null);
          if (key === 'staff') {
            setStaffSubView(null);
            fetchStaff();
          }
          if (key === 'settings') {
            fetchStats();
            fetchPayments();
          }
        }}
        layoutId="admin-nav-pill"
        ariaLabel="Admin navigation"
      />

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
        <div className={`ma-toast ${toast.type === 'error' ? 'ma-toast--error' : 'ma-toast--success'}`} role="alert">
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
    </div>
  );
};

export default MobileAdminDashboard;
