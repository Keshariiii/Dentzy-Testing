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
import { formatINR, formatDate, formatDoctorName } from '../utils/format';
import { getOrderPrice } from '../utils/pricing';
import { openInvoiceWindow } from '../utils/appleCompat';
import PrintableInvoice from '../components/common/PrintableInvoice';
import { DentzyCaseChip, DentzyStatusPill } from '../components/common/DentzyCard';
import { DentzyDataTable, DentzyPipelineChart } from '../components/common/DentzyChartTable';
import EmptyState from '../components/common/EmptyState';
import MonthFilterBar from '../components/common/MonthFilterBar';
import {
  BatchFloatingBar,
  BatchPaymentModal,
  validateBatchPaymentForm,
} from '../components/common/BatchSettlementFlow';
import { DentistDetailSkeleton } from '../components/SkeletonBlocks';

/* ─── Constants ───────────────────────────────────────────────────────────── */
const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
const STAGE_LABELS = {
  received: 'Received', design: 'Design', production: 'Production',
  qc: 'QC', dispatched: 'Dispatched', completed: 'Completed',
};

const fmt = (d) => formatDate(d);

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
    const validationError = validateBatchPaymentForm(batchPayForm);
    if (validationError) {
      setBatchPayError(validationError);
      return;
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
                  {users.filter(u => u.status === 'approved' && !u.isArchived && !u.email?.includes('@dentzy.invalid')).map(u => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {formatDoctorName(u.name)} {u.clinicName ? `(${u.clinicName})` : ''}
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
            <DentistDetailSkeleton />
          ) : !user ? (
            <div className="ddm-error">Failed to load dentist profile.</div>
          ) : (
            <>
              {/* ── Profile ─────────────────────────────────────────────── */}
              <div className="ddm-profile">
                <div className="dz-avatar dz-avatar--lg">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
                <div className="ddm-profile-info">
                  <div className="ddm-profile-name-row">
                    <h2 className="ddm-profile-name">{formatDoctorName(user?.name, 'Dentist')}</h2>
                    <DentzyStatusPill
                      type="account"
                      status={(user?.isArchived || user?.status === 'archived') ? 'archived' : user?.status}
                      label={(user?.isArchived || user?.status === 'archived') ? (user?.archiveReason || 'Archived') : undefined}
                    />
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
                          onClick={() => openInvoiceWindow(`/invoice?unpaid=true&dentistId=${encodeURIComponent(user.id || user._id)}`)}
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
                          {Ico.orders(13, 2.2)}
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
                    <EmptyState compact variant="orders" message="No lab orders yet." />
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
                              <DentzyCaseChip caseId={order.caseId} />
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <DentzyStatusPill type="priority" status={order.priority || 'Normal'} />
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
                                    openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(order.batchId)}`);
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

                          <DentzyPipelineChart stage={order.stage} />

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
                (() => {
                  const totalSelectedAmount = orders
                    .filter((o) => selectedPaymentIds.includes(o.paymentId || o._id || o.id))
                    .reduce((s, o) => s + (Number(o.paymentAmount ?? o.amount) || 0), 0);

                  return (
                    <div className="ddm-section">
                      <MonthFilterBar
                        id="ddm-month-filter"
                        value={payMonth}
                        clearValue="all"
                        onChange={setPayMonth}
                        style={{ marginBottom: '10px' }}
                        extraActions={
                          <>
                            <button
                              type="button"
                              onClick={handleSelectAllPending}
                              style={{
                                background: '#fef3c7',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                color: '#92400e',
                                cursor: 'pointer',
                                fontWeight: 700,
                                minHeight: '36px',
                              }}
                              title="Select all pending orders for batch payment"
                            >
                              Select All Pending ({orders.filter((o) => o.paymentStatus !== 'Paid').length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const mParam = payMonth !== 'all' ? `&month=${encodeURIComponent(payMonth)}` : '';
                                openInvoiceWindow(`/invoice?unpaid=true&dentistId=${encodeURIComponent(user.id || user._id)}${mParam}`);
                              }}
                              style={{
                                background: '#1e5038',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                minHeight: '36px',
                              }}
                            >
                              {Ico.download(12)}
                              Download Pending Bill
                            </button>
                          </>
                        }
                      />

                      {filteredOrdersForMonth.length === 0 ? (
                        <EmptyState compact variant="payments" message="No payment records for this period." />
                      ) : (
                        <DentzyDataTable
                          selectable
                          selectedIds={selectedPaymentIds}
                          onToggleSelect={toggleSelectPayment}
                          onToggleSelectAll={toggleSelectAllPayments}
                          rowKey={(o) => o.paymentId || o._id || o.id}
                          data={filteredOrdersForMonth}
                          onRowClick={(o) => setSelectedOrder(o)}
                          columns={[
                            {
                              key: 'caseId',
                              header: 'Case ID',
                              render: (o) => <DentzyCaseChip caseId={o.caseId} />,
                            },
                            {
                              key: 'patientName',
                              header: 'Patient',
                              render: (o) => (
                                <div>
                                  <div style={{ fontWeight: 700, color: '#1a3028' }}>{o.patientName || '—'}</div>
                                  <div style={{ fontSize: '0.73rem', color: '#708c80' }}>
                                    {o.serviceType || 'Standard'} · {fmt(o.createdAt)}
                                  </div>
                                </div>
                              ),
                            },
                            {
                              key: 'amount',
                              header: 'Amount',
                              align: 'right',
                              render: (o) => (
                                <strong style={{ color: o.paymentStatus === 'Paid' ? '#15803d' : '#b45309' }}>
                                  {formatINR(getOrderPrice(o))}
                                </strong>
                              ),
                            },
                            {
                              key: 'paymentStatus',
                              header: 'Status',
                              render: (o) => <DentzyStatusPill type="payment" status={o.paymentStatus || 'Pending'} />,
                            },
                            {
                              key: 'modeBatch',
                              header: 'Mode & Batch',
                              render: (o) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {o.paymentMode ? (
                                    <DentzyStatusPill type="mode" status={o.paymentMode} />
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                                  )}
                                  {o.referenceNumber && (
                                    <span style={{ fontSize: '0.72rem', color: '#708c80' }}>#{o.referenceNumber}</span>
                                  )}
                                  {o.batchId && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(o.batchId)}`);
                                      }}
                                      style={{
                                        background: '#e8f5ee',
                                        color: '#1e5038',
                                        border: '1px solid #c2dcd0',
                                        borderRadius: '6px',
                                        padding: '2px 8px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Batch Invoice
                                    </button>
                                  )}
                                </div>
                              ),
                            },
                          ]}
                        />
                      )}

                      <BatchFloatingBar
                        count={selectedPaymentIds.length}
                        totalAmount={totalSelectedAmount}
                        onDeselect={() => setSelectedPaymentIds([])}
                        onSettle={() => {
                          setBatchPayForm({ mode: 'Cash', referenceNumber: '', notes: '', status: 'Paid' });
                          setBatchPayError('');
                          setBatchPayModalOpen(true);
                        }}
                        variant="sticky"
                      />
                    </div>
                  );
                })()
              )}

              {/* ── Delete Dentist Account (hidden if already archived) ── */}
              {!(user?.isArchived || user?.status === 'archived') && (
                <div className="ddm-danger-zone">
                  <button
                    type="button"
                    className="ddm-delete-user-btn"
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    {Ico.trash(14)} Delete Dentist Account
                  </button>
                </div>
              )}

              {/* ── Re-Approve archived dentist ── */}
              {(user?.isArchived || user?.status === 'archived') && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="ddm-stage-btn"
                    style={{ background: '#1e5038', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px -1px rgba(30, 80, 56, 0.3)' }}
                    onClick={async () => {
                      if (!confirm(`Re-approve "${user.name}"? They will need to use "Forgot Password" to log in again.`)) return;
                      setStageLoading('restore');
                      try {
                        const res = await authFetch(`${ADMIN_API}/users/${activeUserId}/restore`, { method: 'PATCH' });
                        const data = await res.json();
                        if (res.ok) { showToast(data.message || 'Dentist re-approved.'); load(); }
                        else showToast(data.message || 'Failed to re-approve', 'error');
                      } catch { showToast('Network error', 'error'); }
                      setStageLoading(null);
                    }}
                    disabled={stageLoading === 'restore'}
                  >
                    {Ico.refresh(14)} {stageLoading === 'restore' ? 'Restoring…' : 'Re-Approve This Dentist'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>This will restore the archived account. The dentist must reset their password to log in.</p>
                </div>
              )}
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
        message={`${formatDoctorName(user?.name, 'this dentist')} has ₹${Number(creditOverridePrompt?.totalUnpaid || 0).toLocaleString('en-IN')} in outstanding dues, exceeding the ₹2,00,000 credit limit. As an administrator, do you wish to override the credit limit and place this order?`}
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
        message={`Are you sure you want to permanently delete ${formatDoctorName(user?.name, 'this dentist')}? All associated lab orders and payments will be deleted. This cannot be undone.`}
        confirmText="Delete Dentist"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Record Batch Payment Modal */}
      <BatchPaymentModal
        isOpen={batchPayModalOpen}
        onClose={() => setBatchPayModalOpen(false)}
        selectedCount={selectedPaymentIds.length}
        totalAmount={orders
          .filter((o) => selectedPaymentIds.includes(o.paymentId || o._id || o.id))
          .reduce((s, o) => s + (Number(o.paymentAmount ?? o.amount) || 0), 0)}
        dentistName={user?.name || ''}
        clinicName={user?.clinicName || ''}
        form={batchPayForm}
        onFormChange={setBatchPayForm}
        onConfirm={handleBatchRecordPayment}
        saving={batchPaySaving}
        error={batchPayError}
        onClearError={() => setBatchPayError('')}
        id="ddm-batch-pay-modal"
      />

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
