'use client';
/**
 * MobileAdminDashboard -- Full-featured touch-native mobile admin dashboard.
 * Primary Navigation: Dentists, Lab Orders, Payments & Billing.
 * 100% responsive, zero emojis, clean design with NO colored side lines.
 */
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '../../admin/AdminAuthContext';
import { useStaffAuth } from '../../staff/StaffAuthContext';
import ExecutiveAccountView from '../../admin/ExecutiveAccountView';
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
import MaintenanceModeController from '../../admin/MaintenanceModeController';
import { formatINR, formatDate, formatDoctorName } from '../../utils/format';
import { getAudioContext, openInvoiceWindow } from '../../utils/appleCompat';
import { useToast } from '../../context/ToastContext';
import './MobileAdminDashboard.css';

import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstSegmentedTabs } from '../../components/ui/twentyfirst-segmented-tabs';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { DentzyCard, DentzyKpiRow, DentzyCaseChip, DentzyStatusPill } from '../../components/common/DentzyCard';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import { TwentyFirstNavCard } from '../../components/ui/twentyfirst-nav-card';
import NoticeEditorCard, { STAFF_TICKER_MESSAGES } from '../../components/common/NoticeEditorCard';
import SubViewHeader from '../../components/common/SubViewHeader';
import MonthFilterBar from '../../components/common/MonthFilterBar';
import { BatchFloatingBar, BatchPaymentModal, PaymentModeToggle, validateBatchPaymentForm } from '../../components/common/BatchSettlementFlow';

const SETTINGS_SUBVIEW_TITLES = {
  notice: 'Dentist Portal Notice Bar',
  'staff-notice': 'Staff Portal Notice Bar',
  account: 'Administrator Account',
  maintenance: 'Maintenance Mode Controller',
};

const STAFF_SUBVIEW_TITLES = {
  members: 'Staff Members',
  attendance: 'Staff Attendance',
  inventory: 'Lab Inventory',
  metrics: 'Staff Metrics',
};

