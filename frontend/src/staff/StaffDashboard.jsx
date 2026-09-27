'use client';
/**
 * StaffDashboard — Full-featured Staff Portal.
 * Sections: Orders, Inventory, Leaderboard.
 * Premium 21st.dev-inspired design. No emojis. No card borders (shadows only).
 * Ponytail: one component serves both desktop and mobile via responsive CSS.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from './StaffAuthContext';
import { Icons as Ico } from '../components/common/DashboardIcons';
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
  { key: 'inventory', label: 'Inventory' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

const StaffDashboard = () => {
  const router = useRouter();
  const { staff, staffLogout, authFetch, STAFF_API } = useStaffAuth();
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

  // ── Helpers ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (o.patientName || '').toLowerCase().includes(q) ||
           (o.caseId || '').toLowerCase().includes(q) ||
           (o.owner?.name || '').toLowerCase().includes(q);
  });

  const handleLogout = () => { staffLogout(); router.push('/login?role=staff'); };

  const staffName = staff?.displayName || staff?.username || 'Staff';
  const initials = staffName.slice(0, 2).toUpperCase();

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
                  <div key={order.id || order._id} className="sd-order-card">
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
                    <div className="sd-stage-stepper">
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
