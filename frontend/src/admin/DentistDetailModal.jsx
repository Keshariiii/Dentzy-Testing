'use client';
/**
 * DentistDetailModal — shared modal used by both desktop and mobile admin dashboards.
 * Shows a dentist's profile, all associated lab orders, and an optional new-order form.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import './DentistDetailModal.css';
import ConfirmDialog from '../components/ConfirmDialog';

import { Icons as Ico } from '../components/common/DashboardIcons';

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
const DentistDetailModal = ({ userId, onClose }) => {
  const { authFetch, ADMIN_API, admin } = useAdminAuth();

  const [user, setUser]               = useState(null);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stageLoading, setStageLoading] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const toastTimer                    = useRef(null);

  const [form, setForm] = useState({
    patientName: '', serviceType: 'Crown', priority: 'Normal', dueDate: '', notes: '',
  });

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

  /* ── Close on Escape ─────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Toast helper ────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
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
          prev.map(o => o._id === orderId
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
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) { showToast('Patient name is required', 'error'); return; }
    setSubmitting(true);
    try {
      const res  = await authFetch(`${ADMIN_API}/orders`, {
        method: 'POST',
        body: JSON.stringify({ ...form, dentistId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => [data.order, ...prev]);
        setForm({ patientName: '', serviceType: 'Crown', priority: 'Normal', dueDate: '', notes: '' });
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
    setConfirmConfig({
      title: 'Delete Order',
      message: `Are you sure you want to delete order ${caseId}? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          const res = await authFetch(`${ADMIN_API}/orders/${orderId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            setOrders(prev => prev.filter(o => o._id !== orderId));
            showToast('Order deleted successfully.');
          } else {
            showToast(data.message || 'Failed to delete order', 'error');
          }
        } catch { showToast('Network error', 'error'); }
        setConfirmConfig(null);
      },
      onCancel: () => setConfirmConfig(null)
    });
  };
  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="ddm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ddm-panel" onClick={e => e.stopPropagation()}>

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
                    <button className="ddm-new-order-btn" onClick={() => setShowForm(v => !v)}>
                      {showForm ? Ico.x(13) : Ico.plus(13)}
                      {showForm ? 'Cancel' : 'New Order'}
                    </button>
                  )}
                </div>

                {/* New order form */}
                {showForm && (
                  <form className="ddm-order-form" onSubmit={handleSubmitOrder}>
                    <div className="ddm-form-row">
                      <div className="ddm-form-field">
                        <label className="ddm-form-label">Patient Name *</label>
                        <input className="ddm-form-input"
                          value={form.patientName}
                          onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                          placeholder="Enter patient name" required />
                      </div>
                      <div className="ddm-form-field">
                        <label className="ddm-form-label">Service Type</label>
                        <select className="ddm-form-select"
                          value={form.serviceType}
                          onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                          {['Crown','Bridge','Denture','Implant','Veneer','Retainer','Other'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="ddm-form-row">
                      <div className="ddm-form-field">
                        <label className="ddm-form-label">Priority</label>
                        <select className="ddm-form-select"
                          value={form.priority}
                          onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                          {['Low','Normal','High','Urgent'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div className="ddm-form-field">
                        <label className="ddm-form-label">Due Date</label>
                        <input type="date" className="ddm-form-input"
                          value={form.dueDate}
                          onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="ddm-form-field ddm-form-field--full">
                      <label className="ddm-form-label">Notes</label>
                      <textarea className="ddm-form-textarea"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Optional notes…" rows={3} />
                    </div>
                    <div className="ddm-form-actions">
                      <button type="button" className="ddm-form-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                      <button type="submit" className="ddm-form-submit" disabled={submitting}>
                        {submitting ? <span className="ddm-btn-spinner" /> : <>Create Order</>}
                      </button>
                    </div>
                  </form>
                )}

                {/* Orders list */}
                {orders.length === 0 ? (
                  <div className="ddm-orders-empty">
                    {Ico.package(32)}
                    <p>No lab orders yet.</p>
                  </div>
                ) : (
                  <div className="ddm-orders-list">
                    {orders.map(order => (
                      <div key={order._id} className="ddm-order-card">
                        <div className="ddm-order-top">
                          <div className="ddm-order-id-row">
                            <span className="ddm-order-caseid">{order.caseId}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className={`ddm-priority-badge ddm-p-${order.priority?.toLowerCase()}`}>{order.priority}</span>
                              <button 
                                className="ddm-close" 
                                style={{ position: 'relative', top: 'auto', right: 'auto', padding: '2px', background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                                onClick={() => handleDeleteOrder(order._id, order.caseId)}
                                title="Delete Order"
                              >
                                {Ico.trash(14)}
                              </button>
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
                            disabled={stageLoading === order._id}
                            onChange={e => handleStageChange(order._id, e.target.value)}>
                            {STAGES.map(s => (
                              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                            ))}
                          </select>
                          {stageLoading === order._id && <span className="ddm-btn-spinner ddm-spinner-sm" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`ddm-toast ${toast.type === 'error' ? 'ddm-toast--error' : 'ddm-toast--success'}`}>
            {toast.type === 'error' ? Ico.x(13) : Ico.check(13)}
            <span>{toast.msg}</span>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmConfig}
        {...confirmConfig}
      />
    </div>
  );
};

export default DentistDetailModal;
