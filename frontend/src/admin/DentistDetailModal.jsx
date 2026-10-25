'use client';
/**
 * DentistDetailModal — shared modal used by both desktop and mobile admin dashboards.
 * Shows a dentist's profile, all associated lab orders, and an optional new-order form.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import './DentistDetailModal.css';
import BaseModal from '../components/ui/BaseModal';
import ConfirmDialog from '../components/ConfirmDialog';
import OrderDetailModal from '../components/OrderDetailModal';

import { Icons as Ico } from '../components/common/DashboardIcons';
import { useToast } from '../context/ToastContext';
import CreateOrderModal from '../components/common/CreateOrderModal';
import TwentyFirstIconButton from '../components/ui/twentyfirst-icon-button';
import { StatusBadge } from '../components/ui/status-badge';
import { formatINR } from '../utils/format';
import PrintableInvoice from '../components/common/PrintableInvoice';

/* ─── Constants ───────────────────────────────────────────────────────────── */
const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
const STAGE_LABELS = {
  received: 'Received', design: 'Design', production: 'Production',
  qc: 'QC', dispatched: 'Dispatched', completed: 'Completed',
};


const STATUS_CLS   = { pending: 'ddm-s-pending', approved: 'ddm-s-approved', rejected: 'ddm-s-rejected' };

const FALLBACK_RATES = { Crown: 750, Bridge: 750, Denture: 1500, Implant: 1800, Veneer: 1800, Retainer: 1200, Other: 500 };
const getOrderPrice = (o) => {
  const val = Number(o?.amount) || Number(o?.paymentAmount) || 0;
  if (val > 0) return val;
  const matched = Object.keys(FALLBACK_RATES).find(k => k.toLowerCase() === (o?.serviceType || '').toLowerCase()) || 'Other';
  const base = FALLBACK_RATES[matched] || 500;
  let units = 1;
  const raw = o?.teeth_data ?? o?.teethData ?? o?.teeth;
  if (Array.isArray(raw)) units = raw.length > 0 ? raw.length : 1;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) units = p.length;
    } catch {}
  }
  return base * units;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── Pipeline Progress Bar ──────────────────────────────────────────────── */
