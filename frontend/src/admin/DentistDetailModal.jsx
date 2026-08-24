'use client';
/**
 * DentistDetailModal — shared modal used by both desktop and mobile admin dashboards.
 * Shows a dentist's profile, all associated lab orders, and an optional new-order form.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import './DentistDetailModal.css';

/* ─── Icon helper ─────────────────────────────────────────────────────────── */
const I = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const Ico = {
  x:        (s=16) => <I size={s} sw={2.2} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  check:    (s=14) => <I size={s} sw={2.5} d={<><polyline points="20 6 9 17 4 12"/></>} />,
  plus:     (s=15) => <I size={s} sw={2.2} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  user:     (s=18) => <I size={s} d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  mail:     (s=14) => <I size={s} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />,
  phone:    (s=14) => <I size={s} d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.15 9a2 2 0 012-2.18H8.1a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.91 14a16 16 0 006.29 6.29l1.35-1.35a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  map:      (s=14) => <I size={s} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>} />,
  calendar: (s=14) => <I size={s} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  clinic:   (s=14) => <I size={s} d={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />,
  package:  (s=32) => <I size={s} sw={1.2} d={<><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>} />,
};

/* ─── Constants ───────────────────────────────────────────────────────────── */
const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
const STAGE_LABELS = {
  received: 'Received', design: 'Design', production: 'Production',
  qc: 'QC', dispatched: 'Dispatched', completed: 'Completed',
};

const PRIORITY_CLS = { Low: 'ddm-p-low', Normal: 'ddm-p-normal', High: 'ddm-p-high', Urgent: 'ddm-p-urgent' };
const STATUS_CLS   = { pending: 'ddm-s-pending', approved: 'ddm-s-approved', rejected: 'ddm-s-rejected' };

const fmt    = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDue = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
  const { authFetch, ADMIN_API } = useAdminAuth();

  const [user, setUser]               = useState(null);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [stageLoading, setStageLoading] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const toastTimer                    = useRef(null);

  const [form, setForm] = useState({
    patientName: '', serviceType: 'Crown', priority: 'Normal', dueDate: '', notes: '',
  });

  /* ── Load dentist profile + orders ──────────────────────────────────────── */
  const authFetchRef = useRef(authFetch);
  useEffect(() => { authFetchRef.current = authFetch; }, [authFetch]);

  const load = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dentzy_admin_token') : null;
    if (!token || !userId) {
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
  }, [userId, ADMIN_API]);

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
                        {submitting ? <span className="ddm-btn-spinner" /> : <>{Ico.plus(13)} Create Order</>}
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
                            <span className={`ddm-priority-badge ${PRIORITY_CLS[order.priority] || ''}`}>{order.priority}</span>
                          </div>
                          <div className="ddm-order-patient">{order.patientName}</div>
                          <div className="ddm-order-meta-row">
                            <span className="ddm-order-service">{order.serviceType}</span>
                            {order.dueDate && (
                              <span className="ddm-order-due">{Ico.calendar(12)} Due: {fmtDue(order.dueDate)}</span>
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
    </div>
  );
};

export default DentistDetailModal;
