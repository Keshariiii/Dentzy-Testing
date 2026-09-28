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
import { Icons as Ico } from '../components/common/DashboardIcons';
import StaffOrderModal from './StaffOrderModal';
import StaffPaymentModal from './StaffPaymentModal';
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
  { key: 'orders', label: 'Orders' },
  { key: 'dentists', label: 'Dentists' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'settings', label: 'Settings' },
];

const StaffDashboard = () => {
  const router = useRouter();
  const { staff, staffLogout, updateStaffState, authFetch, STAFF_API } = useStaffAuth();
  const [activeView, setActiveView] = useState('orders');

  // ── Orders ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'mine'
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingStage, setUpdatingStage] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

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
  const filteredOrders = orders.filter(o => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (o.patientName || '').toLowerCase().includes(q) ||
           (o.caseId || '').toLowerCase().includes(q) ||
           (o.owner?.name || '').toLowerCase().includes(q);
  });

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
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="sd-header">
        <div className="sd-header-left">
          <img src="/dentzy-logo-v2.png" alt="Dentzy" className="sd-logo" />
          <span className="sd-header-title">Staff Portal</span>
        </div>
        <div className="sd-header-right">
          <span className="sd-header-name">{staffName}</span>
          <div className="sd-avatar">{initials}</div>
          <button onClick={handleLogout} className="sd-logout-btn">
            {Ico.logout(16)} <span className="sd-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Navigation Tabs ─────────────────────────────────────────── */}
      <nav className="sd-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key}
            className={`sd-nav-btn ${activeView === item.key ? 'sd-nav-btn--active' : ''}`}
            onClick={() => setActiveView(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div className={`sd-toast sd-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

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
              <div className="sd-search-wrap">
                {Ico.search(14)}
                <input type="text" className="sd-search" placeholder="Search orders..."
                  value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              </div>
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
                      <span className={`sd-order-status sd-order-status--${(order.status || '').toLowerCase().replace(/\s/g, '-')}`}>
                        {order.status}
                      </span>
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
            <div className="sd-controls">
              <button onClick={fetchInventory} className="sd-btn-secondary">Refresh</button>
              <button onClick={() => setShowAddItem(true)} className="sd-btn-primary">+ Add Item</button>
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
                  <div className="sd-inv-controls">
                    <button className="sd-inv-btn" onClick={() => handleUpdateStock(item, -1)}>-</button>
                    <span className="sd-inv-qty">{item.quantity}</span>
                    <button className="sd-inv-btn" onClick={() => handleUpdateStock(item, 1)}>+</button>
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
            <button onClick={fetchMyMetrics} className="sd-btn-secondary">Refresh</button>
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
                  <button onClick={fetchDentists} className="sd-btn-secondary">Refresh</button>
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
                  <button onClick={() => { setSelectedDentist(null); setDentistOrders([]); }} className="sd-btn-secondary">
                    Back
                  </button>
                  <div>
                    <h2 className="sd-section-title" style={{ margin: 0 }}>{selectedDentist.name}</h2>
                    <div style={{ fontSize: '0.78rem', color: '#708c80' }}>
                      {selectedDentist.clinicName}{selectedDentist.email ? ` | ${selectedDentist.email}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['orders', 'payments'].map(tab => (
                  <button key={tab}
                    className={`sd-filter-btn ${dentistSubTab === tab ? 'sd-filter-btn--active' : ''}`}
                    onClick={() => setDentistSubTab(tab)}>
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
                          <span className={`sd-order-status sd-order-status--${(order.status || '').toLowerCase().replace(/\s/g, '-')}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="sd-order-meta">
                          <span className="sd-meta-item">Stage: {order.stage || 'received'}</span>
                          {order.dueDate && <span className="sd-meta-item">Due: {order.dueDate.slice(0, 10)}</span>}
                          <span className="sd-meta-item">Payment: {order.paymentStatus || 'Pending'}</span>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <button className="sd-btn-secondary" style={{ fontSize: '0.78rem' }}
                            onClick={() => setEditOrderModal(order)}>Edit Order</button>
                          {order.paymentId && (
                            <button className="sd-btn-secondary" style={{ fontSize: '0.78rem' }}
                              onClick={() => setEditPaymentModal(order)}>Update Payment</button>
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
                  <div className="sd-order-grid">
                    {dentistOrders.filter(o => o.paymentAmount > 0 || o.paymentStatus).map(order => (
                      <div key={order._id || order.id} className="sd-order-card">
                        <div className="sd-order-header">
                          <div>
                            <span className="sd-order-caseid">{order.caseId}</span>
                            <span className="sd-order-patient">{order.patientName}</span>
                          </div>
                          <span className={`sd-order-status sd-order-status--${(order.paymentStatus || 'pending').toLowerCase()}`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        <div className="sd-order-meta">
                          <span className="sd-meta-item">Amount: {order.paymentAmount > 0 ? `INR ${order.paymentAmount.toLocaleString('en-IN')}` : 'N/A'}</span>
                          {order.paymentMode && <span className="sd-meta-item">Mode: {order.paymentMode}</span>}
                          {order.paidAt && <span className="sd-meta-item">Paid: {new Date(order.paidAt).toLocaleDateString('en-IN')}</span>}
                        </div>
                        {order.paymentId && (
                          <div style={{ marginTop: '8px' }}>
                            <button className="sd-btn-secondary" style={{ fontSize: '0.78rem' }}
                              onClick={() => setEditPaymentModal(order)}>Update Payment</button>
                          </div>
                        )}
                      </div>
                    ))}
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
                <button
                  type="button"
                  className="sd-btn-secondary"
                  onClick={() => { setIsEditingProfile(true); setProfileMsg({ type: '', text: '' }); }}
                >
                  Edit
                </button>
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

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <div className="sd-bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key}
            className={`sd-bnav-btn ${activeView === item.key ? 'sd-bnav-btn--active' : ''}`}
            onClick={() => setActiveView(item.key)}>
            <span className="sd-bnav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StaffDashboard;
