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
import BaseModal from '../../components/ui/BaseModal';
import PrintableInvoice from '../../components/common/PrintableInvoice';
import useDashboardUrlState from '../../hooks/useDashboardUrlState';
import EmptyState from '../../components/common/EmptyState';
import StaffManagementView from '../../admin/StaffManagementView';
import { formatINR, formatDate } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import './MobileAdminDashboard.css';

import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstSegmentedTabs } from '../../components/ui/twentyfirst-segmented-tabs';
import { TwentyFirstBadge } from '../../components/ui/twentyfirst-badge';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { StatusBadge } from '../../components/ui/status-badge';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import { TwentyFirstNavCard } from '../../components/ui/twentyfirst-nav-card';
import TwentyFirstNoticeBar from '../../components/ui/twentyfirst-notice-bar';
import TwentyFirstNoticeList from '../../components/ui/twentyfirst-notice-list';

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

  // Primary view: 'dentists' | 'staff' | 'settings' (URL synced)
  const [rawAdminView, setAdminView] = useDashboardUrlState('view', 'dentists');
  // Dentist sub-view: null (landing) | 'users' | 'orders' | 'payments' (URL synced)
  const [rawDentistSubView, setDentistSubView] = useDashboardUrlState('sub', null);
  // Staff sub-view: null (landing) | 'members' | 'attendance' | 'inventory' | 'metrics' (URL synced)
  const [staffSubView, setStaffSubView] = useDashboardUrlState('staffSub', null);

  // Normalize view states so unexpected or legacy query params (e.g. view=users) never cause a blank page
  const adminView = (rawAdminView === 'staff' || rawAdminView === 'settings') ? rawAdminView : 'dentists';
  const dentistSubView = rawAdminView === 'users' ? 'users' : (['users', 'orders', 'payments'].includes(rawDentistSubView) ? rawDentistSubView : null);

  // Clean up legacy or corrupted query params in URL without polluting history stack
  useEffect(() => {
    if (rawAdminView === 'users') {
      setAdminView('dentists', { replace: true });
      setDentistSubView('users', { replace: true });
    }
  }, [rawAdminView, setAdminView, setDentistSubView]);
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
  const [payFilterMonth, setPayFilterMonth]   = useState('all');
  const [paySearch, setPaySearch]             = useState('');
  const [drillDentistPayments, setDrillDentistPayments] = useState(null); // { _id, name, clinicName }

  // Record Payment modal state
  const [payModal, setPayModal]         = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const handleRecalculateAll = async () => {
    if (!window.confirm('Recalculate and backfill rate-card amounts for all legacy orders?')) return;
    setIsRecalculating(true);
    try {
      const res = await authFetch(`${ADMIN_API}/orders/recalculate-all`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'All orders recalculated successfully.');
        fetchAllOrders();
        fetchPayments();
      } else {
        showToast(data.message || 'Failed to recalculate orders.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to recalculate orders.', 'error');
    } finally {
      setIsRecalculating(false);
    }
  };

  const [payForm, setPayForm]           = useState({ mode: 'Cash', referenceNumber: '', amount: '', notes: '' });
  const [payFormError, setPayFormError] = useState('');
  const [payFormSaving, setPayFormSaving] = useState(false);

  // Batch Payment state (multi-order payment updates)
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [batchPayForm, setBatchPayForm] = useState({ mode: 'Cash', referenceNumber: '', notes: '', status: 'Paid' });
  const [batchPaySaving, setBatchPaySaving] = useState(false);
  const [batchPayError, setBatchPayError] = useState('');
  const [batchStatementModal, setBatchStatementModal] = useState(null);

  // Detail modals
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [settingsSubView, setSettingsSubView] = useState(null); // null | 'notice' | 'payments' | 'users' | 'account'

  // Notice bar settings state
  const [noticeEnabled, setNoticeEnabled] = useState(true);
  const [noticeMessages, setNoticeMessages] = useState([]);
  const [noticeNewMsg, setNoticeNewMsg] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeLoaded, setNoticeLoaded] = useState(false);

  // Staff notice bar settings state
  const [staffNoticeEnabled, setStaffNoticeEnabled] = useState(true);
  const [staffNoticeMessages, setStaffNoticeMessages] = useState([]);
  const [staffNoticeNewMsg, setStaffNoticeNewMsg] = useState('');
  const [staffNoticeSaving, setStaffNoticeSaving] = useState(false);
  const [staffNoticeLoaded, setStaffNoticeLoaded] = useState(false);

  // Common state
  const [actionLoading, setActionLoading] = useState(null);
  const [liveNotifs, setLiveNotifs]       = useState([]);
  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [error, setError]                 = useState(null);

  const sseRef        = useRef(null);

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
        showToast('Notice bar updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update notice bar.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
    setNoticeSaving(false);
  };

  const fetchStaffNotice = useCallback(async () => {
    try {
      const res = await authFetch(`${ADMIN_API}/settings/staff-notice`);
      if (res.ok) {
        const d = await res.json();
        setStaffNoticeEnabled(d.enabled !== false);
        setStaffNoticeMessages(d.messages || []);
        setStaffNoticeLoaded(true);
      }
    } catch {}
  }, [authFetch, ADMIN_API]);

  const handleStaffNoticeSave = async () => {
    setStaffNoticeSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/settings/staff-notice`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: staffNoticeEnabled, messages: staffNoticeMessages }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Staff notice bar updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update staff notice bar.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
    setStaffNoticeSaving(false);
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
    fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.username]);

  // Re-fetch staff when view switches to staff
  useEffect(() => {
    if (!admin?.username || adminView !== 'staff') return;
    fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView]);

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

  /* -- Toast helper (using context) -------------------------------------- */

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
          if (res.ok) {
            showToast('User deleted.');
            fetchUsers();
            fetchStats();
            fetchAllOrders();
            fetchPayments();
          } else {
            showToast(data.message || 'Failed to delete', 'error');
          }
        } catch { showToast('Network error', 'error'); }
        setActionLoading(null);
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  /* -- Payment Actions --------------------------------------------------- */
  const togglePaymentSelect = (id) => {
    setSelectedPaymentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPayments = () => {
    const targetIds = filteredPaymentsForDrill.map(p => p._id);
    const allAreSelected = targetIds.length > 0 && targetIds.every(id => selectedPaymentIds.includes(id));
    if (allAreSelected) {
      setSelectedPaymentIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedPaymentIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleSelectMonthOrders = () => {
    const monthIds = filteredPaymentsForDrill.map(p => p._id);
    setSelectedPaymentIds(prev => Array.from(new Set([...prev, ...monthIds])));
  };

  const handleBatchRecordPayment = async () => {
    if (selectedPaymentIds.length === 0) return;
    setBatchPayError('');
    if (batchPayForm.status === 'Paid') {
      if (batchPayForm.mode === 'Cheque' && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 3)) {
        setBatchPayError('Cheque number is required (min 3 characters).');
        return;
      }
      if (batchPayForm.mode === 'UPI' && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 4)) {
        setBatchPayError('UPI transaction / UTR number is required (min 4 characters).');
        return;
      }
    }
    setBatchPaySaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/payments/batch`, {
        method: 'POST',
        body: JSON.stringify({
          paymentIds: selectedPaymentIds,
          status: batchPayForm.status,
          paymentMode: batchPayForm.status === 'Paid' ? batchPayForm.mode : '',
          referenceNumber: batchPayForm.status === 'Paid' ? batchPayForm.referenceNumber.trim() : '',
          notes: batchPayForm.notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Payment updated for ${data.updatedCount || selectedPaymentIds.length} orders.`);
        setSelectedPaymentIds([]);
        setBatchPayModalOpen(false);
        fetchAllOrders();
        fetchPayments();

        if (batchPayForm.status === 'Paid' && data.batchId) {
          try {
            const stmtRes = await authFetch(`/api/payments/batch/${data.batchId}`);
            if (stmtRes.ok) {
              const stmtData = await stmtRes.json();
              setBatchStatementModal(stmtData);
            }
          } catch {}
        }
      } else {
        setBatchPayError(data.message || 'Failed to update payments.');
      }
    } catch {
      setBatchPayError('Network error.');
    }
    setBatchPaySaving(false);
  };

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
      if (payFilterMonth !== 'all') {
        const pDate = p.createdAt || p.invoiceDate || '';
        const pMonth = pDate.slice(0, 7);
        if (pMonth && pMonth !== payFilterMonth) return false;
      }
      return true;
    });
  }, [paymentData.payments, drillDentistPayments, payFilterStatus, payFilterMode, payFilterMonth]);

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setDentistSubView(null)} aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
            </div>
            <button
              type="button"
              onClick={handleRecalculateAll}
              disabled={isRecalculating}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #c2dcd0',
                background: '#e8f2ec', color: '#1e5038', fontWeight: 600, fontSize: '0.75rem',
                cursor: isRecalculating ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRecalculating ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              {isRecalculating ? 'Syncing...' : 'Sync Amounts'}
            </button>
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
                      <div className="ma-card-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <TwentyFirstIconButton
                          icon={Ico.check(16)}
                          title="Approve Dentist"
                          ariaLabel="Approve Dentist"
                          onClick={() => handleApprove(uId, user.name)}
                          size="lg"
                          variant="success"
                        />
                        {user.status === 'pending' && (
                          <TwentyFirstIconButton
                            icon={Ico.x(16)}
                            title="Reject Dentist"
                            ariaLabel="Reject Dentist"
                            onClick={() => handleReject(uId, user.name)}
                            size="lg"
                            variant="danger"
                          />
                        )}
                        <TwentyFirstIconButton
                          icon={Ico.trash(16)}
                          title="Delete Dentist"
                          ariaLabel="Delete Dentist"
                          onClick={() => handleDelete(uId, user.name)}
                          size="lg"
                          variant="danger"
                        />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setDentistSubView(null)} aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
            </div>
            <button
              type="button"
              onClick={handleRecalculateAll}
              disabled={isRecalculating}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid #c2dcd0',
                background: '#e8f2ec', color: '#1e5038', fontWeight: 600, fontSize: '0.75rem',
                cursor: isRecalculating ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRecalculating ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              {isRecalculating ? 'Syncing...' : 'Sync Amounts'}
            </button>
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

                        <div className="ma-card-meta-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <StatusBadge status={o.status || 'Pending'} size="sm" />
                          <StatusBadge status={o.paymentStatus || 'Pending'} size="sm" label={o.paymentStatus === 'Paid' && o.paymentMode ? `Paid · ${o.paymentMode}` : (o.paymentStatus || 'Pending')} />
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
          {/* Back to Dentist landing & Dentist Filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 16px 4px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setDentistSubView(null)} aria-label="Back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                id="ma-dentist-filter-select"
                value={drillDentistPayments ? (drillDentistPayments._id || drillDentistPayments.id) : 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setDrillDentistPayments(null);
                  } else {
                    const found = users.find(u => (u._id || u.id) === val) || dentistPaymentGroups.find(d => (d._id || d.id) === val);
                    if (found) setDrillDentistPayments(found);
                  }
                  setSelectedPaymentIds([]);
                }}
                style={{
                  border: '1px solid #c2dcd0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  color: '#1a3028',
                  background: '#fff',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
              >
                <option value="all">All Dentists</option>
                {users.filter(u => u.status === 'approved').map(u => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    Dr. {u.name} {u.clinicName ? `(${u.clinicName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {drillDentistPayments ? (
            /* ── Drill-down: single dentist's payments ── */
            <>
              {/* Back Arrow Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}>
                <button
                  onClick={() => { setDrillDentistPayments(null); setSelectedPaymentIds([]); setPayFilterStatus('all'); setPayFilterMode('all'); setPayFilterMonth('all'); setPaySearch(''); }}
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

              {/* Filter Status Pills & Selection Row */}
              <div className="ma-tabs-wrap" style={{ padding: '0 16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
                  {filteredPaymentsForDrill.length > 0 && (
                    <label
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#4a7060',
                        userSelect: 'none', minHeight: '44px'
                      }}
                      onClick={toggleSelectAllPayments}
                    >
                      <input
                        type="checkbox"
                        checked={filteredPaymentsForDrill.length > 0 && filteredPaymentsForDrill.every(p => selectedPaymentIds.includes(p._id))}
                        onChange={toggleSelectAllPayments}
                        style={{ width: '15px', height: '15px', accentColor: '#1e5038', cursor: 'pointer' }}
                      />
                      <span>Select All ({filteredPaymentsForDrill.length})</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Native Month Selector Filter (Mobile) */}
              <div style={{ padding: '0 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label htmlFor="ma-month-picker" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4a7060' }}>
                  Month:
                </label>
                <input
                  id="ma-month-picker"
                  type="month"
                  value={payFilterMonth === 'all' ? '' : payFilterMonth}
                  onChange={e => setPayFilterMonth(e.target.value || 'all')}
                  style={{
                    border: '1px solid #c2dcd0',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.84rem',
                    color: '#1a3028',
                    background: '#fff',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                />
                {payFilterMonth !== 'all' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPayFilterMonth('all')}
                      style={{
                        background: '#f0f4f2',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        color: '#4a7060',
                        cursor: 'pointer',
                        fontWeight: 600,
                        minHeight: '44px',
                      }}
                    >
                      All Months
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectMonthOrders}
                      style={{
                        background: '#e8f2ec',
                        border: '1px solid #78937E',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        color: '#1e5038',
                        cursor: 'pointer',
                        fontWeight: 700,
                        minHeight: '44px',
                      }}
                      title="Add all orders from this month to payment selection"
                    >
                      + Select {payFilterMonth} Orders ({filteredPaymentsForDrill.length})
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const pendingIds = filteredPaymentsForDrill.filter(p => p.paymentStatus !== 'Paid').map(p => p._id);
                    setSelectedPaymentIds(prev => Array.from(new Set([...prev, ...pendingIds])));
                  }}
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    cursor: 'pointer',
                    fontWeight: 700,
                    minHeight: '44px',
                  }}
                  title="Select all pending orders for batch payment"
                >
                  Select All Pending ({filteredPaymentsForDrill.filter(p => p.paymentStatus !== 'Paid').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dentistId = drillDentistPayments._id || drillDentistPayments.id;
                    const url = `/invoice?unpaid=true&dentistId=${encodeURIComponent(dentistId)}${payFilterMonth !== 'all' ? `&month=${encodeURIComponent(payFilterMonth)}` : ''}`;
                    window.open(url, '_blank');
                  }}
                  style={{
                    background: '#1e5038',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '44px',
                  }}
                  title="Download official statement of outstanding dues"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Pending Bill
                </button>
                {selectedPaymentIds.length > 0 && (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e5038' }}>
                      {selectedPaymentIds.length} orders selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentIds([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c53030',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
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
                      <div
                        key={p._id}
                        className="ma-card"
                        onClick={() => setSelectedPayment(p)}
                        style={{
                          cursor: 'pointer',
                          background: selectedPaymentIds.includes(p._id) ? '#edf5f0' : undefined,
                          borderColor: selectedPaymentIds.includes(p._id) ? '#1e5038' : undefined,
                          transition: 'background 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        <div className="ma-card-top">
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div
                              onClick={e => { e.stopPropagation(); togglePaymentSelect(p._id); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px', cursor: 'pointer', marginTop: '2px' }}
                              title="Select for batch payment"
                              aria-label="Select order for batch payment"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPaymentIds.includes(p._id)}
                                onChange={() => togglePaymentSelect(p._id)}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '17px', height: '17px', accentColor: '#1e5038', cursor: 'pointer' }}
                              />
                            </div>
                            <div>
                              <span className="ma-card-title">{p.patientName}</span>
                              <div className="ma-card-sub">{p.serviceType || p.caseId}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="ma-case-badge">{p.caseId}</span>
                            <div className="ma-card-amount-lg">
                              {formatINR(p.amount || 0)}
                            </div>
                          </div>
                        </div>

                        <div className="ma-card-meta-row">
                          <StatusBadge status={p.paymentStatus || 'Pending'} size="sm" />
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
                        <div className="ma-card-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {p.paymentStatus === 'Paid' ? (
                            <TwentyFirstIconButton
                              icon={Ico.history(16)}
                              title="Mark Pending"
                              ariaLabel="Mark Pending"
                              onClick={() => handleRevertPayment(p._id)}
                              disabled={actionLoading === p._id + '_payment'}
                              size="lg"
                              variant="secondary"
                            />
                          ) : (
                            <TwentyFirstIconButton
                              icon={Ico.creditCard(16)}
                              title="Record Payment"
                              ariaLabel="Record Payment"
                              onClick={() => openRecordPayment(p)}
                              size="lg"
                              variant="success"
                            />
                          )}
                          {p.paymentStatus !== 'Paid' && (
                            <TwentyFirstIconButton
                              icon={Ico.bell(16)}
                              title="Send Payment Reminder"
                              ariaLabel="Send Payment Reminder"
                              onClick={() => handleSendReminder(p._id)}
                              disabled={actionLoading === p._id + '_remind'}
                              size="lg"
                              variant="soft"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ height: 24 }} />
              </main>

              {/* Floating Batch Action Bar */}
              {selectedPaymentIds.length > 0 && (
                <div style={{
                  position: 'fixed',
                  bottom: '76px',
                  left: '12px',
                  right: '12px',
                  zIndex: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: '#1a3028',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: '#a3bfb1', fontWeight: 600 }}>
                      {selectedPaymentIds.length} {selectedPaymentIds.length === 1 ? 'order' : 'orders'} selected
                    </span>
                    <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff' }}>
                      {formatINR(filteredPaymentsForDrill.filter(p => selectedPaymentIds.includes(p._id)).reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentIds([])}
                      style={{
                        background: 'transparent',
                        border: '1px solid #4a6a5a',
                        color: '#c2d6cc',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '40px',
                      }}
                    >
                      Deselect
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchPayForm({ mode: 'Cash', referenceNumber: '', notes: '', status: 'Paid' });
                        setBatchPayError('');
                        setBatchPayModalOpen(true);
                      }}
                      style={{
                        background: '#1e5038',
                        border: '1px solid #708c80',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '40px',
                      }}
                    >
                      {Ico.creditCard(14)} Settle ({selectedPaymentIds.length})
                    </button>
                  </div>
                </div>
              )}
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
                onClick={() => {
                  setStaffSubView(card.key);
                  if (card.key === 'members') fetchStaff();
                }}
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

      {/* ── Settings Landing View (subView === null) ── */}
      {adminView === 'settings' && !settingsSubView && (
        <main className="ma-main" style={{ paddingTop: '16px', paddingBottom: '90px' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dz-color-charcoal, #1a3028)', margin: '0 0 4px' }}>Settings & Analytics</h2>
              <p style={{ color: '#6b8a7a', fontSize: '0.82rem', margin: 0 }}>Select a portal management card below</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <TwentyFirstNavCard
                label="Dentist Portal Notice Bar"
                desc="Manage scrolling announcements for dentists"
                icon={Ico.bell ? Ico.bell(20) : Ico.grid(20)}
                onClick={() => {
                  setSettingsSubView('notice');
                  if (!noticeLoaded) fetchNotice();
                }}
              />
              <TwentyFirstNavCard
                label="Staff Portal Notice Bar"
                desc="Manage scrolling announcements for staff members"
                icon={Ico.bell ? Ico.bell(20) : Ico.grid(20)}
                onClick={() => {
                  setSettingsSubView('staff-notice');
                  if (!staffNoticeLoaded) fetchStaffNotice();
                }}
              />
              <TwentyFirstNavCard
                label="Payment & Revenue Overview"
                desc="Billed, collected, and pending revenue statistics"
                icon={Ico.payments ? Ico.payments(20) : Ico.wallet(20)}
                onClick={() => setSettingsSubView('payments')}
              />
              <TwentyFirstNavCard
                label="User Accounts Overview"
                desc="Registered, approved, pending, and rejected dentists"
                icon={Ico.usersS ? Ico.usersS(20) : Ico.users(20)}
                onClick={() => setSettingsSubView('users')}
              />
              <TwentyFirstNavCard
                label="Administrator Account"
                desc={`Active session (${admin?.username || 'admin'}) and logout`}
                icon={Ico.user ? Ico.user(20) : Ico.settings(20)}
                onClick={() => setSettingsSubView('account')}
              />
            </div>
          </div>
        </main>
      )}

      {/* ── Settings Sub-Views (subView !== null) ── */}
      {adminView === 'settings' && settingsSubView && (
        <main className="ma-main" style={{ paddingTop: '14px', paddingBottom: '90px' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Aligned Back Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setSettingsSubView(null)}
                aria-label="Back to Settings"
                style={{
                  background: '#e8f5ee',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--dz-color-primary-dark, #1e5038)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a3028', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {settingsSubView === 'notice' && 'Dentist Portal Notice Bar'}
                  {settingsSubView === 'staff-notice' && 'Staff Portal Notice Bar'}
                  {settingsSubView === 'payments' && 'Payment & Revenue Overview'}
                  {settingsSubView === 'users' && 'User Accounts Overview'}
                  {settingsSubView === 'account' && 'Administrator Account'}
                </h2>
                <p style={{ color: '#6b8a7a', fontSize: '0.78rem', margin: '2px 0 0' }}>Settings & Analytics / Sub-view</p>
              </div>
            </div>

            {/* Sub-view 1: Notice Bar Manager */}
            {settingsSubView === 'notice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                {/* Master Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a3028' }}>Show Notice Bar</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b8a7a', marginTop: '1px' }}>Toggle scrolling ticker across dentist portals</div>
                  </div>
                  <button
                    onClick={() => setNoticeEnabled(v => !v)}
                    style={{
                      width: '46px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', position: 'relative',
                      background: noticeEnabled ? '#22c55e' : '#d1d5db', transition: 'background 0.2s', flexShrink: 0,
                    }}
                    aria-label="Toggle notice bar"
                  >
                    <span style={{
                      position: 'absolute', top: '3px', left: noticeEnabled ? '23px' : '3px',
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>

                {/* Live Preview */}
                {noticeMessages.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Live Preview</div>
                    <div style={{ opacity: noticeEnabled ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: noticeEnabled ? 'auto' : 'none' }}>
                      <TwentyFirstNoticeBar messages={noticeMessages} />
                    </div>
                  </div>
                )}

                {/* Announcement Editor & Reorder List */}
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Announcements</div>

                  {/* Add New Message Bar */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
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
                      placeholder="Add an announcement..."
                      maxLength={250}
                      style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '10px', border: '1px solid #d4ddd8', fontSize: '0.84rem', outline: 'none' }}
                    />
                    <TwentyFirstIconButton
                      icon={Ico.plus(18)}
                      title="Add Message"
                      ariaLabel="Add Message"
                      disabled={!noticeNewMsg.trim()}
                      onClick={() => { setNoticeMessages(prev => [...prev, noticeNewMsg.trim()]); setNoticeNewMsg(''); }}
                      variant="primary"
                      size="lg"
                    />
                  </div>

                  {/* Draggable Reorderable List (21st.dev) */}
                  <TwentyFirstNoticeList
                    messages={noticeMessages}
                    onChange={setNoticeMessages}
                  />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '6px' }}>
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
                      style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #d4ddd8', background: '#fff', color: '#6b8a7a', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Defaults
                    </button>
                    <button
                      onClick={handleNoticeSave}
                      disabled={noticeSaving}
                      style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#1e5038', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: noticeSaving ? 'default' : 'pointer', opacity: noticeSaving ? 0.7 : 1 }}
                    >
                      {noticeSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Staff Notice Bar Manager */}
            {settingsSubView === 'staff-notice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                {/* Master Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a3028' }}>Show Notice Bar to Staff</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b8a7a', marginTop: '1px' }}>Toggle scrolling ticker across staff portals</div>
                  </div>
                  <button
                    onClick={() => setStaffNoticeEnabled(v => !v)}
                    style={{
                      width: '46px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', position: 'relative',
                      background: staffNoticeEnabled ? '#22c55e' : '#d1d5db', transition: 'background 0.2s', flexShrink: 0,
                    }}
                    aria-label="Toggle staff notice bar"
                  >
                    <span style={{
                      position: 'absolute', top: '3px', left: staffNoticeEnabled ? '23px' : '3px',
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>

                {/* Live Preview */}
                {staffNoticeMessages.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Live Preview</div>
                    <div style={{ opacity: staffNoticeEnabled ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: staffNoticeEnabled ? 'auto' : 'none' }}>
                      <TwentyFirstNoticeBar messages={staffNoticeMessages} />
                    </div>
                  </div>
                )}

                {/* Announcement Editor & Reorder List */}
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Announcements</div>

                  {/* Add New Message Bar */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <input
                      type="text"
                      value={staffNoticeNewMsg}
                      onChange={e => setStaffNoticeNewMsg(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && staffNoticeNewMsg.trim()) {
                          setStaffNoticeMessages(prev => [...prev, staffNoticeNewMsg.trim()]);
                          setStaffNoticeNewMsg('');
                        }
                      }}
                      placeholder="Add a staff announcement..."
                      maxLength={250}
                      style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '10px', border: '1px solid #d4ddd8', fontSize: '0.84rem', outline: 'none' }}
                    />
                    <TwentyFirstIconButton
                      icon={Ico.plus(18)}
                      title="Add Message"
                      ariaLabel="Add Message"
                      disabled={!staffNoticeNewMsg.trim()}
                      onClick={() => { setStaffNoticeMessages(prev => [...prev, staffNoticeNewMsg.trim()]); setStaffNoticeNewMsg(''); }}
                      variant="primary"
                      size="lg"
                    />
                  </div>

                  {/* Draggable Reorderable List (21st.dev) */}
                  <TwentyFirstNoticeList
                    messages={staffNoticeMessages}
                    onChange={setStaffNoticeMessages}
                  />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '6px' }}>
                    <button
                      onClick={() => {
                        setStaffNoticeMessages([
                          'Welcome to Dentzy Lab Operations Portal',
                          'Ensure all case scans & QC checklists are logged before dispatch',
                          'Priority cases marked Urgent must be completed within 24 hours',
                          'Standard daily shift handover meeting at 6:00 PM',
                          'Lab Support & Rush Desk hotline: +91 9503668112',
                        ]);
                        setStaffNoticeEnabled(true);
                      }}
                      style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #d4ddd8', background: '#fff', color: '#6b8a7a', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Defaults
                    </button>
                    <button
                      onClick={handleStaffNoticeSave}
                      disabled={staffNoticeSaving}
                      style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#1e5038', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: staffNoticeSaving ? 'default' : 'pointer', opacity: staffNoticeSaving ? 0.7 : 1 }}
                    >
                      {staffNoticeSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 2: Payment & Revenue Overview */}
            {settingsSubView === 'payments' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', width: '100%' }}>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Billed</div>
                  <div style={{ fontSize: 'clamp(1rem, 4.2vw, 1.25rem)', fontWeight: 800, color: '#1a3028', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatINR(paymentData.summary?.totalBilled || 0)}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Collected</div>
                  <div style={{ fontSize: 'clamp(1rem, 4.2vw, 1.25rem)', fontWeight: 800, color: '#166534', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatINR(paymentData.summary?.totalCollected || 0)}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pending</div>
                  <div style={{ fontSize: 'clamp(1rem, 4.2vw, 1.25rem)', fontWeight: 800, color: '#b45309', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatINR(paymentData.summary?.totalPending || 0)}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e5038', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Records</div>
                  <div style={{ fontSize: 'clamp(1rem, 4.2vw, 1.25rem)', fontWeight: 800, color: '#1e5038', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {paymentData.summary?.totalPayments || paymentData.payments?.length || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 3: User Accounts Overview */}
            {settingsSubView === 'users' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', width: '100%' }}>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Registered</div>
                  <div style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.4rem)', fontWeight: 800, color: '#1a3028', marginTop: '4px' }}>
                    {stats.total || 0}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Approved</div>
                  <div style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.4rem)', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                    {stats.approved || 0}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pending</div>
                  <div style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.4rem)', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                    {stats.pending || 0}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rejected</div>
                  <div style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.4rem)', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                    {stats.rejected || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 4: Administrator Account */}
            {settingsSubView === 'account' && (
              <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: '14px', padding: '20px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a3028' }}>Administrator Account</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b8a7a', marginTop: '4px' }}>Logged in as <strong style={{ color: '#1e5038' }}>{admin?.username || 'admin'}</strong></div>
                </div>
                <button
                  className="btn"
                  onClick={handleLogout}
                  style={{
                    width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center',
                    background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px',
                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  {Ico.logout(16)} Logout
                </button>
              </div>
            )}
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
            setSettingsSubView(null);
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
      <BaseModal
        isOpen={Boolean(payModal)}
        onClose={() => setPayModal(null)}
        maxWidth="max-w-md"
        raw={true}
        id="ma-pay-modal"
      >
        {payModal && (
          <div className="ma-modal-sheet" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
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
        )}
      </BaseModal>

      {/* ─────────────────────────────────────────────────────────────
          BATCH RECORD PAYMENT MODAL (Mobile Dialog)
          ───────────────────────────────────────────────────────────── */}
      <BaseModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        maxWidth="max-w-md"
        raw={true}
        id="ma-batch-pay-modal"
      >
        <div className="ma-modal-sheet" style={{ width: '100%', maxWidth: 'none', margin: 0 }}>
          <div className="ma-modal-header">
            <h3>Update Payment Details ({selectedPaymentIds.length} Orders)</h3>
            <button className="ma-modal-close" onClick={() => setBatchPayModalOpen(false)}>
              {Ico.x(16)}
            </button>
          </div>

          <div className="ma-modal-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>Selected Cases:</strong> {selectedPaymentIds.length}</span>
              <span><strong>Total:</strong> <strong style={{ color: '#1e5038', fontSize: '1rem' }}>
                {formatINR(filteredPaymentsForDrill.filter(p => selectedPaymentIds.includes(p._id)).reduce((s, p) => s + (Number(p.amount) || 0), 0))}
              </strong></span>
            </div>
            {drillDentistPayments && (
              <div><strong>Dentist:</strong> {drillDentistPayments.name} {drillDentistPayments.clinicName ? `· ${drillDentistPayments.clinicName}` : ''}</div>
            )}
          </div>

          {/* Status Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: '#f0f7f3', padding: '4px', borderRadius: '10px' }}>
            {[
              { key: 'Paid', label: 'Mark as Paid' },
              { key: 'Pending', label: 'Mark as Pending' },
            ].map(st => (
              <button
                key={st.key}
                type="button"
                onClick={() => setBatchPayForm(f => ({ ...f, status: st.key }))}
                style={{
                  flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                  fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  background: batchPayForm.status === st.key ? '#1e5038' : 'transparent',
                  color: batchPayForm.status === st.key ? '#fff' : '#4a7060',
                  transition: 'all 0.15s ease',
                  minHeight: '40px',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {batchPayForm.status === 'Paid' && (
            <>
              {/* Mode Toggle */}
              <div className="ma-modal-mode-toggle">
                {['Cash', 'Cheque', 'UPI', 'Net Banking'].map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`ma-modal-mode-btn ${batchPayForm.mode === m ? 'active' : ''}`}
                    onClick={() => { setBatchPayForm(f => ({ ...f, mode: m, referenceNumber: '' })); setBatchPayError(''); }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Conditional Mode Fields */}
              {batchPayForm.mode === 'Cheque' && (
                <div className="ma-modal-field">
                  <label>Cheque Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-650124"
                    value={batchPayForm.referenceNumber}
                    onChange={e => setBatchPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                  />
                </div>
              )}
              {(batchPayForm.mode === 'UPI' || batchPayForm.mode === 'Net Banking') && (
                <div className="ma-modal-field">
                  <label>{batchPayForm.mode === 'UPI' ? 'UPI Transaction ID / UTR *' : 'IMPS / NEFT Reference *'}</label>
                  <input
                    type="text"
                    placeholder="e.g. 428190382910"
                    value={batchPayForm.referenceNumber}
                    onChange={e => setBatchPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                  />
                </div>
              )}
            </>
          )}

          <div className="ma-modal-field">
            <label>Notes / Settlement Reference (optional)</label>
            <input
              type="text"
              placeholder="e.g. Batch payment settlement"
              value={batchPayForm.notes}
              onChange={e => setBatchPayForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {batchPayError && <div className="ma-modal-error">{batchPayError}</div>}

          <div className="ma-modal-actions">
            <button className="ma-modal-btn-cancel" onClick={() => setBatchPayModalOpen(false)}>
              Cancel
            </button>
            <button
              className="ma-modal-btn-confirm"
              onClick={handleBatchRecordPayment}
              disabled={batchPaySaving}
            >
              {batchPaySaving ? 'Saving…' : `Confirm (${selectedPaymentIds.length})`}
            </button>
          </div>
        </div>
      </BaseModal>



      {/* Dentist Detail Modal */}
      {selectedUserId && (
        <DentistDetailModal
          userId={selectedUserId}
          users={users}
          onSelectDentist={(id) => setSelectedUserId(id)}
          onClose={() => setSelectedUserId(null)}
          onDeleteUser={() => {
            fetchUsers();
            fetchStats();
            fetchAllOrders();
            fetchPayments();
          }}
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

      {/* Consolidated Batch Invoice Statement Modal */}
      {batchStatementModal && (
        <PrintableInvoice
          statement={batchStatementModal}
          onClose={() => setBatchStatementModal(null)}
        />
      )}
    </div>
  );
};

export default MobileAdminDashboard;