const PipelineBar = ({ stage }) => {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="ddm-pipeline">
      {STAGES.map((s, i) => (
        <React.Fragment key={s}>
          <div className={[
            'ddm-pipeline-step',
            i <= idx  ? 'ddm-pipeline-step--done' : '',
            i === idx ? 'ddm-pipeline-step--current' : '',
          ].join(' ')}>
            <div className="ddm-pipeline-dot" />
            <span className="ddm-pipeline-label">{STAGE_LABELS[s]}</span>
          </div>
          {i < STAGES.length - 1 && (
            <div className={`ddm-pipeline-line ${i < idx ? 'ddm-pipeline-line--done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const DentistDetailModal = ({ userId, onClose, onDeleteUser, users = [], onSelectDentist }) => {
  const { authFetch, ADMIN_API, admin } = useAdminAuth();

  const [activeUserId, setActiveUserId] = useState(userId);
  useEffect(() => { setActiveUserId(userId); }, [userId]);

  const [user, setUser]               = useState(null);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stageLoading, setStageLoading] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [creditOverridePrompt, setCreditOverridePrompt] = useState(null);
  const { showToast } = useToast();

  // Subtab and batch payment state
  const [subTab, setSubTab] = useState('orders'); // 'orders' | 'payments'
  const [payMonth, setPayMonth] = useState('all');
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
  const [batchPayForm, setBatchPayForm] = useState({ mode: 'Cash', referenceNumber: '', notes: '', status: 'Paid' });
  const [batchPaySaving, setBatchPaySaving] = useState(false);
  const [batchPayError, setBatchPayError] = useState('');
  const [batchStatementModal, setBatchStatementModal] = useState(null);

  /* ── Load dentist profile + orders ──────────────────────────────────────── */
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const load = useCallback(async () => {
    if (!admin || !activeUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await authFetchRef.current(`${ADMIN_API}/users/${activeUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrders(data.orders || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [activeUserId, ADMIN_API, admin]);

  useEffect(() => { load(); }, [load]);

  const filteredOrdersForMonth = orders.filter(o => {
    if (payMonth === 'all') return true;
    const d = o.createdAt || '';
    return d.startsWith(payMonth);
  });

  const toggleSelectPayment = (id) => {
    setSelectedPaymentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPayments = () => {
    const targetIds = filteredOrdersForMonth.map(o => o.paymentId || o._id || o.id);
    const allSelected = targetIds.length > 0 && targetIds.every(id => selectedPaymentIds.includes(id));
    if (allSelected) {
      setSelectedPaymentIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedPaymentIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  const handleSelectAllPending = () => {
    const pendingIds = orders
      .filter(o => o.paymentStatus !== 'Paid')
      .map(o => o.paymentId || o._id || o.id);
    setSelectedPaymentIds(Array.from(new Set(pendingIds)));
  };

  const handleBatchRecordPayment = async () => {
    setBatchPayError('');
    if (batchPayForm.status === 'Paid') {
      if (batchPayForm.mode === 'Cheque' && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 3)) {
        setBatchPayError('Cheque number is required (min 3 characters).');
        return;
      }
      if ((batchPayForm.mode === 'UPI' || batchPayForm.mode === 'Net Banking') && (!batchPayForm.referenceNumber || batchPayForm.referenceNumber.trim().length < 4)) {
        setBatchPayError('Transaction / UTR number is required (min 4 characters).');
        return;
      }
    }
    setBatchPaySaving(true);
    try {
      const body = {
        paymentIds: selectedPaymentIds,
        status: batchPayForm.status,
        paymentMode: batchPayForm.status === 'Paid' ? batchPayForm.mode : '',
        referenceNumber: batchPayForm.status === 'Paid' ? (batchPayForm.referenceNumber || '') : '',
        notes: batchPayForm.notes || '',
      };
      const res = await authFetch(`${ADMIN_API}/payments/batch`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Updated ${selectedPaymentIds.length} payments.`);
        setSelectedPaymentIds([]);
        setBatchPayModalOpen(false);
        load();

        if (body.status === 'Paid' && data.batchId) {
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
    } finally {
      setBatchPaySaving(false);
    }
  };




  /* ── Update order stage ──────────────────────────────────────────────── */
  const handleStageChange = async (orderId, newStage) => {
    setStageLoading(orderId);
    try {
      const res  = await authFetch(`${ADMIN_API}/orders/${orderId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev =>
          prev.map(o => (o._id || o.id) === orderId
            ? { ...o, stage: newStage, status: data.order?.status || o.status }
            : o
          )
        );
        showToast(`Stage updated to "${STAGE_LABELS[newStage]}"`);
      } else {
        showToast(data.message || 'Failed to update stage', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setStageLoading(null);
  };

  /* ── Create new order ────────────────────────────────────────────────── */
  const handleSubmitOrder = async (payload) => {
    setSubmitting(true);
    try {
      const res = await authFetch(`${ADMIN_API}/orders`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => [data.order, ...prev]);
        setShowForm(false);
        showToast(
          payload.creditOverride
            ? 'Order created successfully with credit limit override.'
            : 'Order created successfully.'
        );
      } else if (res.status === 403 && data.code === 'CREDIT_LIMIT_EXCEEDED') {
        showToast(
          `Credit limit exceeded (₹${Number(data.totalUnpaid || 0).toLocaleString('en-IN')} outstanding dues). Override required.`,
          'warning',
          6000
        );
        setCreditOverridePrompt({
          payload,
          totalUnpaid: data.totalUnpaid,
        });
      } else {
        showToast(data.message || 'Failed to create order', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSubmitting(false);
  };

  const handleConfirmCreditOverride = async () => {
    if (!creditOverridePrompt) return;
    const { payload } = creditOverridePrompt;
    setCreditOverridePrompt(null);
    await handleSubmitOrder({ ...payload, creditOverride: true });
  };
  /* ── Delete order ─────────────────────────────────────────────────────── */
  const handleDeleteOrderClick = (order) => {
    setOrderToDelete(order);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const oId = orderToDelete._id || orderToDelete.id;
    setDeletingOrder(true);
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${oId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.filter(o => (o._id || o.id) !== oId));
        showToast('Order deleted successfully.');
        setOrderToDelete(null);
      } else {
        showToast(data.message || 'Failed to delete order', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeletingOrder(false);
    }
  };

  /* ── Delete dentist account ────────────────────────────────────────────── */
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`${ADMIN_API}/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Dentist account deleted.');
        setShowConfirmDelete(false);
        if (onDeleteUser) onDeleteUser();
        onClose();
      } else {
        showToast(data.message || 'Failed to delete dentist', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <>
      <BaseModal
        isOpen={Boolean(userId)}
        onClose={onClose}
        maxWidth="max-w-3xl"
        className="ddm-panel-wrap"
        closeOnEscape={true}
        raw={true}
        id={`dentist-${userId}`}
      >
        <div className="ddm-panel-content">

        {/* Header */}
        <div className="ddm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span className="ddm-header-title">Dentist Details</span>
            {users && users.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#708c80', fontWeight: 600 }}>Dentist:</span>
                <select
                  value={activeUserId}
                  onChange={(e) => {
                    setActiveUserId(e.target.value);
                    if (onSelectDentist) onSelectDentist(e.target.value);
                    setSelectedPaymentIds([]);
                  }}
                  style={{
                    border: '1px solid #c2dcd0',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#1a3028',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {users.filter(u => u.status === 'approved').map(u => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      Dr. {u.name} {u.clinicName ? `(${u.clinicName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button className="ddm-close" onClick={onClose} aria-label="Close">{Ico.x(16)}</button>
        </div>

        {/* Body */}
        <div className="ddm-body">
          {loading ? (
            <div className="ddm-spinner-wrap">
              <div className="ddm-spinner" />
              <span>Loading profile…</span>
            </div>
          ) : !user ? (
            <div className="ddm-error">Failed to load dentist profile.</div>
          ) : (
            <>
              {/* ── Profile ─────────────────────────────────────────────── */}
              <div className="ddm-profile">
                <div className="ddm-profile-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
                <div className="ddm-profile-info">
                  <div className="ddm-profile-name-row">
                    <h2 className="ddm-profile-name">{user?.name || 'Dentist'}</h2>
                    <StatusBadge status={user?.status} size="sm" />
                  </div>
                  <div className="ddm-profile-meta">
                    {user.email     && <span className="ddm-meta-item">{Ico.mail(13)} {user.email}</span>}
                    {user.phone     && <span className="ddm-meta-item">{Ico.phone(13)} {user.phone}</span>}
                    {user.clinicName && <span className="ddm-meta-item">{Ico.clinic(13)} {user.clinicName}</span>}
                    {user.address   && <span className="ddm-meta-item">{Ico.map(13)} {user.address}</span>}
                    {user.dob       && <span className="ddm-meta-item">{Ico.calendar(13)} DOB: {fmt(user.dob)}</span>}
                    <span className="ddm-meta-item ddm-meta-registered">{Ico.user(13)} Registered: {fmt(user.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* ── Subtabs: Orders & Payments ── */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #eef2f0', paddingBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setSubTab('orders'); setSelectedPaymentIds([]); }}
                  style={{
                    background: subTab === 'orders' ? '#1e5038' : '#f0f4f2',
                    color: subTab === 'orders' ? '#ffffff' : '#4a7060',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Lab Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setSubTab('payments'); setSelectedPaymentIds([]); }}
                  style={{
                    background: subTab === 'payments' ? '#1e5038' : '#f0f4f2',
                    color: subTab === 'payments' ? '#ffffff' : '#4a7060',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Payments &amp; Billing ({orders.filter(o => o.paymentAmount > 0 || o.paymentStatus).length})
                </button>
              </div>

              {subTab === 'orders' ? (
                /* ── Orders section ───────────────────────────────────────── */
                <div className="ddm-section">
                  <div className="ddm-section-header">
                    <span className="ddm-section-title">Lab Orders ({orders.length})</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {orders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => window.open(`/invoice?unpaid=true&dentistId=${encodeURIComponent(user.id || user._id)}`, '_blank')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            background: '#e8f5ee',
                            color: '#1e5038',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          Unpaid Bill
                        </button>
                      )}
                      {user.status === 'approved' && (
                        <TwentyFirstIconButton
                          icon={Ico.plus(16)}
                          title="New Order"
                          ariaLabel="New Order"
                          onClick={() => setShowForm(true)}
                          size="sm"
                          variant="primary"
                        />
                      )}
                    </div>
                  </div>

                  {/* Create Order Modal */}
                  <CreateOrderModal
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                    dentist={user}
                    onSubmitOrder={handleSubmitOrder}
                    isSubmitting={submitting}
                  />

                  {/* Orders list */}
                  {orders.length === 0 ? (
                    <div className="ddm-orders-empty">
                      {Ico.package(32)}
                      <p>No lab orders yet.</p>
                    </div>
                  ) : (
                    <div className="ddm-orders-list">
                      {orders.map(order => {
                        const oId = order._id || order.id;
                        return (
                        <div
                          key={oId}
                          className="ddm-order-card"
                          onClick={() => setSelectedOrder(order)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="ddm-order-top">
                            <div className="ddm-order-id-row">
                              <span className="ddm-order-caseid">{order.caseId}</span>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <span className={`ddm-priority-badge ddm-p-${order.priority?.toLowerCase()}`}>{order.priority}</span>
                                {order.paymentStatus === 'Paid' ? (
                                  <span title="Paid order cannot be deleted. Revert payment to Pending first." style={{ fontSize: '0.72rem', color: '#708c80', background: '#edf5f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    Paid
                                  </span>
                                ) : (
                                  <TwentyFirstIconButton
                                    icon={Ico.trash(14)}
                                    title="Delete Order"
                                    ariaLabel="Delete Order"
                                    onClick={() => handleDeleteOrderClick(order)}
                                    size="sm"
                                    variant="danger"
                                  />
                                )}
                              </div>
                            </div>
                            <div className="ddm-order-patient">{order.patientName}</div>
                            <div className="ddm-order-meta-row">
                              <span className="ddm-order-service">{order.serviceType}</span>
                              <span style={{ fontWeight: 700, color: '#1e5038' }}>₹{getOrderPrice(order).toLocaleString('en-IN')}</span>
                              {order.dueDate && (
                                <span className="ddm-order-due">{Ico.calendar(12)} Due: {fmt(order.dueDate)}</span>
                              )}
                              {order.batchId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/invoice?batchId=${encodeURIComponent(order.batchId)}`, '_blank');
                                  }}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.72rem',
                                    background: '#e8f2ec',
                                    border: '1px solid #c2dcd0',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    color: '#1e5038',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Download Batch Invoice"
                                >
                                  Batch: {order.batchId}
                                </button>
                              )}
                            </div>
                          </div>

                          <PipelineBar stage={order.stage} />

                          <div className="ddm-order-stage-row" onClick={e => e.stopPropagation()}>
                            <label className="ddm-stage-label">Update Stage:</label>
                            <select
                              className="ddm-stage-select"
                              value={order.stage}
                              disabled={stageLoading === oId}
                              onChange={e => handleStageChange(oId, e.target.value)}>
                              {STAGES.map(s => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                              ))}
                            </select>
                            {stageLoading === oId && <span className="ddm-btn-spinner ddm-spinner-sm" />}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Payments section ── */
                <div className="ddm-section">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <label htmlFor="ddm-month-filter" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a7060' }}>
                      Month:
                    </label>
                    <input
                      id="ddm-month-filter"
                      type="month"
                      value={payMonth === 'all' ? '' : payMonth}
                      onChange={e => setPayMonth(e.target.value || 'all')}
                      style={{
                        border: '1px solid #c2dcd0',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    />
                    {payMonth !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setPayMonth('all')}
                        style={{
                          background: '#f0f4f2',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          color: '#4a7060',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        All Months
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSelectAllPending}
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        color: '#92400e',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                      title="Select all pending orders for batch payment"
                    >
                      Select All Pending ({orders.filter(o => o.paymentStatus !== 'Paid').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const mParam = payMonth !== 'all' ? `&month=${encodeURIComponent(payMonth)}` : '';
                        window.open(`/invoice?unpaid=true&dentistId=${encodeURIComponent(user.id || user._id)}${mParam}`, '_blank');
                      }}
                      style={{
                        background: '#1e5038',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Pending Bill
                    </button>
                  </div>

                  {filteredOrdersForMonth.length === 0 ? (
                    <div className="ddm-orders-empty">
                      {Ico.wallet ? Ico.wallet(32) : Ico.package(32)}
                      <p>No payment records for this period.</p>
                    </div>
                  ) : (
                    <div className="ddm-orders-list">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.78rem', color: '#4a7060', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={filteredOrdersForMonth.length > 0 && filteredOrdersForMonth.every(o => selectedPaymentIds.includes(o.paymentId || o._id || o.id))}
                          onChange={toggleSelectAllPayments}
                          style={{ cursor: 'pointer', accentColor: '#1e5038', width: '15px', height: '15px' }}
                        />
                        <span>Select All ({filteredOrdersForMonth.length})</span>
                      </div>
                      {filteredOrdersForMonth.map(order => {
                        const pId = order.paymentId || order._id || order.id;
                        const isSelected = selectedPaymentIds.includes(pId);
                        const isPaid = order.paymentStatus === 'Paid';
                        return (
                          <div
                            key={pId}
                            className="ddm-order-card"
                            style={{
                              background: isSelected ? '#edf5f0' : '#fff',
                              border: isSelected ? '1px solid #78937E' : '1px solid #eef2f0',
                              padding: '12px 14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectPayment(pId)}
                                  style={{ cursor: 'pointer', accentColor: '#1e5038', width: '16px', height: '16px' }}
                                />
                                <div>
                                  <span className="ddm-order-caseid">{order.caseId}</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a3028', marginLeft: '8px' }}>
                                    {order.patientName}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '0.95rem', color: isPaid ? '#15803d' : '#b45309' }}>
                                  {formatINR(getOrderPrice(order))}
                                </strong>
                                <StatusBadge status={order.paymentStatus || 'Pending'} size="sm" />
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f4f2', fontSize: '0.75rem', color: '#708c80', flexWrap: 'wrap', gap: '6px' }}>
                              <span>{order.serviceType || 'Standard'} · {fmt(order.createdAt)}</span>
                              {order.paymentMode && (
                                <span>Mode: {order.paymentMode} {order.referenceNumber ? `(#${order.referenceNumber})` : ''}</span>
                              )}
                              {order.batchId && (
                                <button
                                  type="button"
                                  onClick={() => window.open(`/invoice?batchId=${encodeURIComponent(order.batchId)}`, '_blank')}
                                  style={{
                                    background: '#1e5038',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  Batch Invoice
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Batch Settlement Bar */}
                  {selectedPaymentIds.length > 0 && (
                    <div style={{
                      position: 'sticky',
                      bottom: '8px',
                      zIndex: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      background: '#1a3028',
                      color: '#fff',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                      marginTop: '14px',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#25503b', color: '#a3bfb1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {selectedPaymentIds.length} selected
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Total: <strong>{formatINR(orders.filter(o => selectedPaymentIds.includes(o.paymentId || o._id || o.id)).reduce((s, o) => s + (Number(o.paymentAmount ?? o.amount) || 0), 0))}</strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentIds([])}
                          style={{ background: 'transparent', border: '1px solid #4a6a5a', color: '#c2d6cc', padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}
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
                          style={{ background: '#1e5038', border: '1px solid #708c80', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Settle {selectedPaymentIds.length} Orders
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Delete Dentist Account ────────────────────────────── */}
              <div className="ddm-danger-zone">
                <button
                  type="button"
                  className="ddm-delete-user-btn"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  {Ico.trash(14)} Delete Dentist Account
                </button>
              </div>
            </>
          )}
        </div>


        </div>
      </BaseModal>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          isAdmin={true}
          onDelete={async (id) => {
            try {
              const res = await authFetch(`${ADMIN_API}/orders/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (res.ok) {
                setOrders(prev => prev.filter(o => (o._id || o.id) !== id));
                showToast('Order deleted successfully.');
                setSelectedOrder(null);
              } else {
                showToast(data.message || 'Failed to delete order', 'error');
              }
            } catch {
              showToast('Network error', 'error');
            }
          }}
        />
      )}

      {/* Delete Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        title="Delete Order?"
        message={`Are you sure you want to delete order "${orderToDelete?.caseId}" for ${orderToDelete?.patientName || 'this patient'}? This action cannot be undone.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        type="danger"
        loading={deletingOrder}
        onConfirm={handleConfirmDeleteOrder}
        onCancel={() => setOrderToDelete(null)}
      />

      {/* Credit Limit Override Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(creditOverridePrompt)}
        title="Credit Limit Exceeded"
        message={`Dr. ${user?.name || 'this dentist'} has ₹${Number(creditOverridePrompt?.totalUnpaid || 0).toLocaleString('en-IN')} in outstanding dues, exceeding the ₹2,00,000 credit limit. As an administrator, do you wish to override the credit limit and place this order?`}
        confirmText="Override & Create Order"
        cancelText="Cancel"
        type="warning"
        loading={submitting}
        onConfirm={handleConfirmCreditOverride}
        onCancel={() => {
          setCreditOverridePrompt(null);
          showToast('Order placement cancelled due to credit limit.', 'info');
        }}
      />

      {/* Delete Dentist Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Dentist Account?"
        message={`Are you sure you want to permanently delete Dr. ${user?.name || 'this dentist'}? All associated lab orders and payments will be deleted. This cannot be undone.`}
        confirmText="Delete Dentist"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Record Batch Payment Modal */}
      <BaseModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        maxWidth="max-w-md"
        className="ad-pay-modal"
        id="ddm-batch-pay-modal"
      >
        <div className="ad-pay-modal-content" style={{ padding: '24px' }}>
          <div className="ad-pay-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a3028' }}>
              Batch Settle {selectedPaymentIds.length} Orders
            </h3>
            <button
              onClick={() => setBatchPayModalOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#708c80' }}
            >
              {Ico.x(16)}
            </button>
          </div>

          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Dentist:</span>
              <strong>Dr. {user?.name} {user?.clinicName ? `· ${user?.clinicName}` : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Batch Amount:</span>
              <strong style={{ color: '#1e5038', fontSize: '1rem' }}>
                {formatINR(orders.filter(o => selectedPaymentIds.includes(o.paymentId || o._id || o.id)).reduce((s, o) => s + (Number(o.paymentAmount ?? o.amount) || 0), 0))}
              </strong>
            </div>
          </div>

          {/* Status selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['Paid', 'Pending'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setBatchPayForm(f => ({ ...f, status: st }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #c2dcd0',
                  background: batchPayForm.status === st ? '#1e5038' : '#fff',
                  color: batchPayForm.status === st ? '#fff' : '#4a7060',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {batchPayForm.status === 'Paid' && (
            <>
              {/* Payment Mode Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a7060', display: 'block', marginBottom: '6px' }}>
                  Payment Mode
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['Cash', 'Cheque', 'UPI', 'Net Banking'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setBatchPayForm(f => ({ ...f, mode: m, referenceNumber: '' })); setBatchPayError(''); }}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: '1px solid #c2dcd0',
                        background: batchPayForm.mode === m ? '#e8f5ee' : '#fff',
                        color: batchPayForm.mode === m ? '#1e5038' : '#4a7060',
                        fontWeight: batchPayForm.mode === m ? 700 : 500,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {batchPayForm.mode !== 'Cash' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a7060', display: 'block', marginBottom: '4px' }}>
                    {batchPayForm.mode === 'Cheque' ? 'Cheque Number *' : (batchPayForm.mode === 'UPI' ? 'UPI UTR / Txn ID *' : 'Transaction Ref *')}
                  </label>
                  <input
                    type="text"
                    value={batchPayForm.referenceNumber}
                    onChange={e => setBatchPayForm(f => ({ ...f, referenceNumber: e.target.value }))}
                    placeholder={batchPayForm.mode === 'Cheque' ? 'e.g. CHQ-650124' : 'e.g. 428190382910'}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #c2dcd0',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a7060', display: 'block', marginBottom: '4px' }}>
              Notes / Remarks
            </label>
            <input
              type="text"
              value={batchPayForm.notes}
              onChange={e => setBatchPayForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Batch settlement clearance"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #c2dcd0',
                fontSize: '0.82rem',
              }}
            />
          </div>

          {batchPayError && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
              {batchPayError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setBatchPayModalOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #c2dcd0',
                background: '#fff',
                color: '#4a7060',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBatchRecordPayment}
              disabled={batchPaySaving}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#1e5038',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: batchPaySaving ? 'wait' : 'pointer',
              }}
            >
              {batchPaySaving ? 'Saving…' : `Confirm for ${selectedPaymentIds.length} Cases`}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Batch Statement Printable Invoice Modal */}
      {batchStatementModal && (
        <PrintableInvoice
          statement={batchStatementModal}
          onClose={() => setBatchStatementModal(null)}
        />
      )}
    </>
  );
};

export default DentistDetailModal;
