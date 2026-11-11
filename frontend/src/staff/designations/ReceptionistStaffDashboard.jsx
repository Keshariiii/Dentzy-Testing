'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import { TwentyFirstBottomNav } from '../../components/ui/twentyfirst-bottom-nav';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { StatusBadge } from '../../components/ui/status-badge';
import StaffNoticeBar from '../../components/common/StaffNoticeBar';
import StaffSettingsView from '../common/StaffSettingsView';
import StaffOrderModal from '../StaffOrderModal';
import StaffPaymentModal from '../StaffPaymentModal';
import CreateOrderModal from '../../components/common/CreateOrderModal';
import BaseModal from '../../components/ui/BaseModal';
import PrintableInvoice from '../../components/common/PrintableInvoice';
import {
  StaffSummaryTilesSkeleton,
  DentistFinanceCardsSkeleton,
  DentistCardSkeleton,
  StaffOrderRowSkeleton,
  StaffPayRowSkeleton,
} from '../../components/SkeletonBlocks';
import { formatINR } from '../../utils/format';
import { DentzyCard, DentzyCaseChip, DentzyStatusPill } from '../../components/common/DentzyCard';
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
 * 3 Tabs: 'dentists' | 'payments' | 'settings'. Default: 'dentists'.
 * Tab 1: Dentists (Sub-View A: Dentist Grid with CardSkeletons, Sub-View B: Selected Dentist Orders & New Order).
 * Tab 2: Payments (Sub-View A: Overview StatCards & Dentist Financial Badges, Sub-View B: Selected Dentist Statements & Batch Settlement).
 * Tab 3: Settings (<StaffSettingsView />).
 * Mobile: TwentyFirstBottomNav (Dentists, Payments, Settings).
 */
