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

import { Icons as Ico } from '../components/common/DashboardIcons';
import { useToast } from '../context/ToastContext';
import CreateOrderModal from '../components/common/CreateOrderModal';
import TwentyFirstIconButton from '../components/ui/twentyfirst-icon-button';

/* ─── Constants ───────────────────────────────────────────────────────────── */
const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
const STAGE_LABELS = {
  received: 'Received', design: 'Design', production: 'Production',
  qc: 'QC', dispatched: 'Dispatched', completed: 'Completed',
};


const STATUS_CLS   = { pending: 'ddm-s-pending', approved: 'ddm-s-approved', rejected: 'ddm-s-rejected' };

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
const DentistDetailModal = ({ userId, onClose, onDeleteUser }) => {
  const { authFetch, ADMIN_API, admin } = useAdminAuth();

  const [user, setUser]               = useState(null);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stageLoading, setStageLoading] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const { showToast } = useToast();



  /* ── Load dentist profile + orders ──────────────────────────────────────── */
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const load = useCallback(async () => {
    if (!admin || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await authFetchRef.current(`${ADMIN_API}/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrders(data.orders || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId, ADMIN_API, admin]);

  useEffect(() => { load(); }, [load]);




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
        showToast('Order created successfully.');
      } else {
        showToast(data.message || 'Failed to create order', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSubmitting(false);
  };
  /* ── Delete order ─────────────────────────────────────────────────────── */
  const handleDeleteOrder = async (orderId, caseId) => {
    if (!window.confirm(`Are you sure you want to delete order ${caseId}? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${ADMIN_API}/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.filter(o => (o._id || o.id) !== orderId));
        showToast('Order deleted successfully.');
      } else {
        showToast(data.message || 'Failed to delete order', 'error');
      }
    } catch { showToast('Network error', 'error'); }
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
          <span className="ddm-header-title">Dentist Details</span>
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
                    <span className={`ddm-status-badge ${STATUS_CLS[user?.status] || ''}`}>{user?.status}</span>
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

              {/* ── Orders section ───────────────────────────────────────── */}
              <div className="ddm-section">
                <div className="ddm-section-header">
                  <span className="ddm-section-title">Lab Orders ({orders.length})</span>
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
                      <div key={oId} className="ddm-order-card">
                        <div className="ddm-order-top">
                          <div className="ddm-order-id-row">
                            <span className="ddm-order-caseid">{order.caseId}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className={`ddm-priority-badge ddm-p-${order.priority?.toLowerCase()}`}>{order.priority}</span>
                              <TwentyFirstIconButton
                                icon={Ico.trash(14)}
                                title="Delete Order"
                                ariaLabel="Delete Order"
                                onClick={() => handleDeleteOrder(oId, order.caseId)}
                                size="sm"
                                variant="danger"
                              />
                            </div>
                          </div>
                          <div className="ddm-order-patient">{order.patientName}</div>
                          <div className="ddm-order-meta-row">
                            <span className="ddm-order-service">{order.serviceType}</span>
                            {order.dueDate && (
                              <span className="ddm-order-due">{Ico.calendar(12)} Due: {fmt(order.dueDate)}</span>
                            )}
                          </div>
                        </div>

                        <PipelineBar stage={order.stage} />

                        <div className="ddm-order-stage-row">
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
    </>
  );
};

export default DentistDetailModal;
