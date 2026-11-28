'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import StaffNoticeBar from '../../components/common/StaffNoticeBar';
import StaffSettingsView from '../common/StaffSettingsView';
import StaffOrderModal from '../StaffOrderModal';
import StaffPaymentModal from '../StaffPaymentModal';
import CreateOrderModal from '../../components/common/CreateOrderModal';
import PrintableInvoice from '../../components/common/PrintableInvoice';
import {
  StaffSummaryTilesSkeleton,
  DentistFinanceCardsSkeleton,
  DentistCardSkeleton,
  StaffOrderRowSkeleton,
  StaffPayRowSkeleton,
} from '../../components/SkeletonBlocks';
import { formatINR, formatDoctorName } from '../../utils/format';
import { openInvoiceWindow } from '../../utils/appleCompat';
import useIsMobile from '../../hooks/useIsMobile';
import { DentzyCard, DentzyCaseChip, DentzyKpiRow, DentzyStatusPill } from '../../components/common/DentzyCard';
import { DentzyDataTable } from '../../components/common/DentzyChartTable';
import DentzySearchBar from '../../components/common/DentzySearchBar';
import EmptyState from '../../components/common/EmptyState';
import MonthFilterBar from '../../components/common/MonthFilterBar';
import SubViewHeader from '../../components/common/SubViewHeader';
import {
  BatchFloatingBar,
  BatchPaymentModal,
  validateBatchPaymentForm,
} from '../../components/common/BatchSettlementFlow';
import PortalNavbar from '../../components/common/PortalNavbar';
import PortalSidebar from '../../components/common/PortalSidebar';
import '../StaffDashboard.css';

const ORDER_STAGES = [
  { key: 'all', label: 'All Stages' },
  { key: 'received', label: 'Received' },
  { key: 'design', label: 'CAD Design' },
  { key: 'production', label: 'Production' },
  { key: 'qc', label: 'QC' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'completed', label: 'Completed' },
];