export default function ReceptionistStaffDashboard() {
  const { authFetch, STAFF_API, staff, staffLogout } = useStaffAuth();
  const { showToast } = useToast();
  const apiBase = STAFF_API || '/api/staff';

  const [activeTab, setActiveTab] = useState('dentists'); // 'dentists' | 'payments' | 'settings'

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
    setBatchPaySaving(true);
    try {
      const res = await authFetch(`${apiBase}/payments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedPaymentIds,
          status: batchPayForm.status,
          paymentMode: batchPayForm.paymentMode,
          referenceNumber: batchPayForm.referenceNumber,
          notes: batchPayForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Settled ${selectedPaymentIds.length} orders.`);
        setBatchPayModalOpen(false);
        setSelectedPaymentIds([]);
        fetchAllPayments();
        if (selectedPayDentist) fetchPayDentistDetail(selectedPayDentist._id || selectedPayDentist.id);
      } else {
        showToast(data.message || 'Batch settlement failed.', 'error');
      }
    } catch {
      showToast('Network error during batch settlement.', 'error');
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
        key: 'settings',
        label: 'Settings',
        icon: (active) => Ico.settings(typeof active === 'number' ? active : (active ? 20 : 18)),
      },
    ],
    []
  );

  return (
    <div className="sd-shell">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="sd-header">
        <div className="sd-header-left">
          <div className="sd-header-logo-btn">
            <span className="sd-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Reception Desk</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#e0ece5',
                  color: '#1e5038',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Receptionist Portal
              </span>
            </span>
          </div>
        </div>

        {/* Desktop Tab Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-[#f0f4f2] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dentists');
              setSelectedPayDentist(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dentists'
                ? 'bg-white text-[#1e5038] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {Ico.clinic(14)}
            <span>Dentists</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('payments');
              setSelectedDentist(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-white text-[#1e5038] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {Ico.payments ? Ico.payments(14) : Ico.wallet(14)}
            <span>Payments</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-[#1e5038] shadow-sm font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {Ico.settings(14)}
            <span>Settings</span>
          </button>
        </div>

        <div className="sd-header-right">
          <div className="sd-header-user">
            <div className="sd-avatar">
              {staff?.displayName ? staff.displayName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="sd-header-user-details">
              <span className="sd-header-name">{staff?.displayName || 'Receptionist'}</span>
              <span className="sd-header-role">Receptionist</span>
            </div>
          </div>
          <button
            type="button"
            onClick={staffLogout}
            className="sd-logout-btn"
            title="Log Out"
            aria-label="Log Out"
          >
            {Ico.logout(15)}
            <span className="sd-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Notice Bar ────────────────────────────────────────────────────── */}
      <StaffNoticeBar />

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="sd-main" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '16px' }}>
        {/* =================================================================== */}
        {/* TAB 3: SETTINGS VIEW                                                */}
        {/* =================================================================== */}
        {activeTab === 'settings' && <StaffSettingsView />}

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
                    <div className="sd-search-wrap" style={{ minWidth: '220px' }}>
                      {Ico.search(14)}
                      <input
                        type="text"
                        className="sd-search"
                        placeholder="Search dentists, clinic, phone..."
                        value={dentistSearch}
                        onChange={(e) => setDentistSearch(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <TwentyFirstIconButton
                      icon={Ico.refresh(16)}
                      title="Refresh Dentists"
                      ariaLabel="Refresh Dentists"
                      onClick={fetchDentists}
                      variant="secondary"
                      size="md"
                    />
                  </div>
                </div>

                {loadingDentists ? (
                  <DentistCardSkeleton />
                ) : filteredDentists.length === 0 ? (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '48px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: '#eef5f1', color: '#1e5038', marginBottom: '12px' }}>
                      {Ico.clinic(36)}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e2924', margin: '0 0 6px 0' }}>No Dentists Found</h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      {dentistSearch ? 'No dentists matching your search query.' : 'No registered dentists in the system.'}
                    </p>
                  </div>
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
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '12px',
                                  background: '#eef6f2',
                                  color: '#1e5038',
                                  fontWeight: 800,
                                  fontSize: '0.95rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e2924' }}>
                                  Dr. {d.name || 'Unnamed Dentist'}
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
                <div className="sd-section-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TwentyFirstIconButton
                      icon={Ico.arrowLeft(16)}
                      title="Back to Dentists List"
                      ariaLabel="Back to Dentists List"
                      onClick={() => {
                        setSelectedDentist(null);
                        setDentistOrders([]);
                      }}
                      variant="secondary"
                      size="md"
                    />
                    <div>
                      <h2 className="sd-section-title" style={{ margin: 0 }}>
                        Dr. {selectedDentist.name}
                      </h2>
                      <div style={{ fontSize: '0.8rem', color: '#527264', marginTop: '2px' }}>
                        {selectedDentist.clinicName}
                        {selectedDentist.phone ? ` · ${selectedDentist.phone}` : ''}
                        {selectedDentist.email ? ` · ${selectedDentist.email}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrder(true)}
                      style={{
                        background: '#1e5038',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(30,80,56,0.2)',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>New Order</span>
                    </button>
                  </div>
                </div>

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
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '48px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: '#eef5f1', color: '#1e5038', marginBottom: '12px' }}>
                      {Ico.labOrder(36)}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e2924', margin: '0 0 6px 0' }}>No Orders Found</h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      {orderStageFilter !== 'all'
                        ? `No orders matching stage "${orderStageFilter}".`
                        : 'No orders have been submitted for this dentist yet.'}
                    </p>
                  </div>
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
                              <StatusBadge status={order.status || 'Pending'} size="sm" />
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
                  <TwentyFirstIconButton
                    icon={Ico.refresh(16)}
                    title="Refresh Payments"
                    ariaLabel="Refresh Payments"
                    onClick={fetchAllPayments}
                    variant="secondary"
                    size="md"
                  />
                </div>

                {/* Summary Stat Cards */}
                {loadingAllPayments ? (
                  <StaffSummaryTilesSkeleton />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <DentzyCard style={{ padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Total Billed</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e2924' }}>{formatINR(paymentsSummary.billed)}</div>
                    </DentzyCard>
                    <DentzyCard style={{ padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>Collected</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{formatINR(paymentsSummary.collected)}</div>
                    </DentzyCard>
                    <DentzyCard style={{ padding: '18px 20px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d97706', marginBottom: '6px' }}>Pending Balance</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>{formatINR(paymentsSummary.pending)}</div>
                    </DentzyCard>
                  </div>
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
                                Dr. {d.name}
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
                <div className="sd-section-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TwentyFirstIconButton
                      icon={Ico.arrowLeft(16)}
                      title="Back to Payments Overview"
                      ariaLabel="Back to Payments Overview"
                      onClick={() => {
                        setSelectedPayDentist(null);
                        setSelectedPaymentIds([]);
                      }}
                      variant="secondary"
                      size="md"
                    />
                    <div>
                      <h2 className="sd-section-title" style={{ margin: 0 }}>
                        Dr. {selectedPayDentist.name}
                      </h2>
                      <div style={{ fontSize: '0.8rem', color: '#527264', marginTop: '2px' }}>
                        {selectedPayDentist.clinicName} · Statements & Ledger
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Download Pending Bill */}
                    <button
                      type="button"
                      onClick={() => {
                        const dId = selectedPayDentist.id || selectedPayDentist._id;
                        const mQuery = payMonthFilter && payMonthFilter !== 'all' ? `&month=${encodeURIComponent(payMonthFilter)}` : '';
                        window.open(`/invoice?unpaid=true&dentistId=${encodeURIComponent(dId)}${mQuery}`, '_blank');
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
                        height: '36px',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
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
                        height: '36px',
                      }}
                    >
                      Select All Pending
                    </button>
                  </div>
                </div>

                {/* Filter Bar: Month & Status */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <label htmlFor="rec-pay-month" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4a7060' }}>
                    Month:
                  </label>
                  <input
                    id="rec-pay-month"
                    type="month"
                    value={payMonthFilter === 'all' ? '' : payMonthFilter}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(e) => {
                      setPayMonthFilter(e.target.value || 'all');
                      setSelectedPaymentIds([]);
                    }}
                    style={{
                      border: '1px solid #c2dcd0',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      background: '#fff',
                      cursor: 'pointer',
                      height: '36px',
                    }}
                  />
                  {payMonthFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setPayMonthFilter('all')}
                      style={{
                        background: '#f0f4f2',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        color: '#4a7060',
                        cursor: 'pointer',
                        fontWeight: 600,
                        height: '36px',
                      }}
                    >
                      All Months
                    </button>
                  )}

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
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

                {/* Multi-select Header Checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    padding: '6px 4px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#4a7060',
                      userSelect: 'none',
                    }}
                    onClick={toggleSelectAllVisiblePayments}
                  >
                    <input
                      type="checkbox"
                      checked={
                        filteredPayDentistOrders.length > 0 &&
                        filteredPayDentistOrders.every((o) =>
                          selectedPaymentIds.includes(o._id || o.id || o.caseId)
                        )
                      }
                      onChange={toggleSelectAllVisiblePayments}
                      style={{ width: '16px', height: '16px', accentColor: '#1e5038', cursor: 'pointer' }}
                    />
                    <span>Select All Visible ({filteredPayDentistOrders.length})</span>
                  </label>

                  {selectedPaymentIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e5038', background: '#edf5f0', padding: '2px 8px', borderRadius: '6px' }}>
                        {selectedPaymentIds.length} selected ({formatINR(totalSelectedAmount)})
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
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Payments Order List */}
                {loadingPayDentistOrders ? (
                  <StaffPayRowSkeleton count={4} />
                ) : filteredPayDentistOrders.length === 0 ? (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '48px 20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                      No payment records matching the selected filters.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredPayDentistOrders.map((order) => {
                      const oid = order._id || order.id || order.caseId;
                      const isSelected = selectedPaymentIds.includes(oid);

                      return (
                        <DentzyCard
                          key={oid}
                          style={{
                            background: isSelected ? '#edf5f0' : '#ffffff',
                            border: isSelected ? '1.5px solid #1e5038' : '1px solid rgba(112, 140, 128, 0.14)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePaymentSelect(oid)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '16px', height: '16px', accentColor: '#1e5038', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DentzyCaseChip caseId={order.caseId} />
                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e2924' }}>
                                  {order.patientName || 'Unnamed Patient'}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={order.paymentStatus || 'Pending'} size="sm" />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                              <span>Amount: <strong>{order.paymentAmount > 0 ? formatINR(order.paymentAmount) : 'N/A'}</strong></span>
                              {order.paymentMode && <span>Mode: {order.paymentMode}</span>}
                              {order.paidAt && <span>Paid: {new Date(order.paidAt).toLocaleDateString('en-IN')}</span>}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <TwentyFirstIconButton
                                icon={Ico.creditCard(14)}
                                title="Update Payment"
                                ariaLabel="Update Payment"
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

                {/* Floating Batch Settlement Bar */}
                {selectedPaymentIds.length > 0 && (
                  <div
                    style={{
                      position: 'fixed',
                      bottom: '76px',
                      left: '16px',
                      right: '16px',
                      maxWidth: '800px',
                      margin: '0 auto',
                      zIndex: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      borderRadius: '14px',
                      background: '#1a3028',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: '#25503b', color: '#a3bfb1', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {selectedPaymentIds.length} {selectedPaymentIds.length === 1 ? 'case' : 'cases'} selected
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2ece6' }}>
                        Total: <strong style={{ color: '#fff', fontSize: '1.02rem' }}>{formatINR(totalSelectedAmount)}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentIds([])}
                        style={{
                          background: 'transparent',
                          border: '1px solid #4a6a5a',
                          color: '#c2d6cc',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: '38px',
                        }}
                      >
                        Deselect
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBatchPayForm({ status: 'Paid', paymentMode: 'Cash', referenceNumber: '', notes: '' });
                          setBatchPayModalOpen(true);
                        }}
                        style={{
                          background: '#1e5038',
                          border: '1px solid #708c80',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '38px',
                        }}
                      >
                        {Ico.creditCard(14)} Settle Payment ({selectedPaymentIds.length} Cases)
                      </button>
                    </div>
                  </div>
                )}
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
      <BaseModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        maxWidth="max-w-md"
        className="sd-modal-wrap"
        raw={true}
        id="receptionist-batch-pay-modal"
      >
        <div className="sd-modal-content">
          <div className="sd-modal-header">
            <h3>Settle Batch Payment ({selectedPaymentIds.length} Cases)</h3>
            <button className="sd-modal-close" onClick={() => setBatchPayModalOpen(false)} aria-label="Close">
              {Ico.x(16)}
            </button>
          </div>
          <div className="sd-modal-body">
            <div className="sd-modal-summary" style={{ background: '#f8faf9', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selectedPayDentist && <span><strong>Dentist:</strong> Dr. {selectedPayDentist.name}</span>}
              <span><strong>Selected Cases:</strong> {selectedPaymentIds.length}</span>
              <span><strong>Total Settlement Amount:</strong> {formatINR(totalSelectedAmount)}</span>
            </div>

            <div className="sd-field" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Payment Status
              </label>
              <select
                value={batchPayForm.status}
                onChange={(e) => setBatchPayForm((f) => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending (Revert to Unpaid)</option>
              </select>
            </div>

            {batchPayForm.status === 'Paid' && (
              <>
                <div className="sd-field" style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Payment Mode
                  </label>
                  <select
                    value={batchPayForm.paymentMode}
                    onChange={(e) => setBatchPayForm((f) => ({ ...f, paymentMode: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sd-field" style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Receipt / Cheque No."
                    value={batchPayForm.referenceNumber}
                    onChange={(e) => setBatchPayForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </>
            )}

            <div className="sd-field" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Notes / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for this batch settlement..."
                value={batchPayForm.notes}
                onChange={(e) => setBatchPayForm((f) => ({ ...f, notes: e.target.value }))}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="sd-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 18px', borderTop: '1px solid #e2ece6' }}>
            <button
              type="button"
              className="sd-btn-secondary"
              onClick={() => setBatchPayModalOpen(false)}
              disabled={batchPaySaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sd-btn-primary"
              onClick={handleBatchPaymentSubmit}
              disabled={batchPaySaving}
            >
              {batchPaySaving ? 'Settling...' : `Confirm Settle (${formatINR(totalSelectedAmount)})`}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <TwentyFirstBottomNav
        items={mobileNavItems}
        activeKey={activeTab}
        onChange={setActiveTab}
        layoutId="receptionist-bottom-nav"
      />
    </div>
  );
}