const DENTIST_TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
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
  const { admin, setAdmin, adminLogout, authFetch, ADMIN_API } = useAdminAuth();
  const { staff, staffLogout, updateStaffState } = useStaffAuth();
  const { showToast } = useToast();

  // Stable ref for authFetch — guaranteed initialized before any callback
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

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
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffSearch, setStaffSearch] = useState('');

  // Dentists view state
  const [activeTab, setActiveTab]         = useState('all');
  const [users, setUsers]                 = useState([]);
  const [stats, setStats]                 = useState({ total: 0, pending: 0, approved: 0, rejected: 0, archived: 0 });
  const [statsLoaded, setStatsLoaded]     = useState(false);
  const [loadingUsers, setLoadingUsers]   = useState(true);
  const [sortOrder, setSortOrder]         = useState('desc');
  const [search, setSearch]               = useState('');
  const [visiblePw, setVisiblePw]         = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Orders view state
  const [allOrders, setAllOrders]         = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter]     = useState('all');
  const [orderSearch, setOrderSearch]     = useState('');
  const [drillDentistOrders, setDrillDentistOrders] = useState(null); // { _id, name, clinicName }

  // Payments view state
  const [paymentData, setPaymentData]         = useState({ summary: null, payments: [] });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMode, setPayFilterMode]     = useState('all');
  const [payFilterMonth, setPayFilterMonth]   = useState('all');
  const [paySearch, setPaySearch]             = useState('');
  const [drillDentistPayments, setDrillDentistPayments] = useState(null); // { _id, name, clinicName }

  // Record Payment modal state
  const [payModal, setPayModal]         = useState(null);


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
  const [settingsSubView, setSettingsSubView] = useState(null); // null | 'notice' | 'staff-notice' | 'maintenance' | 'account'

  // Notice bar settings state
  const [noticeEnabled, setNoticeEnabled] = useState(true);
  const [noticeMessages, setNoticeMessages] = useState([
    'Welcome to Dentzy Clinical Lab Portal',
    'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
    'New: Zirconia monolithic crowns with multi-shade gradients now available',
    'Submit STL files for faster digital impression processing',
    'Invoices are generated upon case dispatch — check the Payments tab',
    'All cases backed by the Dentzy 5-10 Years Quality Guarantee',
    'Lab support: Mon-Sat, 9 AM to 6 PM IST',
  ]);
  const [noticeNewMsg, setNoticeNewMsg] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [noticeLoaded, setNoticeLoaded] = useState(false);

  // Staff notice bar settings state
  const [staffNoticeEnabled, setStaffNoticeEnabled] = useState(true);
  const [staffNoticeMessages, setStaffNoticeMessages] = useState([
    'Welcome to Dentzy Lab Operations Portal',
    'Ensure all case scans & QC checklists are logged before dispatch',
    'Priority cases marked Urgent must be completed within 24 hours',
    'Standard daily shift handover meeting at 6:00 PM',
    'Lab Support & Rush Desk hotline: +91 9503668112',
  ]);
  const [staffNoticeNewMsg, setStaffNoticeNewMsg] = useState('');
  const [staffNoticeSaving, setStaffNoticeSaving] = useState(false);
  const [staffNoticeLoaded, setStaffNoticeLoaded] = useState(false);
  const [maintenanceBadgeConfig, setMaintenanceBadgeConfig] = useState({ enabled: false, target: 'both' });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const handleMaintenanceConfigChanged = useCallback((updated) => {
    setMaintenanceBadgeConfig(updated);
  }, []);

  const fetchAllSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const [maintRes, noticeRes, staffNoticeRes] = await Promise.allSettled([
        authFetch(`${ADMIN_API}/settings/maintenance`),
        authFetch(`${ADMIN_API}/settings/notice`),
        authFetch(`${ADMIN_API}/settings/staff-notice`),
      ]);

      if (maintRes.status === 'fulfilled' && maintRes.value?.ok) {
        try {
          const d = await maintRes.value.json();
          setMaintenanceBadgeConfig(d);
        } catch {}
      }

      if (noticeRes.status === 'fulfilled' && noticeRes.value?.ok) {
        try {
          const d = await noticeRes.value.json();
          setNoticeEnabled(d.enabled !== false);
          const msgs = Array.isArray(d.messages) ? d.messages : (d.message ? [d.message] : null);
          if (msgs && msgs.length > 0) setNoticeMessages(msgs);
        } catch {}
      }

      if (staffNoticeRes.status === 'fulfilled' && staffNoticeRes.value?.ok) {
        try {
          const d = await staffNoticeRes.value.json();
          setStaffNoticeEnabled(d.enabled !== false);
          const msgs = Array.isArray(d.messages) ? d.messages : (d.message ? [d.message] : null);
          if (msgs && msgs.length > 0) setStaffNoticeMessages(msgs);
        } catch {}
      }
    } catch (err) {
      console.error('Mobile settings fetch error:', err);
    } finally {
      setSettingsLoading(false);
      setNoticeLoaded(true);
      setStaffNoticeLoaded(true);
    }
  }, [authFetch, ADMIN_API]);

  useEffect(() => {
    fetchAllSettings();
  }, [fetchAllSettings]);

  useEffect(() => {
    if (adminView === 'settings') {
      fetchAllSettings();
    }
  }, [adminView, fetchAllSettings]);

  // Common state
  const [actionLoading, setActionLoading] = useState(null);
  const [liveNotifs, setLiveNotifs]       = useState([]);
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
    } catch {} finally {
      setLoadingStaff(false);
    }
  }, [authFetch, ADMIN_API]);

  const adminName = admin?.username || 'Admin';
  const initials  = adminName.slice(0, 2).toUpperCase();

  /* -- Notification sound ------------------------------------------------ */
  const playNotifSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
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
      if (res && res.ok) {
        const d = await res.json();
        setNoticeEnabled(d.enabled !== false);
        const msgs = Array.isArray(d.messages) ? d.messages : (d.message ? [d.message] : null);
        if (msgs && msgs.length > 0) setNoticeMessages(msgs);
      }
    } catch {} finally {
      setNoticeLoaded(true);
    }
  }, [authFetch, ADMIN_API]);

  const handleNoticeSave = async () => {
    setNoticeSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/settings/notice`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: noticeEnabled, messages: noticeMessages }),
      });
      const data = await res?.json?.().catch(() => ({})) || {};
      if (res && res.ok) {
        showToast('Notice bar updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update notice bar.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setNoticeSaving(false);
    }
  };

  const fetchStaffNotice = useCallback(async () => {
    try {
      const res = await authFetch(`${ADMIN_API}/settings/staff-notice`);
      if (res && res.ok) {
        const d = await res.json();
        setStaffNoticeEnabled(d.enabled !== false);
        const msgs = Array.isArray(d.messages) ? d.messages : (d.message ? [d.message] : null);
        if (msgs && msgs.length > 0) setStaffNoticeMessages(msgs);
      }
    } catch {} finally {
      setStaffNoticeLoaded(true);
    }
  }, [authFetch, ADMIN_API]);

  const handleStaffNoticeSave = async () => {
    setStaffNoticeSaving(true);
    try {
      const res = await authFetch(`${ADMIN_API}/settings/staff-notice`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: staffNoticeEnabled, messages: staffNoticeMessages }),
      });
      const data = await res?.json?.().catch(() => ({})) || {};
      if (res && res.ok) {
        showToast('Staff notice bar updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update staff notice bar.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setStaffNoticeSaving(false);
    }
  };

  /* -- Data fetching ----------------------------------------------------- */

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {} finally {
      setStatsLoaded(true);
    }
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
    } catch {} finally {
      setLoadingUsers(false);
    }
  }, [ADMIN_API, activeTab, sortOrder]);

  const fetchAllOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await authFetchRef.current(`${ADMIN_API}/orders?limit=200&sort=createdAt&order=desc`);
      if (res.ok) {
        const d = await res.json();
        setAllOrders(d.orders || []);
      }
    } catch {} finally {
      setLoadingOrders(false);
    }
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
    } catch {} finally {
      setLoadingPayments(false);
    }
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

  // Refresh admin data on window focus
  useEffect(() => {
    if (!admin?.username) return;
    const onFocus = () => {
      fetchUsersRef.current?.();
      fetchStatsRef.current?.();
      fetchAllOrdersRef.current?.();
      fetchPaymentsRef.current?.();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [admin?.username]);

  /* -- Toast helper (using context) -------------------------------------- */

  /* -- User Actions ------------------------------------------------------ */
  const handleApprove = async (userId, userName) => {
    setConfirmConfig({
      title: 'Approve Dentist',
      message: `Are you sure you want to approve "${formatDoctorName(userName, 'this dentist')}"?`,
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
      message: `Are you sure you want to reject "${formatDoctorName(userName, 'this dentist')}"?`,
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
      message: `Are you sure you want to delete "${formatDoctorName(userName, 'this dentist')}"? This action cannot be undone.`,
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
    const validationError = validateBatchPaymentForm(batchPayForm);
    if (validationError) {
      setBatchPayError(validationError);
      return;
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
    const validationError = validateBatchPaymentForm(payForm);
    if (validationError) {
      setPayFormError(validationError);
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
  const filteredUsers = (users || []).filter(u => {
    const isArch =
      u?.isArchived ||
      u?.status === 'archived' ||
      u?.email?.includes('@dentzy.invalid') ||
      u?.adminNote?.startsWith('ACCOUNT_ARCHIVED') ||
      u?.adminNote?.startsWith('ACCOUNT_CLOSED');
    if (activeTab === 'archived' ? !isArch : isArch) return false;
    const q = (search || '').toLowerCase();
    return (
      (u?.name || '').toLowerCase().includes(q) ||
      (u?.email || '').toLowerCase().includes(q) ||
      (u?.clinicName || '').toLowerCase().includes(q)
    );
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(admin?.isExecutiveStaff || admin?.designation) && (
              <span style={{
                background: '#1e5038',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-block',
              }}>
                {admin?.designation || 'CEO'}
              </span>
            )}
            <button
              type="button"
              className="dz-avatar dz-avatar--admin"
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
          </div>
        }
      />




      {/* Persistent Maintenance Mode Banner */}
      {maintenanceBadgeConfig?.enabled && (
        <div
          onClick={() => {
            setAdminView('settings');
            setSettingsSubView('maintenance');
          }}
          style={{
            margin: '8px 16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.12)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'dzPulseDot 1.5s infinite ease-in-out', flexShrink: 0 }} />
          <span>
            Maintenance Active: {
              maintenanceBadgeConfig?.target === 'both' ? 'Dentists & Staff' :
              maintenanceBadgeConfig?.target === 'dentists' ? 'Dentists Only' : 'Staff Only'
            }
          </span>
        </div>
      )}

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
          <SubViewHeader
            title="Registered Dentists"
            count={statsLoaded || users.length > 0 ? (stats.total || users.length) : undefined}
            onBack={() => setDentistSubView(null)}
            backLabel="Back to Dentists"
            style={{ padding: '12px 16px 0', marginBottom: '12px' }}
          />

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
                count: statsLoaded && tab.key !== 'all' ? (stats[tab.key] || 0) : undefined,
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
                  const isArchived = user.status === 'archived' || Boolean(user.isArchived);
                  return (
                  <div key={uId} className={`ma-user-card ma-uc--${user.status}`}
                    onClick={() => setSelectedUserId(uId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ma-uc-top">
                      <div className="dz-avatar dz-avatar--sm">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
                      <div className="ma-uc-info">
                        <span className="ma-uc-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {formatDoctorName(user?.name, 'Unnamed Dentist')}
                          <DentzyStatusPill
                            type="account"
                            status={isArchived ? 'archived' : user.status}
                            label={isArchived ? (user.archiveReason || 'Archived') : user.status}
                            pulse={!isArchived && user.status === 'pending'}
                          />
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


                    {/* Inline action buttons based on status — hidden for archived accounts */}
                    {!isArchived && (user.status === 'pending' || user.status === 'rejected') && (
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
          {drillDentistOrders ? (
            /* ── Drill-down: single dentist's orders ── */
            <>
              <SubViewHeader
                title={formatDoctorName(drillDentistOrders.name)}
                subtitle={drillDentistOrders.clinicName || undefined}
                onBack={() => { setDrillDentistOrders(null); setOrderFilter('all'); setOrderSearch(''); }}
                backLabel="Back to Lab Orders"
                style={{ padding: '12px 16px 0', marginBottom: '12px' }}
              />

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
                          <DentzyCaseChip caseId={o.caseId} />
                        </div>

                        <div className="ma-card-meta-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <DentzyStatusPill type="workflow" status={o.status || 'Pending'} />
                          <DentzyStatusPill type="payment" status={o.paymentStatus || 'Pending'} label={o.paymentStatus === 'Paid' && o.paymentMode ? `Paid · ${o.paymentMode}` : (o.paymentStatus || 'Pending')} />
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
            <>
              <SubViewHeader
                title="Lab Orders"
                count={dentistOrderGroups.length}
                onBack={() => setDentistSubView(null)}
                backLabel="Back to Dentist Management"
                style={{ padding: '12px 16px 0', marginBottom: '12px' }}
              />
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
                              <div className="dz-avatar dz-avatar--sm">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                              <div>
                                <span className="ma-card-title">{formatDoctorName(d.name, 'Unknown')}</span>
                                {d.clinicName && <div className="ma-card-sub">{d.clinicName}</div>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e5038' }}>{d.orders.length} {d.orders.length === 1 ? 'Order' : 'Orders'} ›</span>
                          </div>
                          <div className="ma-card-meta-row" style={{ marginTop: '8px' }}>
                            {inProgress > 0 && <DentzyStatusPill status="In Progress" label={`${inProgress} In Progress`} type="workflow" />}
                            {pending > 0 && <DentzyStatusPill status="Pending" label={`${pending} Pending`} type="workflow" />}
                            {completed > 0 && <DentzyStatusPill status="Completed" label={`${completed} Completed`} type="workflow" />}
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

      {adminView === 'dentists' && dentistSubView === 'payments' && (
        <>
          <SubViewHeader
            title={drillDentistPayments ? formatDoctorName(drillDentistPayments.name) : 'Payments & Billing'}
            subtitle={drillDentistPayments?.clinicName || undefined}
            onBack={() => {
              if (drillDentistPayments) {
                setDrillDentistPayments(null);
                setSelectedPaymentIds([]);
                setPayFilterStatus('all');
                setPayFilterMode('all');
                setPayFilterMonth('all');
                setPaySearch('');
              } else {
                setDentistSubView(null);
              }
            }}
            backLabel={drillDentistPayments ? 'Back to All Payments' : 'Back to Dentist Management'}
            rightAction={
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
                  minHeight: '44px',
                }}
              >
                <option value="all">All Dentists</option>
                {users.filter(u => u.status === 'approved').map(u => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {formatDoctorName(u.name)} {u.clinicName ? `(${u.clinicName})` : ''}
                  </option>
                ))}
              </select>
            }
            style={{ padding: '12px 16px 0', marginBottom: '12px' }}
          />
          {drillDentistPayments ? (
            /* ── Drill-down: single dentist's payments ── */
            <>

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
              <div style={{ padding: '0 16px', marginBottom: '12px' }}>
                <MonthFilterBar
                  id="ma-month-picker"
                  value={payFilterMonth}
                  onChange={setPayFilterMonth}
                  clearValue="all"
                  isMobile={true}
                  extraActions={
                    <>
                      {payFilterMonth !== 'all' && (
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
                          openInvoiceWindow(url);
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
                        {Ico.download(13)}
                        Download Pending Bill
                      </button>
                    </>
                  }
                />
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
                            <DentzyCaseChip caseId={p.caseId} />
                            <div className="ma-card-amount-lg">
                              {formatINR(p.amount || 0)}
                            </div>
                          </div>
                        </div>

                        <div className="ma-card-meta-row">
                          <DentzyStatusPill type="payment" status={p.paymentStatus || 'Pending'} />
                          {p.paymentStatus === 'Paid' && p.paymentMode && (
                            <DentzyStatusPill type="mode" status={p.paymentMode} />
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
              <BatchFloatingBar
                count={selectedPaymentIds.length}
                totalAmount={filteredPaymentsForDrill
                  .filter(p => selectedPaymentIds.includes(p._id))
                  .reduce((s, p) => s + (Number(p.amount) || 0), 0)}
                onDeselect={() => setSelectedPaymentIds([])}
                onSettle={() => {
                  setBatchPayForm({ mode: 'Cash', referenceNumber: '', notes: '', status: 'Paid' });
                  setBatchPayError('');
                  setBatchPayModalOpen(true);
                }}
                settleLabel={`Settle (${selectedPaymentIds.length})`}
                variant="fixed"
                isMobile={true}
              />
            </>
          ) : (
            /* ── Dentist cards overview for payments ── */
            <>

              {/* #57 — Total summary bar */}
              {paymentData.summary && (
                <div style={{ padding: '4px 16px 0' }}>
                  <DentzyKpiRow
                    className="ma-kpi-row ma-kpi-row--3"
                    style={{ marginBottom: '8px' }}
                    items={[
                      {
                        key: 'totalBilled',
                        label: 'Total Billed',
                        value: formatINR(paymentData.summary.totalBilled || 0),
                      },
                      {
                        key: 'collected',
                        label: 'Collected',
                        value: formatINR(paymentData.summary.totalCollected || 0),
                        tone: 'success',
                      },
                      {
                        key: 'outstanding',
                        label: 'Outstanding',
                        value: formatINR((paymentData.summary.totalBilled || 0) - (paymentData.summary.totalCollected || 0)),
                        tone: 'warning',
                      },
                    ]}
                  />
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
                              <div className="dz-avatar dz-avatar--sm">{(d.name || 'U').charAt(0).toUpperCase()}</div>
                              <div>
                                <span className="ma-card-title">{formatDoctorName(d.name, 'Unknown')}</span>
                                {d.clinicName && <div className="ma-card-sub">{d.clinicName}</div>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e5038' }}>{d.payments.length} {d.payments.length === 1 ? 'Case' : 'Cases'} ›</span>
                          </div>
                          <div className="ma-card-meta-row" style={{ marginTop: '8px' }}>
                            {/* #56 — Only show non-zero values */}
                            {d.totalBilled > 0 && (
                              <DentzyStatusPill type="clinic" label={`Billed ${formatINR(d.totalBilled)}`} />
                            )}
                            {d.totalCollected > 0 && (
                              <DentzyStatusPill type="payment" status="Paid" label={`Collected ${formatINR(d.totalCollected)}`} />
                            )}
                            {d.totalPending > 0 && (
                              <DentzyStatusPill type="payment" status="Pending" label={`Pending ${formatINR(d.totalPending)}`} />
                            )}
                            {unpaid > 0 && (
                              <DentzyStatusPill type="workflow" status="Cancelled" label={`${unpaid} Unpaid`} />
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
          <SubViewHeader
            title={STAFF_SUBVIEW_TITLES[staffSubView] || 'Staff Management'}
            onBack={() => setStaffSubView(null)}
            backLabel="Back to Staff Management"
            style={{ padding: '12px 16px 0', marginBottom: '4px' }}
          />

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
                label="Maintenance Mode Controller"
                desc="Audience targeting, custom message, and live recovery"
                icon={Ico.shield ? Ico.shield(20) : Ico.lock(20)}
                onClick={() => setSettingsSubView('maintenance')}
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
            <SubViewHeader
              title={SETTINGS_SUBVIEW_TITLES[settingsSubView] || ''}
              subtitle="Settings & Analytics / Sub-view"
              onBack={() => setSettingsSubView(null)}
              backLabel="Back to Settings"
            />

            {/* Sub-view 1: Notice Bar Manager */}
            {settingsSubView === 'notice' && (
              <NoticeEditorCard
                toggleLabel="Show Notice Bar"
                toggleDescription="Toggle scrolling ticker across dentist portals"
                enabled={noticeEnabled}
                onToggle={setNoticeEnabled}
                messages={noticeMessages}
                onChange={setNoticeMessages}
                newMessage={noticeNewMsg}
                onNewMessageChange={setNoticeNewMsg}
                onSave={handleNoticeSave}
                saving={noticeSaving}
                loaded={noticeLoaded}
                isMobile={true}
                placeholder="Add an announcement..."
                listLabel="Announcements"
              />
            )}

            {/* Sub-view: Staff Notice Bar Manager */}
            {settingsSubView === 'staff-notice' && (
              <NoticeEditorCard
                toggleLabel="Show Notice Bar to Staff"
                toggleDescription="Toggle scrolling ticker across staff portals"
                enabled={staffNoticeEnabled}
                onToggle={setStaffNoticeEnabled}
                messages={staffNoticeMessages}
                onChange={setStaffNoticeMessages}
                newMessage={staffNoticeNewMsg}
                onNewMessageChange={setStaffNoticeNewMsg}
                onSave={handleStaffNoticeSave}
                saving={staffNoticeSaving}
                loaded={staffNoticeLoaded}
                isMobile={true}
                defaultMessages={STAFF_TICKER_MESSAGES}
                placeholder="Add a staff announcement..."
                listLabel="Staff Announcements"
              />
            )}

            {/* Sub-view: Maintenance Mode Controller */}
            {settingsSubView === 'maintenance' && (
              <div style={{ width: '100%' }}>
                <MaintenanceModeController
                  ADMIN_API={ADMIN_API}
                  authFetch={authFetch}
                  showToast={showToast}
                  onConfigChanged={handleMaintenanceConfigChanged}
                />
              </div>
            )}

            {/* Sub-view 4: Administrator Account */}
            {settingsSubView === 'account' && (
              (admin?.isExecutiveStaff || staff) ? (
                <ExecutiveAccountView
                  admin={admin}
                  staff={staff}
                  authFetch={authFetch}
                  staffLogout={staffLogout}
                  adminLogout={adminLogout}
                  router={router}
                  showToast={showToast}
                  updateStaffState={updateStaffState}
                  setAdmin={setAdmin}
                />
              ) : (
                <DentzyCard style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
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
                </DentzyCard>
              )
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
        title="Record Payment"
        subtitle={payModal ? `${payModal.caseId} · ${payModal.patientName || ''}${payModal.owner?.name ? ` (${formatDoctorName(payModal.owner.name)})` : ''}` : undefined}
        footer={
          <div className="ma-modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
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
        }
        maxWidth="max-w-md"
        id="ma-pay-modal"
      >
        {payModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
            <div className="ma-modal-info">
              <div><strong>Case:</strong> {payModal.caseId}</div>
              <div><strong>Patient:</strong> {payModal.patientName}</div>
              {payModal.owner?.name && <div><strong>Dentist:</strong> {formatDoctorName(payModal.owner.name)}</div>}
            </div>

            {/* Mode Switcher */}
            <PaymentModeToggle
              value={payForm.mode}
              modes={['Cash', 'Cheque', 'UPI']}
              onChange={(m) => {
                setPayForm(f => ({ ...f, mode: m, referenceNumber: '' }));
                setPayFormError('');
              }}
            />

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
          </div>
        )}
      </BaseModal>

      {/* ─────────────────────────────────────────────────────────────
          BATCH RECORD PAYMENT MODAL (Mobile Dialog)
          ───────────────────────────────────────────────────────────── */}
      <BatchPaymentModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        selectedCount={selectedPaymentIds.length}
        totalAmount={filteredPaymentsForDrill
          .filter(p => selectedPaymentIds.includes(p._id))
          .reduce((s, p) => s + (Number(p.amount) || 0), 0)}
        dentistName={drillDentistPayments?.name || ''}
        clinicName={drillDentistPayments?.clinicName || ''}
        form={batchPayForm}
        onFormChange={setBatchPayForm}
        onConfirm={handleBatchRecordPayment}
        saving={batchPaySaving}
        error={batchPayError}
        onClearError={() => setBatchPayError('')}
        id="ma-batch-pay-modal"
      />



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
