'use client';
/**
 * StaffDashboard — Full-featured Staff Portal.
 * Sections: Orders, Dentists, Inventory, Leaderboard, Settings.
 * Premium 21st.dev-inspired design. No emojis. No card borders (shadows only).
 * Ponytail: one component serves both desktop and mobile via responsive CSS.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from './StaffAuthContext';
import { useToast } from '../context/ToastContext';
import { Icons as Ico } from '../components/common/DashboardIcons';
import StaffOrderModal from './StaffOrderModal';
import StaffPaymentModal from './StaffPaymentModal';
import CreateOrderModal from '../components/common/CreateOrderModal';
import BaseModal from '../components/ui/BaseModal';
import PrintableInvoice from '../components/common/PrintableInvoice';
import { TwentyFirstBottomNav } from '../components/ui/twentyfirst-bottom-nav';
import StaffNoticeBar from '../components/common/StaffNoticeBar';
import TwentyFirstIconButton from '../components/ui/twentyfirst-icon-button';
import { StatusBadge } from '../components/ui/status-badge';
import { formatINR } from '../utils/format';
import './StaffDashboard.css';

const STAGES = [
  { key: 'received', label: 'Received', color: '#6b7280' },
  { key: 'design', label: 'CAD Design', color: '#7c3aed' },
  { key: 'production', label: 'Milling', color: '#2563eb' },
  { key: 'qc', label: 'QC', color: '#d97706' },
  { key: 'dispatched', label: 'Dispatched', color: '#0891b2' },
  { key: 'completed', label: 'Completed', color: '#16a34a' },
];

const NAV_ITEMS = [
  { key: 'orders', label: 'Orders', icon: (s) => Ico.labOrder(typeof s === 'number' ? s : (s ? 20 : 18)) },
  { key: 'dentists', label: 'Dentists', icon: (s) => Ico.clinic(typeof s === 'number' ? s : (s ? 20 : 18)) },
  { key: 'inventory', label: 'Inventory', icon: (s) => Ico.package(typeof s === 'number' ? s : (s ? 20 : 18)) },
  { key: 'leaderboard', label: 'Leaderboard', icon: (s) => Ico.chart(typeof s === 'number' ? s : (s ? 20 : 18)) },
  { key: 'settings', label: 'Settings', icon: (s) => Ico.settings(typeof s === 'number' ? s : (s ? 20 : 18)) },
];

const StaffDashboard = () => {
  const router = useRouter();
  const { staff, staffLogout, updateStaffState, authFetch, STAFF_API } = useStaffAuth();
  const [activeView, setActiveView] = useState('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Receptionist gets a strict 4-tab portal only (orders, dentists, leaderboard, settings)
  const isReceptionist = staff?.designation === 'Receptionist';

  const visibleNavItems = isReceptionist
    ? NAV_ITEMS.filter(item => ['orders', 'dentists', 'leaderboard', 'settings'].includes(item.key))
    : NAV_ITEMS;

  // Department-specific filter: technicians only see their category
  const DEPT_CATEGORY_MAP = {
    'Ceramist':      'Ceramic',
    'Acrylic Tech':  'Acrylic',
    'CAD/CAM Tech':  'Zirconia',
  };

  // ── Orders ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'mine'
  const [updatingStage, setUpdatingStage] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const filter = orderFilter === 'mine' ? '?filter=mine' : '';
      const res = await authFetch(`${STAFF_API}/orders${filter}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {}
    setLoadingOrders(false);
  }, [authFetch, STAFF_API, orderFilter]);

  useEffect(() => { if (staff) fetchOrders(); }, [staff, fetchOrders]);

  const handleStageUpdate = async (orderId, newStage) => {
    setUpdatingStage(orderId);
    try {
      const res = await authFetch(`${STAFF_API}/orders/${orderId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Stage updated to "${newStage}".`);
        fetchOrders();
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setUpdatingStage(null);
  };

  // ── Inventory ───────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ item_name: '', quantity: '', unit: 'pcs', min_stock: '' });
  const [itemFormError, setItemFormError] = useState('');
  const [itemFormSaving, setItemFormSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await authFetch(`${STAFF_API}/inventory`);
      if (res.ok) { const d = await res.json(); setInventory(d.items || []); }
    } catch {}
    setLoadingInventory(false);
  }, [authFetch, STAFF_API]);

  useEffect(() => { if (activeView === 'inventory' && staff) fetchInventory(); }, [activeView, staff, fetchInventory]);

  const handleAddItem = async () => {
    setItemFormError('');
    if (!itemForm.item_name.trim() || !itemForm.unit.trim()) {
      setItemFormError('Item name and unit are required.'); return;
    }
    setItemFormSaving(true);
    try {
      const res = await authFetch(`${STAFF_API}/inventory`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: itemForm.item_name.trim(),
          quantity: parseInt(itemForm.quantity) || 0,
          unit: itemForm.unit.trim(),
          min_stock: parseInt(itemForm.min_stock) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Item added.');
        setShowAddItem(false);
        setItemForm({ item_name: '', quantity: '', unit: 'pcs', min_stock: '' });
        fetchInventory();
      } else setItemFormError(data.message || 'Failed');
    } catch { setItemFormError('Network error.'); }
    setItemFormSaving(false);
  };

  const handleUpdateStock = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    try {
      const res = await authFetch(`${STAFF_API}/inventory/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) fetchInventory();
      else showToast('Failed to update stock', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  // ── Leaderboard ─────────────────────────────────────────────────────────
  const [myMetrics, setMyMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const fetchMyMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await authFetch(`${STAFF_API}/metrics`);
      if (res.ok) { const d = await res.json(); setMyMetrics(d); }
    } catch {}
    setLoadingMetrics(false);
  }, [authFetch, STAFF_API]);

  useEffect(() => { if (activeView === 'leaderboard' && staff) fetchMyMetrics(); }, [activeView, staff, fetchMyMetrics]);

  // ── Dentists ────────────────────────────────────────────────────────────
  const [dentists, setDentists] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [dentistSearch, setDentistSearch] = useState('');
  const [selectedDentist, setSelectedDentist] = useState(null);
  const [dentistOrders, setDentistOrders] = useState([]);
  const [loadingDentistDetail, setLoadingDentistDetail] = useState(false);
  const [dentistSubTab, setDentistSubTab] = useState('orders');

  // ── Order / Payment Modal State ─────────────────────────────────────────
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [editOrderSaving, setEditOrderSaving] = useState(false);
  const [editPaymentModal, setEditPaymentModal] = useState(null);
  const [editPaymentSaving, setEditPaymentSaving] = useState(false);

  // Batch Payment state for Staff
  const [selectedStaffPaymentIds, setSelectedStaffPaymentIds] = useState([]);
  const [staffPayMonth, setStaffPayMonth] = useState('all');
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [batchPayForm, setBatchPayForm] = useState({
    status: 'Paid',
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
  });
  const [batchPaySaving, setBatchPaySaving] = useState(false);
  const [batchPayError, setBatchPayError] = useState('');
  const [batchStatementModal, setBatchStatementModal] = useState(null);
  const [singleInvoiceModal, setSingleInvoiceModal] = useState(null);

  const handleViewStaffInvoice = async (order) => {
    if (order.batchId) {
      try {
        const res = await authFetch(`/api/payments/batch/${order.batchId}`);
        if (res.ok) {
          const stmtData = await res.json();
          setBatchStatementModal(stmtData);
          return;
        }
      } catch {}
    }
    setSingleInvoiceModal(order);
  };

  const fetchDentists = useCallback(async () => {
    setLoadingDentists(true);
    try {
      const res = await authFetch(`${STAFF_API}/users`);
      if (res.ok) { const d = await res.json(); setDentists(d.users || []); }
    } catch {}
    setLoadingDentists(false);
  }, [authFetch, STAFF_API]);

  useEffect(() => { if (activeView === 'dentists' && staff) fetchDentists(); }, [activeView, staff, fetchDentists]);

  const fetchDentistDetail = useCallback(async (userId) => {
    setLoadingDentistDetail(true);
    try {
      const res = await authFetch(`${STAFF_API}/users/${userId}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedDentist(d.user);
        setDentistOrders(d.orders || []);
      }
    } catch {}
    setLoadingDentistDetail(false);
  }, [authFetch, STAFF_API]);

  // ── Order/Payment Modal handlers ────────────────────────────────────────
  const handleEditOrderSubmit = async (order, form) => {
    setEditOrderSaving(true);
    try {
      const res = await authFetch(`${STAFF_API}/orders/${order._id || order.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Order updated.');
        setEditOrderModal(null);
        fetchOrders();
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setEditOrderSaving(false);
  };

  const handleEditPaymentSubmit = async (payment, form) => {
    setEditPaymentSaving(true);
    try {
      const res = await authFetch(`${STAFF_API}/payments/${payment.paymentId || payment._id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment updated.');
        setEditPaymentModal(null);
        fetchOrders();
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
      } else showToast(data.message || 'Failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setEditPaymentSaving(false);
  };

  const filteredStaffDentistOrders = React.useMemo(() => {
    return dentistOrders.filter(o => {
      const hasPay = o.paymentAmount > 0 || o.paymentStatus;
      if (!hasPay) return false;
      if (staffPayMonth !== 'all') {
        const oDate = o.createdAt || o.invoiceDate || '';
        const oMonth = oDate.slice(0, 7);
        if (oMonth && oMonth !== staffPayMonth) return false;
      }
      return true;
    });
  }, [dentistOrders, staffPayMonth]);

  const toggleStaffPaymentSelect = (orderId) => {
    setSelectedStaffPaymentIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAllStaffPayments = () => {
    const currentIds = filteredStaffDentistOrders.map(o => o._id || o.id || o.caseId);
    const allSelected = currentIds.length > 0 && currentIds.every(id => selectedStaffPaymentIds.includes(id));
    if (allSelected) {
      setSelectedStaffPaymentIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedStaffPaymentIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleSelectStaffMonthOrders = () => {
    const monthIds = filteredStaffDentistOrders.map(o => o._id || o.id || o.caseId);
    setSelectedStaffPaymentIds(prev => Array.from(new Set([...prev, ...monthIds])));
  };

  const handleBatchStaffPaymentSubmit = async () => {
    if (selectedStaffPaymentIds.length === 0) return;
    setBatchPayError('');
    if (batchPayForm.status === 'Paid') {
      if (batchPayForm.paymentMode === 'Cheque' && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 3)) {
        setBatchPayError('Cheque number is required (min 3 characters).');
        return;
      }
      if (batchPayForm.paymentMode === 'UPI' && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 4)) {
        setBatchPayError('UPI transaction ID / UTR is required (min 4 characters).');
        return;
      }
    }
    setBatchPaySaving(true);
    try {
      const selectedOrders = dentistOrders.filter(o =>
        selectedStaffPaymentIds.includes(o._id || o.id || o.caseId)
      );
      const orderIds = selectedOrders.map(o => o._id || o.id || o.caseId);
      const paymentIds = selectedOrders.map(o => o.paymentId).filter(Boolean);

      const res = await authFetch(`${STAFF_API}/payments/batch`, {
        method: 'POST',
        body: JSON.stringify({
          orderIds,
          paymentIds,
          status: batchPayForm.status,
          paymentMode: batchPayForm.status === 'Paid' ? batchPayForm.paymentMode : '',
          referenceNumber: batchPayForm.status === 'Paid' ? batchPayForm.referenceNumber.trim() : '',
          notes: batchPayForm.notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Payment updated for ${data.updatedCount || selectedStaffPaymentIds.length} orders.`);
        setSelectedStaffPaymentIds([]);
        setBatchPayModalOpen(false);
        fetchOrders();
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);

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

  const handleCreateOrderSubmit = async (payload) => {
    setCreatingOrder(true);
    try {
      const res = await authFetch(`${STAFF_API}/orders`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Order created successfully.');
        setShowCreateOrder(false);
        fetchOrders();
        if (selectedDentist) fetchDentistDetail(selectedDentist._id || selectedDentist.id);
      } else {
        showToast(data.message || 'Failed to create order', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setCreatingOrder(false);
  };

  // ── Settings ────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ displayName: '', email: '', phone: '', dob: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (staff) {
      setProfileForm({
        displayName: staff.displayName || '',
        email: staff.email || '',
        phone: staff.phone || '',
        dob: staff.dob ? (staff.dob.length >= 10 ? staff.dob.slice(0, 10) : staff.dob) : '',
      });
    }
  }, [staff]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (profileForm.displayName.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authFetch(`${STAFF_API}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (res.ok) {
        updateStaffState(data.staff);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditingProfile(false);
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error.' });
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await authFetch(`${STAFF_API}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: data.message || 'Password changed successfully!' });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => { setShowChangePassword(false); setPwMsg({ type: '', text: '' }); }, 1800);
      } else {
        setPwMsg({ type: 'error', text: data.message || 'Failed to change password.' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error.' });
    }
    setPwSaving(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const filteredOrders = orders;

  const filteredDentists = dentists.filter(d => {
    if (!dentistSearch) return true;
    const q = dentistSearch.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) ||
           (d.email || '').toLowerCase().includes(q) ||
           (d.clinicName || '').toLowerCase().includes(q);
  });

  const handleLogout = () => { staffLogout(); router.push('/login?role=staff'); };

  const staffName = staff?.displayName || staff?.username || 'Staff';
  const initials = staffName.slice(0, 2).toUpperCase();

  const formatDob = (dob) => {
    if (!dob) return '\u2014';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '\u2014';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const EyeIcon = ({ show }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (
        <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      ) : (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      )}
    </svg>
  );

  return (
    <div className="sd-shell">
      {/* ── Top Header (mirrors ud-header / ad-top-header) ──────────────── */}
      <header className="sd-header">
        <div className="sd-header-left">
          <button
            className="sd-hamburger"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            <span /><span /><span />
          </button>
          <button
            type="button"
            className="sd-header-logo-btn"
            onClick={() => setActiveView('settings')}
            aria-label="Go to Staff Settings"
          >
            <img src="/dentzy-logo-v2.png" alt="Dentzy" className="sd-logo" />
            <span className="sd-header-title">Staff Portal</span>
          </button>
        </div>
        <div className="sd-header-right">
          <button
            type="button"
            className="sd-header-user"
            onClick={() => setActiveView('settings')}
            aria-label="Staff Profile Settings"
          >
            <div className="sd-header-user-details">
              <span className="sd-header-name">{staffName}</span>
              <span className="sd-header-role">{staff?.designation || 'Staff'}</span>
            </div>
            <div className="sd-avatar">{initials}</div>
          </button>
        </div>
      </header>

      {/* ── Body (mirrors ud-body / ad-body) ────────────────────────────── */}
      <div className="sd-body">
        {/* Sidebar overlay */}
        {sidebarOpen && <div className="sd-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR (mirrors ud-sidebar / ad-sidebar) ───────────────────── */}
        <aside className={`sd-sidebar ${sidebarOpen ? 'sd-sidebar--open' : ''}`}>
          <div className="sd-sidebar-top">
            <nav className="sd-nav">
              {visibleNavItems.map(item => (
                <button
                  key={item.key}
                  id={`staff-nav-${item.key}`}
                  className={`sd-nav-item ${activeView === item.key ? 'active' : ''}`}
                  onClick={() => { setActiveView(item.key); setSidebarOpen(false); }}
                >
                  <span className="sd-nav-icon">{item.icon(16)}</span>
                  <span className="sd-nav-label">{item.label}</span>
                  {item.key === 'orders' && orders.length > 0 && (
                    <span className="sd-nav-badge">{orders.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <button id="staff-logout-btn" className="sd-logout" onClick={handleLogout}>
            {Ico.logout(15)} Logout
          </button>
        </aside>

        {/* ── Main Content Area ───────────────────────────────────────────── */}
        <div className="sd-content-area">
          {/* Staff Notice Bar */}
          <div className="sd-notice-wrap" style={{ maxWidth: '1400px', margin: '12px auto 0', padding: '0 24px' }}>
            <StaffNoticeBar authFetch={authFetch} />
          </div>



      {/* ── ORDERS VIEW ─────────────────────────────────────────────── */}
      {activeView === 'orders' && (
        <main className="sd-main">
          <div className="sd-section-header">
            <h2 className="sd-section-title">Lab Orders</h2>
            <div className="sd-controls">
              <div className="sd-filter-group">
                <button className={`sd-filter-btn ${orderFilter === 'all' ? 'sd-filter-btn--active' : ''}`}
                  onClick={() => setOrderFilter('all')}>All Orders</button>
                <button className={`sd-filter-btn ${orderFilter === 'mine' ? 'sd-filter-btn--active' : ''}`}
                  onClick={() => setOrderFilter('mine')}>My Cases</button>
              </div>
              <TwentyFirstIconButton
                icon={Ico.plus(18)}
                title="New Order"
                ariaLabel="New Order"
                onClick={() => setShowCreateOrder(true)}
                variant="primary"
                size="md"
              />
            </div>
          </div>

          {loadingOrders ? (
            <div className="sd-loading">
              {[1,2,3,4].map(i => <div key={i} className="sd-skeleton-card" />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="sd-empty">
              {Ico.labOrder ? Ico.labOrder(48) : Ico.grid(48)}
              <p>No orders found.</p>
            </div>
          ) : (
            <div className="sd-order-grid">
              {filteredOrders.map(order => {
                const currentStageIdx = STAGES.findIndex(s => s.key === order.stage);
                return (
                  <div key={order.id || order._id} className="sd-order-card sd-order-card--clickable"
                    onClick={() => setEditOrderModal(order)}>
                    <div className="sd-order-header">
                      <div>
                        <span className="sd-order-caseid">{order.caseId || 'N/A'}</span>
                        <span className="sd-order-patient">{order.patientName || 'Unknown'}</span>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="sd-order-meta">
                      {order.owner?.name && <span className="sd-meta-item">{Ico.usersS(13)} {order.owner.name}</span>}
                      {order.owner?.clinicName && <span className="sd-meta-item">{order.owner.clinicName}</span>}
                    </div>

                    {/* Stage Stepper */}
                    <div className="sd-stage-stepper" onClick={e => e.stopPropagation()}>
                      {STAGES.map((stage, idx) => (
                        <button key={stage.key}
                          className={`sd-stage-step ${idx <= currentStageIdx ? 'sd-stage-step--done' : ''} ${idx === currentStageIdx ? 'sd-stage-step--current' : ''}`}
                          disabled={updatingStage === (order.id || order._id)}
                          onClick={() => handleStageUpdate(order.id || order._id, stage.key)}
                          title={`Set to: ${stage.label}`}
                          style={{ '--stage-color': stage.color }}>
                          <div className="sd-stage-dot" />
                          <span className="sd-stage-label">{stage.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ── INVENTORY VIEW ───────────────────────────────────────────── */}
      {activeView === 'inventory' && (
        <main className="sd-main">
          <div className="sd-section-header">
            <h2 className="sd-section-title">Inventory</h2>
            <div className="sd-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <TwentyFirstIconButton
                icon={Ico.refresh(16)}
                title="Refresh Inventory"
                ariaLabel="Refresh Inventory"
                onClick={fetchInventory}
                variant="secondary"
                size="md"
              />
              <TwentyFirstIconButton
                icon={Ico.plus(18)}
                title="Add Item"
                ariaLabel="Add Item"
                onClick={() => setShowAddItem(true)}
                variant="primary"
                size="md"
              />
            </div>
          </div>

          {loadingInventory ? (
            <div className="sd-loading">
              {[1,2,3].map(i => <div key={i} className="sd-skeleton-card" />)}
            </div>
          ) : inventory.length === 0 ? (
            <div className="sd-empty">
              <p>No inventory items yet. Add items to track raw materials.</p>
            </div>
          ) : (
            <div className="sd-inv-grid">
              {inventory.map(item => (
                <div key={item.id} className="sd-inv-card">
                  <div className="sd-inv-info">
                    <span className="sd-inv-name">{item.item_name}</span>
                    <span className="sd-inv-unit">{item.unit}</span>
                    {item.quantity <= item.min_stock && item.min_stock > 0 && (
                      <span className="sd-inv-low">LOW STOCK</span>
                    )}
                  </div>
                  <div className="sd-inv-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TwentyFirstIconButton
                      icon={Ico.minus(14)}
                      title="Decrease Stock"
                      ariaLabel="Decrease Stock"
                      onClick={() => handleUpdateStock(item, -1)}
                      variant="secondary"
                      size="sm"
                      rounded="full"
                    />
                    <span className="sd-inv-qty" style={{ minWidth: '28px', textAlign: 'center' }}>{item.quantity}</span>
                    <TwentyFirstIconButton
                      icon={Ico.plus(14)}
                      title="Increase Stock"
                      ariaLabel="Increase Stock"
                      onClick={() => handleUpdateStock(item, 1)}
                      variant="secondary"
                      size="sm"
                      rounded="full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Item Modal */}
          {showAddItem && (
            <div className="sd-modal-overlay" onClick={() => setShowAddItem(false)}>
              <div className="sd-modal" onClick={e => e.stopPropagation()}>
                <div className="sd-modal-header">
                  <h3>Add Inventory Item</h3>
                  <button className="sd-modal-close" onClick={() => setShowAddItem(false)}>{Ico.x(16)}</button>
                </div>
                <div className="sd-modal-body">
                  <div className="sd-field">
                    <label>Item Name</label>
                    <input type="text" placeholder="e.g. Zirconia Disc 98mm" value={itemForm.item_name}
                      onChange={e => setItemForm(f => ({ ...f, item_name: e.target.value }))} />
                  </div>
                  <div className="sd-field-row">
                    <div className="sd-field">
                      <label>Quantity</label>
                      <input type="number" min="0" placeholder="0" value={itemForm.quantity}
                        onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div className="sd-field">
                      <label>Unit</label>
                      <input type="text" placeholder="pcs / grams / ml" value={itemForm.unit}
                        onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} />
                    </div>
                  </div>
                  <div className="sd-field">
                    <label>Min Stock Alert</label>
                    <input type="number" min="0" placeholder="0 (disabled)" value={itemForm.min_stock}
                      onChange={e => setItemForm(f => ({ ...f, min_stock: e.target.value }))} />
                  </div>
                </div>
                {itemFormError && <div className="sd-form-error">{itemFormError}</div>}
                <div className="sd-modal-actions">
                  <button className="sd-btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
                  <button className="sd-btn-primary" onClick={handleAddItem} disabled={itemFormSaving}>
                    {itemFormSaving ? 'Saving...' : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── LEADERBOARD VIEW ─────────────────────────────────────────── */}
      {activeView === 'leaderboard' && (
        <main className="sd-main">
          <div className="sd-section-header">
            <h2 className="sd-section-title">My Performance</h2>
            <TwentyFirstIconButton
              icon={Ico.refresh(16)}
              title="Refresh Performance"
              ariaLabel="Refresh Performance"
              onClick={fetchMyMetrics}
              variant="secondary"
              size="md"
            />
          </div>

          {loadingMetrics ? (
            <div className="sd-loading">
              {[1,2,3].map(i => <div key={i} className="sd-skeleton-card" />)}
            </div>
          ) : !myMetrics ? (
            <div className="sd-empty"><p>No performance data available.</p></div>
          ) : (
            <div className="sd-metrics-grid">
              <div className="sd-metric-card sd-metric-card--primary">
                <span className="sd-metric-value">{myMetrics.casesThisMonth}</span>
                <span className="sd-metric-label">Cases This Month</span>
              </div>
              <div className="sd-metric-card sd-metric-card--success">
                <span className="sd-metric-value">{myMetrics.presentDays}</span>
                <span className="sd-metric-label">Days Present</span>
              </div>
              <div className="sd-metric-card sd-metric-card--warning">
                <span className="sd-metric-value">{myMetrics.halfDays}</span>
                <span className="sd-metric-label">Half Days</span>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── DENTISTS VIEW ─────────────────────────────────────────────── */}
      {activeView === 'dentists' && (
        <main className="sd-main">
          {!selectedDentist ? (
            <div>
              <div className="sd-section-header">
                <h2 className="sd-section-title">Dentists</h2>
                <div className="sd-controls">
                  <div className="sd-search-wrap">
                    {Ico.search(14)}
                    <input type="text" className="sd-search" placeholder="Search dentists..."
                      value={dentistSearch} onChange={e => setDentistSearch(e.target.value)} />
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
                <div className="sd-loading">
                  {[1,2,3,4].map(i => <div key={i} className="sd-skeleton-card" />)}
                </div>
              ) : filteredDentists.length === 0 ? (
                <div className="sd-empty">
                  {Ico.usersS ? Ico.usersS(48) : Ico.grid(48)}
                  <p>No dentists found.</p>
                </div>
              ) : (
                <div className="sd-order-grid">
                  {filteredDentists.map(d => (
                    <div key={d._id || d.id} className="sd-order-card" style={{ cursor: 'pointer' }}
                      onClick={() => { fetchDentistDetail(d._id || d.id); setDentistSubTab('orders'); }}>
                      <div className="sd-order-header">
                        <div>
                          <span className="sd-order-caseid">{d.name || 'Unnamed'}</span>
                          <span className="sd-order-patient">{d.clinicName || ''}</span>
                        </div>
                        <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                          {Ico.chevronRight(16)}
                        </span>
                      </div>
                      <div className="sd-order-meta">
                        {d.email && <span className="sd-meta-item">{d.email}</span>}
                        {d.phone && <span className="sd-meta-item">{d.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="sd-section-header" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TwentyFirstIconButton
                    icon={Ico.arrowLeft(16)}
                    title="Back to Dentists List"
                    ariaLabel="Back to Dentists List"
                    onClick={() => { setSelectedDentist(null); setDentistOrders([]); setSelectedStaffPaymentIds([]); setStaffPayMonth('all'); }}
                    variant="secondary"
                    size="md"
                  />
                  <div>
                    <h2 className="sd-section-title" style={{ margin: 0 }}>{selectedDentist.name}</h2>
                    <div style={{ fontSize: '0.78rem', color: '#708c80' }}>
                      {selectedDentist.clinicName}{selectedDentist.email ? ` | ${selectedDentist.email}` : ''}
                    </div>
                  </div>
                </div>
                <TwentyFirstIconButton
                  icon={Ico.plus(18)}
                  title="New Order for Dentist"
                  ariaLabel="New Order for Dentist"
                  onClick={() => setShowCreateOrder(true)}
                  variant="primary"
                  size="md"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['orders', 'payments'].map(tab => (
                  <button key={tab}
                    className={`sd-filter-btn ${dentistSubTab === tab ? 'sd-filter-btn--active' : ''}`}
                    onClick={() => { setDentistSubTab(tab); setSelectedStaffPaymentIds([]); setStaffPayMonth('all'); }}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {loadingDentistDetail ? (
                <div className="sd-loading">{[1,2,3].map(i => <div key={i} className="sd-skeleton-card" />)}</div>
              ) : dentistSubTab === 'orders' ? (
                dentistOrders.length === 0 ? (
                  <div className="sd-empty"><p>No orders for this dentist.</p></div>
                ) : (
                  <div className="sd-order-grid">
                    {dentistOrders.map(order => (
                      <div key={order._id || order.id} className="sd-order-card">
                        <div className="sd-order-header">
                          <div>
                            <span className="sd-order-caseid">{order.caseId}</span>
                            <span className="sd-order-patient">{order.patientName}</span>
                          </div>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <div className="sd-order-meta">
                          <span className="sd-meta-item">Stage: {order.stage || 'received'}</span>
                          {order.dueDate && <span className="sd-meta-item">Due: {order.dueDate.slice(0, 10)}</span>}
                          <span className="sd-meta-item">Payment: {order.paymentStatus || 'Pending'}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <TwentyFirstIconButton
                            icon={Ico.pencil(14)}
                            title="Edit Order"
                            ariaLabel="Edit Order"
                            onClick={() => setEditOrderModal(order)}
                            size="sm"
                            variant="soft"
                          />
                          {order.paymentId && (
                            <TwentyFirstIconButton
                              icon={Ico.creditCard(14)}
                              title="Update Payment"
                              ariaLabel="Update Payment"
                              onClick={() => setEditPaymentModal(order)}
                              size="sm"
                              variant="success"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                dentistOrders.filter(o => o.paymentAmount > 0 || o.paymentStatus).length === 0 ? (
                  <div className="sd-empty"><p>No payment records for this dentist.</p></div>
                ) : (
                  <div>
                    {/* Month Filter Controls */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <label htmlFor="staff-month-filter" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4a7060' }}>
                        Filter Month:
                      </label>
                      <input
                        id="staff-month-filter"
                        type="month"
                        value={staffPayMonth === 'all' ? '' : staffPayMonth}
                        onChange={e => setStaffPayMonth(e.target.value || 'all')}
                        style={{
                          border: '1px solid #c2dcd0',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.82rem',
                          background: '#fff',
                          cursor: 'pointer',
                          minHeight: '36px',
                        }}
                      />
                      {staffPayMonth !== 'all' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setStaffPayMonth('all')}
                            style={{
                              background: '#f0f4f2',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              color: '#4a7060',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            All Months
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectStaffMonthOrders}
                            style={{
                              background: '#e8f2ec',
                              border: '1px solid #78937E',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              color: '#1e5038',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                            title="Add all orders from this month to payment selection"
                          >
                            + Select {staffPayMonth} Orders ({filteredStaffDentistOrders.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const dId = selectedDentist.id || selectedDentist._id;
                              const mQuery = staffPayMonth && staffPayMonth !== 'all' ? `&month=${encodeURIComponent(staffPayMonth)}` : '';
                              window.open(`/invoice?unpaid=true&dentistId=${encodeURIComponent(dId)}${mQuery}`, '_blank');
                            }}
                            style={{
                              background: '#1e5038',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download Pending Bill
                          </button>
                        </>
                      )}
                      {selectedStaffPaymentIds.length > 0 && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78937E', background: '#eff5f1', padding: '3px 10px', borderRadius: '6px' }}>
                            {selectedStaffPaymentIds.length} orders selected across months
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedStaffPaymentIds([])}
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
                            Clear Selection
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Multi-select Header Bar */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: '12px', padding: '6px 4px',
                    }}>
                      <label
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#4a7060',
                          userSelect: 'none',
                        }}
                        onClick={toggleSelectAllStaffPayments}
                      >
                        <input
                          type="checkbox"
                          checked={
                            filteredStaffDentistOrders.length > 0 &&
                            filteredStaffDentistOrders.every(o =>
                              selectedStaffPaymentIds.includes(o._id || o.id || o.caseId)
                            )
                          }
                          onChange={toggleSelectAllStaffPayments}
                          style={{ width: '16px', height: '16px', accentColor: '#1e5038', cursor: 'pointer' }}
                        />
                        <span>
                          Select All ({filteredStaffDentistOrders.length})
                        </span>
                      </label>
                      {selectedStaffPaymentIds.length > 0 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e5038', background: '#edf5f0', padding: '2px 8px', borderRadius: '6px' }}>
                          {selectedStaffPaymentIds.length} selected
                        </span>
                      )}
                    </div>

                    {filteredStaffDentistOrders.length === 0 ? (
                      <div className="sd-empty"><p>No payment records for {staffPayMonth}.</p></div>
                    ) : (
                      <div className="sd-order-grid">
                        {filteredStaffDentistOrders.map(order => {
                        const oid = order._id || order.id || order.caseId;
                        const isSelected = selectedStaffPaymentIds.includes(oid);
                        return (
                          <div
                            key={oid}
                            className="sd-order-card"
                            style={{
                              border: isSelected ? '1.5px solid #1e5038' : undefined,
                              background: isSelected ? '#edf5f0' : undefined,
                              transition: 'background 0.15s ease, border-color 0.15s ease',
                            }}
                          >
                            <div className="sd-order-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  onClick={e => { e.stopPropagation(); toggleStaffPaymentSelect(oid); }}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Select for batch payment"
                                  aria-label="Select order for batch payment"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleStaffPaymentSelect(oid)}
                                    onClick={e => e.stopPropagation()}
                                    style={{ width: '16px', height: '16px', accentColor: '#1e5038', cursor: 'pointer' }}
                                  />
                                </div>
                                <div>
                                  <span className="sd-order-caseid">{order.caseId}</span>
                                  <span className="sd-order-patient">{order.patientName}</span>
                                </div>
                              </div>
                              <StatusBadge status={order.paymentStatus || 'Pending'} size="sm" />
                            </div>
                            <div className="sd-order-meta">
                              <span className="sd-meta-item">Amount: {order.paymentAmount > 0 ? formatINR(order.paymentAmount) : 'N/A'}</span>
                              {order.paymentMode && <span className="sd-meta-item">Mode: {order.paymentMode}</span>}
                              {order.paidAt && <span className="sd-meta-item">Paid: {new Date(order.paidAt).toLocaleDateString('en-IN')}</span>}
                            </div>
                            {order.paymentId && (
                              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <TwentyFirstIconButton
                                  icon={Ico.creditCard(14)}
                                  title="Update Payment"
                                  ariaLabel="Update Payment"
                                  onClick={() => setEditPaymentModal(order)}
                                  size="sm"
                                  variant="success"
                                />
                                {order.paymentStatus === 'Paid' && (
                                  <TwentyFirstIconButton
                                    icon={Ico.fileText(14)}
                                    title="View / Print Invoice"
                                    ariaLabel="View / Print Invoice"
                                    onClick={() => handleViewStaffInvoice(order)}
                                    size="sm"
                                    variant="soft"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Batch Settlement Bar */}
                    {selectedStaffPaymentIds.length > 0 && (
                      <div style={{
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
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ background: '#25503b', color: '#a3bfb1', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                            {selectedStaffPaymentIds.length} {selectedStaffPaymentIds.length === 1 ? 'order' : 'orders'} selected
                          </span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2ece6' }}>
                            Total: <strong style={{ color: '#fff', fontSize: '1.02rem' }}>
                              {formatINR(dentistOrders.filter(o => selectedStaffPaymentIds.includes(o._id || o.id || o.caseId)).reduce((s, o) => s + (Number(o.paymentAmount) || 0), 0))}
                            </strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedStaffPaymentIds([])}
                            style={{ background: 'transparent', border: '1px solid #4a6a5a', color: '#c2d6cc', padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', minHeight: '38px' }}
                          >
                            Deselect
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchPayForm({ status: 'Paid', paymentMode: 'Cash', referenceNumber: '', notes: '' });
                              setBatchPayError('');
                              setBatchPayModalOpen(true);
                            }}
                            style={{ background: '#1e5038', border: '1px solid #708c80', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px' }}
                          >
                            {Ico.creditCard(14)} Settle Payment for {selectedStaffPaymentIds.length} Orders
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </main>
      )}

      {/* ── SETTINGS VIEW ────────────────────────────────────────────── */}
      {activeView === 'settings' && (
        <main className="sd-main">
          <h2 className="sd-section-title" style={{ marginBottom: '20px' }}>Account Settings</h2>

          {/* Profile Card */}
          <div className="sd-settings-card">
            <div className="sd-settings-card-head">
              <div className="sd-settings-avatar">{initials}</div>
              <div className="sd-settings-card-head-info">
                <span className="sd-settings-card-name">{staff?.displayName || staff?.username}</span>
                <span className="sd-settings-card-email">{staff?.email || staff?.username}</span>
              </div>
              {!isEditingProfile && (
                <TwentyFirstIconButton
                  icon={Ico.pencil(15)}
                  title="Edit Profile"
                  ariaLabel="Edit Profile"
                  onClick={() => { setIsEditingProfile(true); setProfileMsg({ type: '', text: '' }); }}
                  size="sm"
                  variant="soft"
                />
              )}
            </div>

            {!isEditingProfile && (
              <div className="sd-settings-info-rows">
                <div className="sd-settings-info-row">
                  <span className="sd-settings-info-label">Full Name</span>
                  <span className="sd-settings-info-value">{staff?.displayName || '\u2014'}</span>
                </div>
                <div className="sd-settings-info-row">
                  <span className="sd-settings-info-label">Username</span>
                  <span className="sd-settings-info-value">{staff?.username || '\u2014'}</span>
                </div>
                <div className="sd-settings-info-row">
                  <span className="sd-settings-info-label">Date of Birth</span>
                  <span className="sd-settings-info-value">{formatDob(staff?.dob)}</span>
                </div>
                <div className="sd-settings-info-row">
                  <span className="sd-settings-info-label">Email</span>
                  <span className="sd-settings-info-value">{staff?.email || '\u2014'}</span>
                </div>
                <div className="sd-settings-info-row">
                  <span className="sd-settings-info-label">Phone</span>
                  <span className="sd-settings-info-value">{staff?.phone || '\u2014'}</span>
                </div>
              </div>
            )}

            {isEditingProfile && (
              <form className="sd-settings-edit-form" onSubmit={handleProfileSave} noValidate>
                <div className="sd-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={e => setProfileForm(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Your name"
                    maxLength={60}
                    autoFocus
                  />
                </div>
                <div className="sd-field-row">
                  <div className="sd-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="sd-field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Mobile number"
                      maxLength={20}
                    />
                  </div>
                </div>
                <div className="sd-field">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {profileMsg.text && (
                  <div className={`sd-form-msg sd-form-msg--${profileMsg.type}`}>
                    {profileMsg.text}
                  </div>
                )}
                <div className="sd-modal-actions">
                  <button type="button" className="sd-btn-secondary" onClick={() => { setIsEditingProfile(false); setProfileMsg({ type: '', text: '' }); }} disabled={profileSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="sd-btn-primary" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {profileMsg.text && !isEditingProfile && (
              <div className={`sd-form-msg sd-form-msg--${profileMsg.type}`}>
                {profileMsg.text}
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="sd-settings-card" style={{ marginTop: '16px' }}>
            <div className="sd-settings-action-row">
              <div className="sd-settings-action-info">
                <span className="sd-settings-action-label">Change Password</span>
                <span className="sd-settings-action-sub">Update your login password.</span>
              </div>
              <button
                type="button"
                className="sd-btn-secondary"
                onClick={() => {
                  setShowChangePassword(v => !v);
                  setPwMsg({ type: '', text: '' });
                  setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                {showChangePassword ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showChangePassword && (
              <form className="sd-settings-edit-form" onSubmit={handlePasswordChange} noValidate style={{ marginTop: '16px' }}>
                {[
                  { key: 'current', label: 'Current Password', field: 'currentPassword', autoComplete: 'current-password' },
                  { key: 'new',     label: 'New Password',     field: 'newPassword',     autoComplete: 'new-password' },
                  { key: 'confirm', label: 'Confirm Password', field: 'confirmPassword', autoComplete: 'new-password' },
                ].map(({ key, label, field, autoComplete }) => (
                  <div className="sd-field" key={key}>
                    <label>{label}</label>
                    <div className="sd-pw-wrap">
                      <input
                        type={showPw[key] ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={label}
                        autoComplete={autoComplete}
                      />
                      <button
                        type="button"
                        className="sd-pw-toggle"
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        aria-label={showPw[key] ? 'Hide' : 'Show'}
                      >
                        <EyeIcon show={showPw[key]} />
                      </button>
                    </div>
                  </div>
                ))}
                {pwMsg.text && (
                  <div className={`sd-form-msg sd-form-msg--${pwMsg.type}`}>
                    {pwMsg.text}
                  </div>
                )}
                <button type="submit" className="sd-btn-primary" disabled={pwSaving} style={{ alignSelf: 'flex-start' }}>
                  {pwSaving ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </main>
      )}

        </div>
      </div>

      {/* ── Modals (global — work from any view) ─────────────────────── */}
      {editOrderModal && (
        <StaffOrderModal
          order={editOrderModal}
          onClose={() => setEditOrderModal(null)}
          onSave={handleEditOrderSubmit}
          saving={editOrderSaving}
        />
      )}

      {editPaymentModal && (
        <StaffPaymentModal
          payment={editPaymentModal}
          onClose={() => setEditPaymentModal(null)}
          onSave={handleEditPaymentSubmit}
          saving={editPaymentSaving}
        />
      )}

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

      {/* ── Staff Batch Payment Modal ──────────────────────────────── */}
      <BaseModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        maxWidth="max-w-md"
        className="sd-modal-wrap"
        raw={true}
        id="staff-batch-pay-modal"
      >
        <div className="sd-modal-content">
          <div className="sd-modal-header">
            <h3>Update Payment Details ({selectedStaffPaymentIds.length} Orders)</h3>
            <button className="sd-modal-close" onClick={() => setBatchPayModalOpen(false)} aria-label="Close">{Ico.x(16)}</button>
          </div>
          <div className="sd-modal-body">
            <div className="sd-modal-summary">
              {selectedDentist && <span><strong>Dentist:</strong> {selectedDentist.name}</span>}
              <span><strong>Cases:</strong> {selectedStaffPaymentIds.length}</span>
              <span><strong>Total:</strong> {formatINR(dentistOrders.filter(o => selectedStaffPaymentIds.includes(o._id || o.id || o.caseId)).reduce((s, o) => s + (Number(o.paymentAmount) || 0), 0))}</span>
            </div>

            <div className="sd-field">
              <label>Payment Status</label>
              <select value={batchPayForm.status} onChange={e => setBatchPayForm(f => ({ ...f, status: e.target.value }))}>
                {['Paid', 'Pending', 'Overdue', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {batchPayForm.status === 'Paid' && (
              <>
                <div className="sd-field">
                  <label>Payment Mode</label>
                  <select value={batchPayForm.paymentMode} onChange={e => setBatchPayForm(f => ({ ...f, paymentMode: e.target.value }))}>
                    {['Cash', 'UPI', 'Cheque', 'Other'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="sd-field">
                  <label>Reference / Transaction Number</label>
                  <input
                    type="text"
                    placeholder="UTR / Cheque No."
                    value={batchPayForm.referenceNumber}
                    onChange={e => setBatchPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="sd-field">
              <label>Notes / Settlement Reference (optional)</label>
              <input
                type="text"
                placeholder="e.g. Cleared via monthly account"
                value={batchPayForm.notes}
                onChange={e => setBatchPayForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {batchPayError && <div className="sd-form-error">{batchPayError}</div>}
          </div>
          <div className="sd-modal-actions">
            <button className="sd-btn-secondary" onClick={() => setBatchPayModalOpen(false)}>Cancel</button>
            <button className="sd-btn-primary" onClick={handleBatchStaffPaymentSubmit} disabled={batchPaySaving}>
              {batchPaySaving ? 'Saving...' : `Confirm for ${selectedStaffPaymentIds.length} Orders`}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* ── Printable Invoice / Batch Statement Modal ── */}
      {batchStatementModal && (
        <PrintableInvoice
          statement={batchStatementModal}
          onClose={() => setBatchStatementModal(null)}
        />
      )}
      {singleInvoiceModal && (
        <PrintableInvoice
          order={singleInvoiceModal}
          onClose={() => setSingleInvoiceModal(null)}
        />
      )}

      {/* ── 21st.dev Mobile Bottom Nav ───────────────────────────────── */}
      <TwentyFirstBottomNav
        items={visibleNavItems.map(it => it.key === 'orders' ? { ...it, badge: orders.length } : it)}
        activeKey={activeView}
        onChange={setActiveView}
      />
    </div>
  );
};

export default StaffDashboard;