const PAYMENT_STATUSES = [
  { key: 'all', label: 'All Statuses' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Paid', label: 'Paid' },
  { key: 'Overdue', label: 'Overdue' },
];

/**
 * ReceptionistStaffDashboard — Dedicated dashboard for Receptionist designation.
 * 3 Tabs: 'dentists' | 'payments' | 'profile'. Default: 'dentists'.
 * Tab 1: Dentists (Sub-View A: Dentist Grid with CardSkeletons, Sub-View B: Selected Dentist Orders & New Order).
 * Tab 2: Payments (Sub-View A: Overview StatCards & Dentist Financial Badges, Sub-View B: Selected Dentist Statements & Batch Settlement).
 * Tab 3: Profile (<StaffSettingsView />).
 * Mobile: TwentyFirstBottomNav (Dentists, Payments, Profile).
 */
export default function ReceptionistStaffDashboard() {
  const { authFetch, STAFF_API, staff, staffLogout } = useStaffAuth();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const apiBase = STAFF_API || '/api/staff';

  const [activeTab, setActiveTab] = useState('dentists'); // 'dentists' | 'payments' | 'profile'
  const [profileResetTick, setProfileResetTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Dentists State ────────────────────────────────────────────────────────
  const [dentists, setDentists] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [dentistSearch, setDentistSearch] = useState('');

  // Selected Dentist for Dentists Tab (Sub-View B)
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [dentistOrders, setDentistOrders] = useState([]);
  const [loadingDentistOrders, setLoadingDentistOrders] = useState(false);
  const [orderStageFilter, setOrderStageFilter] = useState('all');

  // Selected Dentist for Payments Tab (Sub-View B)
  const [selectedPayDentist, setSelectedPayDentist] = useState(null);
  const [payDentistOrders, setPayDentistOrders] = useState([]);
  const [loadingPayDentistOrders, setLoadingPayDentistOrders] = useState(false);
  const [payMonthFilter, setPayMonthFilter] = useState('all');
  const [payStatusFilter, setPayStatusFilter] = useState('all');

  // ── Global Payments State ─────────────────────────────────────────────────
  const [allPayments, setAllPayments] = useState([]);
  const [loadingAllPayments, setLoadingAllPayments] = useState(true);

  // ── Multi-select Batch Payment State ──────────────────────────────────────
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [batchPayForm, setBatchPayForm] = useState({
    status: 'Paid',
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
  });
  const [batchPaySaving, setBatchPaySaving] = useState(false);
  const [batchPayError, setBatchPayError] = useState('');

  // ── Modals State ──────────────────────────────────────────────────────────
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [editOrderSaving, setEditOrderSaving] = useState(false);
  const [editPaymentModal, setEditPaymentModal] = useState(null);
  const [editPaymentSaving, setEditPaymentSaving] = useState(false);
  const [singleInvoiceModal, setSingleInvoiceModal] = useState(null);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchDentists = useCallback(async () => {
    setLoadingDentists(true);
    try {
      const res = await authFetch(`${apiBase}/users`);
      if (res.ok) {
        const data = await res.json();
        setDentists(data.users || []);
      }
    } catch {
      showToast('Error loading dentists.', 'error');
    } finally {
      setLoadingDentists(false);
    }
  }, [authFetch, apiBase, showToast]);

  const fetchAllPayments = useCallback(async () => {
    setLoadingAllPayments(true);
    try {
      const res = await authFetch(`${apiBase}/payments`);
      if (res.ok) {
        const data = await res.json();
        setAllPayments(data.payments || []);
      }
    } catch {
      showToast('Error loading payments overview.', 'error');
    } finally {
      setLoadingAllPayments(false);
    }
  }, [authFetch, apiBase, showToast]);

  useEffect(() => {
    fetchDentists();
    fetchAllPayments();
  }, [fetchDentists, fetchAllPayments]);

  // Fetch details & orders for Dentists Tab (Sub-View B)
  const fetchDentistDetail = useCallback(async (dentistId) => {
    setLoadingDentistOrders(true);
    try {
      const res = await authFetch(`${apiBase}/users/${dentistId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDentist(data.user);
        setDentistOrders(data.orders || []);
      }
    } catch {
      showToast('Failed to load dentist details.', 'error');
    } finally {
      setLoadingDentistOrders(false);
    }
  }, [authFetch, apiBase, showToast]);

  // Fetch details & orders for Payments Tab (Sub-View B)
  const fetchPayDentistDetail = useCallback(async (dentistId) => {
    setLoadingPayDentistOrders(true);
    try {
      const res = await authFetch(`${apiBase}/users/${dentistId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPayDentist(data.user);
        setPayDentistOrders(data.orders || []);
      }
    } catch {
      showToast('Failed to load dentist billing details.', 'error');
    } finally {
      setLoadingPayDentistOrders(false);
    }
  }, [authFetch, apiBase, showToast]);

  // ── Dentists Tab Filters ──────────────────────────────────────────────────
  const filteredDentists = useMemo(() => {
    if (!dentistSearch.trim()) return dentists;
    const q = dentistSearch.toLowerCase().trim();
    return dentists.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const clinic = (d.clinicName || '').toLowerCase();
      const email = (d.email || '').toLowerCase();
      const phone = (d.phone || '').toLowerCase();
      return name.includes(q) || clinic.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [dentists, dentistSearch]);

  const filteredSelectedDentistOrders = useMemo(() => {
    if (orderStageFilter === 'all') return dentistOrders;
    return dentistOrders.filter((o) => (o.stage || 'received').toLowerCase() === orderStageFilter.toLowerCase());
  }, [dentistOrders, orderStageFilter]);

  // ── Payments Tab Filters ──────────────────────────────────────────────────
  // Compute financial totals across all payments
  const paymentsSummary = useMemo(() => {
    let billed = 0;
    let collected = 0;
    let pending = 0;
    allPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      billed += amt;
      if (p.paymentStatus === 'Paid') {
        collected += amt;
      } else {
        pending += amt;
      }
    });
    return { billed, collected, pending };
  }, [allPayments]);

  // Map dentist payments for financial summary cards per dentist
  const dentistFinancialMap = useMemo(() => {
    const map = {};
    dentists.forEach((d) => {
      const id = d._id || d.id;
      map[id] = {
        dentist: d,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        unpaidCount: 0,
        totalCases: 0,
      };
    });

    allPayments.forEach((p) => {
      const dentistId = p.ownerId || p.owner?._id || p.owner?.id;
      if (dentistId && map[dentistId]) {
        const amt = Number(p.amount) || 0;
        map[dentistId].totalBilled += amt;
        map[dentistId].totalCases += 1;
        if (p.paymentStatus === 'Paid') {
          map[dentistId].totalCollected += amt;
        } else {
          map[dentistId].totalPending += amt;
          map[dentistId].unpaidCount += 1;
        }
      }
    });

    return Object.values(map);
  }, [dentists, allPayments]);

  const filteredPayDentistOrders = useMemo(() => {
    return payDentistOrders.filter((o) => {
      const hasPay = o.paymentAmount > 0 || o.paymentStatus;
      if (!hasPay) return false;
      if (payMonthFilter !== 'all') {
        const dateStr = o.createdAt || o.invoiceDate || '';
        const month = dateStr.slice(0, 7);
        if (month && month !== payMonthFilter) return false;
      }
      if (payStatusFilter !== 'all') {
        if ((o.paymentStatus || 'Pending').toLowerCase() !== payStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [payDentistOrders, payMonthFilter, payStatusFilter]);

  const totalSelectedAmount = useMemo(() => {
    return payDentistOrders
      .filter((o) => selectedPaymentIds.includes(o._id || o.id || o.caseId))
      .reduce((sum, o) => sum + (Number(o.paymentAmount) || 0), 0);
  }, [payDentistOrders, selectedPaymentIds]);

  // ── Multi-select handlers ─────────────────────────────────────────────────
  const togglePaymentSelect = (orderId) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAllVisiblePayments = () => {
    const currentIds = filteredPayDentistOrders.map((o) => o._id || o.id || o.caseId);
    const allSelected = currentIds.length > 0 && currentIds.every((id) => selectedPaymentIds.includes(id));
    if (allSelected) {
      setSelectedPaymentIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedPaymentIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleSelectAllPending = () => {
    const pendingIds = payDentistOrders
      .filter((o) => (o.paymentAmount > 0 || o.paymentStatus) && o.paymentStatus !== 'Paid')
      .map((o) => o._id || o.id || o.caseId);
    setSelectedPaymentIds((prev) => Array.from(new Set([...prev, ...pendingIds])));
  };

  // ── Action Handlers ───────────────────────────────────────────────────────
  const handleCreateOrderSubmit = async (payload) => {
    setCreatingOrder(true);
    try {
      const res = await authFetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Order created successfully.');
        setShowCreateOrder(false);
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
        fetchDentists();
      } else {
        showToast(data.message || 'Failed to create order.', 'error');
      }
    } catch {
      showToast('Network error while creating order.', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleEditOrderSubmit = async (order, form) => {
    setEditOrderSaving(true);
    try {
      const res = await authFetch(`${apiBase}/orders/${order._id || order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Order updated.');
        setEditOrderModal(null);
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
      } else {
        showToast(data.message || 'Failed to update order.', 'error');
      }
    } catch {
      showToast('Network error updating order.', 'error');
    } finally {
      setEditOrderSaving(false);
    }
  };

  const handleEditPaymentSubmit = async (payment, form) => {
    setEditPaymentSaving(true);
    try {
      if (form.amount !== undefined && form.amount !== '') {
        await authFetch(`${apiBase}/payments/${payment.paymentId || payment._id}/amount`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(form.amount) }),
        });
      }
      const res = await authFetch(`${apiBase}/payments/${payment.paymentId || payment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment updated.');
        setEditPaymentModal(null);
        fetchAllPayments();
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
        if (selectedPayDentist) fetchPayDentistDetail(selectedPayDentist._id || selectedPayDentist.id);
      } else {
        showToast(data.message || 'Failed to update payment.', 'error');
      }
    } catch {
      showToast('Network error updating payment.', 'error');
    } finally {
      setEditPaymentSaving(false);
    }
  };

  const handleBatchPaymentSubmit = async () => {
    if (selectedPaymentIds.length === 0) return;
    setBatchPayError('');
    const validationError = validateBatchPaymentForm(batchPayForm);
    if (validationError) {
      setBatchPayError(validationError);
      return;
    }
    setBatchPaySaving(true);
    try {
      const activeMode = batchPayForm.mode ?? batchPayForm.paymentMode ?? 'Cash';
      const res = await authFetch(`${apiBase}/payments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedPaymentIds,
          status: batchPayForm.status,
          paymentMode: batchPayForm.status === 'Paid' ? activeMode : '',
          referenceNumber: batchPayForm.status === 'Paid' ? (batchPayForm.referenceNumber || '') : '',
          notes: batchPayForm.notes || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Settled ${selectedPaymentIds.length} orders.`);
        setBatchPayModalOpen(false);
        setBatchPayError('');
        setSelectedPaymentIds([]);
        fetchAllPayments();
        if (selectedPayDentist) fetchPayDentistDetail(selectedPayDentist._id || selectedPayDentist.id);
      } else {
        const errMsg = data.message || 'Batch settlement failed.';
        setBatchPayError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch {
      const errMsg = 'Network error during batch settlement.';
      setBatchPayError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setBatchPaySaving(false);
    }
  };

  // ── Mobile Navigation Items ───────────────────────────────────────────────
  const mobileNavItems = useMemo(
    () => [
      {
        key: 'dentists',
        label: 'Dentists',
        icon: (active) => Ico.clinic(typeof active === 'number' ? active : (active ? 20 : 18)),
      },
      {
        key: 'payments',
        label: 'Payments',
        icon: (active) =>
          Ico.payments
            ? Ico.payments(typeof active === 'number' ? active : (active ? 20 : 18))
            : Ico.wallet(typeof active === 'number' ? active : (active ? 20 : 18)),
      },
      {
        key: 'profile',
        label: 'Profile',
        icon: (active) => Ico.user(typeof active === 'number' ? active : (active ? 20 : 18)),
      },
    ],
    []
  );

  const receptionistNavItems = useMemo(
    () => [
      {
        key: 'dentists',
        label: 'Dentists',
        icon: (size) => Ico.clinic(size || 16),
        onClick: () => {
          setActiveTab('dentists');
          setSelectedPayDentist(null);
        },
      },
      {
        key: 'payments',
        label: 'Payments',
        icon: (size) => (Ico.payments ? Ico.payments(size || 16) : Ico.wallet(size || 16)),
        onClick: () => {
          setActiveTab('payments');
          setSelectedDentist(null);
        },
      },
      {
        key: 'profile',
        label: 'Profile',
        icon: (size) => Ico.user(size || 16),
        onClick: () => {
          setActiveTab('profile');
          setProfileResetTick((t) => t + 1);
        },
      },
    ],
    []
  );

  const staffUser = {
    name: staff?.displayName || 'Receptionist',
    role: 'Receptionist',
    avatar: staff?.displayName ? staff.displayName.charAt(0).toUpperCase() : 'R',
    onProfileClick: () => {
      setActiveTab('profile');
      setProfileResetTick((t) => t + 1);
    },
    title: 'My Profile',
  };

  return (
    <div className="sd-shell">
      {/* ── Unified Top Navbar ────────────────────────────────────────── */}
      <PortalNavbar
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        sidebarOpen={sidebarOpen}
        portalTitle="Reception Desk"
        portalBadge="Receptionist Portal"
        user={staffUser}
        onLogout={staffLogout}
      />

      {/* ── Unified Sidebar ───────────────────────────────────────────── */}
      <PortalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={receptionistNavItems}
        activeKey={activeTab}
        user={staffUser}
        onLogout={staffLogout}
        logoutId="receptionist-logout-btn"
      />

      {/* ── Notice Bar ────────────────────────────────────────────────────── */}
      <StaffNoticeBar />

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="sd-main" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '16px' }}>
        {/* =================================================================== */}
        {/* TAB 3: PROFILE VIEW                                                 */}
        {/* =================================================================== */}
        {activeTab === 'profile' && <StaffSettingsView resetTick={profileResetTick} />}

        {/* =================================================================== */}
        {/* TAB 1: DENTISTS VIEW                                                */}
        {/* =================================================================== */}
        {activeTab === 'dentists' && (
          <div>
            {!selectedDentist ? (
              /* ── SUB-VIEW A: Dentists Grid ──────────────────────────────── */
              <div>
                <div className="sd-section-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h2 className="sd-section-title" style={{ margin: 0 }}>Registered Dentists</h2>
                    <div style={{ fontSize: '0.8rem', color: '#527264', marginTop: '2px' }}>
                      {filteredDentists.length} active dental accounts
                    </div>
                  </div>

                  <div className="sd-controls" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <DentzySearchBar
                      placeholder="Search dentists, clinic, phone..."
                      value={dentistSearch}
                      onChange={(e) => setDentistSearch(e.target.value)}
                      onClear={() => setDentistSearch('')}
                      style={{ minWidth: '240px' }}
                    />
                  </div>
                </div>

                {loadingDentists ? (
                  <DentistCardSkeleton />
                ) : filteredDentists.length === 0 ? (
                  <EmptyState
                    compact
                    variant="dentists"
                    message="No Dentists Found"
                    subtext={dentistSearch ? 'No dentists matching your search query.' : 'No registered dentists in the system.'}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {filteredDentists.map((d) => {
                      const dentistId = d._id || d.id;
                      const initials = (d.name || 'D')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <DentzyCard
                          key={dentistId}
                          interactive={true}
                          onClick={() => {
                            setSelectedDentist(d);
                            fetchDentistDetail(dentistId);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                className="dz-avatar dz-avatar--square"
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  background: 'var(--dz-color-surface-tint, #eef6f2)',
                                  color: 'var(--dz-color-primary-accent, #1e5038)',
                                  fontWeight: 800,
                                  fontSize: '0.95rem',
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e2924' }}>
                                  {formatDoctorName(d.name, 'Unnamed Dentist')}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#527264', fontWeight: 600 }}>
                                  {d.clinicName || 'Clinic Name Not Provided'}
                                </div>
                              </div>
                            </div>

                            <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                              {Ico.chevronRight(18)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                            {d.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {Ico.phone(12)}
                                <span>{d.phone}</span>
                              </div>
                            )}
                            {d.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {Ico.mail(12)}
                                <span>{d.email}</span>
                              </div>
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid #f0f4f2', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e5038', background: '#eef6f2', padding: '2px 8px', borderRadius: '6px' }}>
                              View Case History
                            </span>
                            {d.activeOrders !== undefined && (
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                {d.activeOrders} active cases
                              </span>
                            )}
                          </div>
                        </DentzyCard>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ── SUB-VIEW B: Selected Dentist Details & Orders ─────────── */
              <div>
                <SubViewHeader
                  title={formatDoctorName(selectedDentist.name)}
                  subtitle={[selectedDentist.clinicName, selectedDentist.phone, selectedDentist.email]
                    .filter(Boolean)
                    .join(' · ')}
                  onBack={() => {
                    setSelectedDentist(null);
                    setDentistOrders([]);
                  }}
                  backLabel="Back to Dentists List"
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowCreateOrder(true)}
                      style={{
                        background: '#1e5038',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        minHeight: '44px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(30,80,56,0.2)',
                      }}
                    >
                      {Ico.plus(15, 'currentColor', 2.5)}
                      <span>New Order</span>
                    </button>
                  }
                />

                {/* Status Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
                  {ORDER_STAGES.map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      className={`sd-filter-btn ${orderStageFilter === st.key ? 'sd-filter-btn--active' : ''}`}
                      onClick={() => setOrderStageFilter(st.key)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Order List */}
                {loadingDentistOrders ? (
                  <StaffOrderRowSkeleton count={4} />
                ) : filteredSelectedDentistOrders.length === 0 ? (
                  <EmptyState
                    compact
                    variant="orders"
                    message="No Orders Found"
                    subtext={
                      orderStageFilter !== 'all'
                        ? `No orders matching stage "${orderStageFilter}".`
                        : 'No orders have been submitted for this dentist yet.'
                    }
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredSelectedDentistOrders.map((order) => {
                      const oid = order._id || order.id || order.caseId;
                      return (
                        <DentzyCard
                          key={oid}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <DentzyCaseChip caseId={order.caseId} />
                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e2924' }}>
                                  {order.patientName || 'Unnamed Patient'}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f0f4f2', color: '#2d5a45', padding: '2px 8px', borderRadius: '6px' }}>
                                  {order.serviceType || 'Dental Case'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <DentzyStatusPill type="workflow" status={order.status || 'Pending'} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0ece5', color: '#1e5038', padding: '2px 8px', borderRadius: '6px' }}>
                                Stage: {order.stage || 'received'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                              {order.dueDate && <span>Due: {order.dueDate.slice(0, 10)}</span>}
                              <span>Payment: <strong>{order.paymentStatus || 'Pending'}</strong></span>
                              {order.paymentAmount > 0 && <span>Amount: {formatINR(order.paymentAmount)}</span>}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <TwentyFirstIconButton
                                icon={Ico.pencil(14)}
                                title="Edit Order Details"
                                ariaLabel="Edit Order Details"
                                onClick={() => setEditOrderModal(order)}
                                size="sm"
                                variant="soft"
                              />
                              {(order.paymentId || order.paymentAmount > 0) && (
                                <TwentyFirstIconButton
                                  icon={Ico.creditCard(14)}
                                  title="Update Payment Details"
                                  ariaLabel="Update Payment Details"
                                  onClick={() =>
                                    setEditPaymentModal({
                                      ...order,
                                      paymentId: order.paymentId || order._id,
                                      amount: order.paymentAmount,
                                    })
                                  }
                                  size="sm"
                                  variant="success"
                                />
                              )}
                              {order.paymentStatus === 'Paid' && (
                                <TwentyFirstIconButton
                                  icon={Ico.fileText(14)}
                                  title="View / Print Invoice"
                                  ariaLabel="View / Print Invoice"
                                  onClick={() => setSingleInvoiceModal(order)}
                                  size="sm"
                                  variant="soft"
                                />
                              )}
                            </div>
                          </div>
                        </DentzyCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: PAYMENTS & BILLING VIEW                                      */}
        {/* =================================================================== */}
        {activeTab === 'payments' && (
          <div>
            {!selectedPayDentist ? (
              /* ── SUB-VIEW A: Payments Overview & Dentist Financial Cards ── */
              <div>
                <div className="sd-section-header" style={{ marginBottom: '16px' }}>
                  <div>
                    <h2 className="sd-section-title" style={{ margin: 0 }}>Payments & Accounts</h2>
                    <div style={{ fontSize: '0.8rem', color: '#527264', marginTop: '2px' }}>
                      Financial overview across all dentist clinics
                    </div>
                  </div>
                </div>

                {/* Summary Stat Cards */}
                {loadingAllPayments ? (
                  <StaffSummaryTilesSkeleton />
                ) : (
                  <DentzyKpiRow
                    style={{ marginBottom: '20px' }}
                    items={[
                      {
                        key: 'billed',
                        label: 'Total Billed',
                        value: formatINR(paymentsSummary.billed),
                      },
                      {
                        key: 'collected',
                        label: 'Collected',
                        value: formatINR(paymentsSummary.collected),
                        tone: 'success',
                        valueColor: '#16a34a',
                      },
                      {
                        key: 'pending',
                        label: 'Pending Balance',
                        value: formatINR(paymentsSummary.pending),
                        tone: 'warning',
                        valueColor: '#d97706',
                      },
                    ]}
                  />
                )}

                {/* Dentist Financial Summary Grid */}
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e2924', margin: '0 0 12px 0' }}>
                  Billing Breakdown by Dentist
                </h3>

                {loadingAllPayments || loadingDentists ? (
                  <DentistFinanceCardsSkeleton />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {dentistFinancialMap.map((item) => {
                      const d = item.dentist;
                      const dentistId = d._id || d.id;

                      return (
                        <DentzyCard
                          key={dentistId}
                          interactive={true}
                          onClick={() => {
                            setSelectedPayDentist(d);
                            fetchPayDentistDetail(dentistId);
                            setSelectedPaymentIds([]);
                            setPayMonthFilter('all');
                            setPayStatusFilter('all');
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e2924' }}>
                                {formatDoctorName(d.name)}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#527264', fontWeight: 600 }}>
                                {d.clinicName}
                              </div>
                            </div>
                            <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                              {Ico.chevronRight(18)}
                            </span>
                          </div>

                          {/* Financial Pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px' }}>
                              Billed: {formatINR(item.totalBilled)}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px' }}>
                              Collected: {formatINR(item.totalCollected)}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px' }}>
                              Pending: {formatINR(item.totalPending)}
                            </span>
                          </div>

                          <div style={{ borderTop: '1px solid #f0f4f2', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                            <span style={{ color: '#64748b' }}>{item.totalCases} total cases</span>
                            {item.unpaidCount > 0 ? (
                              <span style={{ fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '1px 8px', borderRadius: '10px' }}>
                                {item.unpaidCount} unpaid
                              </span>
                            ) : (
                              <span style={{ fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '1px 8px', borderRadius: '10px' }}>
                                All settled
                              </span>
                            )}
                          </div>
                        </DentzyCard>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ── SUB-VIEW B: Selected Dentist Invoices & Batch Payment ── */
              <div>
                <SubViewHeader
                  title={formatDoctorName(selectedPayDentist.name)}
                  subtitle={[selectedPayDentist.clinicName, 'Statements & Ledger'].filter(Boolean).join(' · ')}
                  onBack={() => {
                    setSelectedPayDentist(null);
                    setSelectedPaymentIds([]);
                  }}
                  backLabel="Back to Payments Overview"
                  style={{ marginBottom: '14px' }}
                  rightAction={
                    <>
                      {/* Download Pending Bill */}
                      <button
                        type="button"
                        onClick={() => {
                          const dId = selectedPayDentist.id || selectedPayDentist._id;
                          const mQuery = payMonthFilter && payMonthFilter !== 'all' ? `&month=${encodeURIComponent(payMonthFilter)}` : '';
                          openInvoiceWindow(`/invoice?unpaid=true&dentistId=${encodeURIComponent(dId)}${mQuery}`);
                        }}
                        style={{
                          background: '#1e5038',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          minHeight: isMobile ? '44px' : '36px',
                        }}
                      >
                        {Ico.download(13)}
                        <span>Download Pending Bill</span>
                      </button>

                      {/* Select All Pending */}
                      <button
                        type="button"
                        onClick={handleSelectAllPending}
                        style={{
                          background: '#fef3c7',
                          border: '1px solid #f59e0b',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          color: '#92400e',
                          cursor: 'pointer',
                          fontWeight: 700,
                          minHeight: isMobile ? '44px' : '36px',
                        }}
                      >
                        Select All Pending
                      </button>
                    </>
                  }
                />

                {/* Filter Bar: Month & Status */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <MonthFilterBar
                    id="rec-pay-month"
                    value={payMonthFilter}
                    clearValue="all"
                    clearLabel="All Months"
                    isMobile={Boolean(isMobile)}
                    onChange={(val) => {
                      setPayMonthFilter(val || 'all');
                      setSelectedPaymentIds([]);
                    }}
                  />

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                    {PAYMENT_STATUSES.map((pst) => (
                      <button
                        key={pst.key}
                        type="button"
                        className={`sd-filter-btn ${payStatusFilter === pst.key ? 'sd-filter-btn--active' : ''}`}
                        onClick={() => setPayStatusFilter(pst.key)}
                      >
                        {pst.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPaymentIds.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e5038', background: '#edf5f0', padding: '2px 8px', borderRadius: '6px' }}>
                      {selectedPaymentIds.length} selected ({formatINR(totalSelectedAmount)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentIds([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Payments Order Table */}
                {loadingPayDentistOrders ? (
                  <StaffPayRowSkeleton count={4} />
                ) : filteredPayDentistOrders.length === 0 ? (
                  <EmptyState
                    compact
                    variant="payments"
                    message="No payment records found"
                    subtext="No payment records matching the selected filters."
                  />
                ) : (
                  <DentzyDataTable
                    kpiItems={[
                      {
                        key: 'cases',
                        label: 'Total Cases',
                        value: filteredPayDentistOrders.length,
                      },
                      {
                        key: 'billed',
                        label: 'Total Billed',
                        value: formatINR(
                          filteredPayDentistOrders.reduce((s, o) => s + (Number(o.paymentAmount) || 0), 0)
                        ),
                      },
                      {
                        key: 'outstanding',
                        label: 'Outstanding Balance',
                        value: formatINR(
                          filteredPayDentistOrders
                            .filter((o) => (o.paymentStatus || 'Pending') !== 'Paid')
                            .reduce((s, o) => s + (Number(o.paymentAmount) || 0), 0)
                        ),
                        tone: 'warning',
                        valueColor: '#92400e',
                      },
                    ]}
                    selectable
                    selectedIds={selectedPaymentIds}
                    onToggleSelect={togglePaymentSelect}
                    onToggleSelectAll={toggleSelectAllVisiblePayments}
                    rowKey={(o) => o._id || o.id || o.caseId}
                    data={filteredPayDentistOrders}
                    columns={[
                      {
                        key: 'caseId',
                        header: 'Case ID',
                        render: (o) => <DentzyCaseChip caseId={o.caseId} />,
                      },
                      {
                        key: 'patientName',
                        header: 'Patient',
                        render: (o) => <strong>{o.patientName || 'Unnamed Patient'}</strong>,
                      },
                      {
                        key: 'paymentAmount',
                        header: 'Amount',
                        render: (o) => (
                          <span style={{ fontWeight: 700 }}>
                            {o.paymentAmount > 0 ? formatINR(o.paymentAmount) : 'N/A'}
                          </span>
                        ),
                      },
                      {
                        key: 'paymentStatus',
                        header: 'Payment',
                        render: (o) => (
                          <DentzyStatusPill type="payment" status={o.paymentStatus || 'Pending'} />
                        ),
                      },
                      {
                        key: 'modePaid',
                        header: 'Mode & Date',
                        render: (o) =>
                          o.paymentMode || o.paidAt ? (
                            <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {o.paymentMode && <DentzyStatusPill type="mode" status={o.paymentMode} />}
                              {o.paidAt && (
                                <span style={{ color: '#708c80' }}>
                                  Paid {new Date(o.paidAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>
                          ),
                      },
                      {
                        key: 'actions',
                        header: 'Actions',
                        render: (o) => (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                          >
                            <TwentyFirstIconButton
                              icon={Ico.creditCard(14)}
                              title="Update Payment"
                              ariaLabel="Update Payment"
                              onClick={() =>
                                setEditPaymentModal({
                                  ...o,
                                  paymentId: o.paymentId || o._id,
                                  amount: o.paymentAmount,
                                })
                              }
                              size="sm"
                              variant="success"
                            />
                            {o.paymentStatus === 'Paid' && (
                              <TwentyFirstIconButton
                                icon={Ico.fileText(14)}
                                title="View / Print Invoice"
                                ariaLabel="View / Print Invoice"
                                onClick={() => setSingleInvoiceModal(o)}
                                size="sm"
                                variant="soft"
                              />
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                )}

                {/* Floating Batch Settlement Bar */}
                <BatchFloatingBar
                  count={selectedPaymentIds.length}
                  totalAmount={totalSelectedAmount}
                  onDeselect={() => setSelectedPaymentIds([])}
                  onSettle={() => {
                    setBatchPayForm({ status: 'Paid', paymentMode: 'Cash', referenceNumber: '', notes: '' });
                    setBatchPayError('');
                    setBatchPayModalOpen(true);
                  }}
                  variant="fixed"
                  isMobile={Boolean(isMobile)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {/* 1. Create Order Modal */}
      {showCreateOrder && (
        <CreateOrderModal
          isOpen={showCreateOrder}
          onClose={() => setShowCreateOrder(false)}
          dentist={selectedDentist}
          dentistList={dentists}
          onSubmitOrder={handleCreateOrderSubmit}
          isSubmitting={creatingOrder}
        />
      )}

      {/* 2. Edit Order Modal */}
      {editOrderModal && (
        <StaffOrderModal
          order={editOrderModal}
          onClose={() => setEditOrderModal(null)}
          onSave={handleEditOrderSubmit}
          saving={editOrderSaving}
        />
      )}

      {/* 3. Edit Payment Modal */}
      {editPaymentModal && (
        <StaffPaymentModal
          payment={editPaymentModal}
          onClose={() => setEditPaymentModal(null)}
          onSave={handleEditPaymentSubmit}
          saving={editPaymentSaving}
        />
      )}

      {/* 4. Single Invoice Modal */}
      {singleInvoiceModal && (
        <PrintableInvoice
          payment={{
            ...singleInvoiceModal,
            amount: singleInvoiceModal.paymentAmount || singleInvoiceModal.amount || 0,
            status: singleInvoiceModal.paymentStatus || singleInvoiceModal.status || 'Paid',
            dentistName: selectedDentist?.name || singleInvoiceModal.owner?.name,
            clinicName: selectedDentist?.clinicName || singleInvoiceModal.owner?.clinicName,
            phone: selectedDentist?.phone || singleInvoiceModal.owner?.phone,
            address: selectedDentist?.address || singleInvoiceModal.owner?.address,
          }}
          dentist={selectedDentist}
          onClose={() => setSingleInvoiceModal(null)}
        />
      )}

      {/* 5. Batch Payment Modal */}
      <BatchPaymentModal
        isOpen={batchPayModalOpen}
        onClose={() => {
          setBatchPayModalOpen(false);
          setBatchPayError('');
        }}
        selectedCount={selectedPaymentIds.length}
        totalAmount={totalSelectedAmount}
        dentistName={selectedPayDentist?.name || ''}
        clinicName={selectedPayDentist?.clinicName || ''}
        form={batchPayForm}
        onFormChange={setBatchPayForm}
        onConfirm={handleBatchPaymentSubmit}
        saving={batchPaySaving}
        error={batchPayError}
        onClearError={() => setBatchPayError('')}
        id="receptionist-batch-pay-modal"
      />

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <TwentyFirstBottomNav
        items={mobileNavItems}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === 'profile') setProfileResetTick((t) => t + 1);
        }}
        layoutId="receptionist-bottom-nav"
      />
    </div>
  );
}
