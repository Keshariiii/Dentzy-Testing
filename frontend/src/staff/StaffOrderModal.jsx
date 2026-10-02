import React, { useState } from 'react';
import BaseModal from '../components/ui/BaseModal';
import { Icons as Ico } from '../components/common/DashboardIcons';

const STAGES = [
  { key: 'received', label: 'Received' },
  { key: 'design', label: 'CAD Design' },
  { key: 'production', label: 'Milling' },
  { key: 'qc', label: 'QC' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'completed', label: 'Completed' },
];

export default function StaffOrderModal({ order, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    status: order.status || 'Pending',
    dueDate: order.dueDate || '',
    notes: order.notes || '',
    priority: order.priority || 'Normal',
    stage: order.stage || 'received',
  });

  return (
    <BaseModal
      isOpen={Boolean(order)}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="sd-modal-wrap"
      raw={true}
      id={`staff-order-${order.caseId}`}
    >
      <div className="sd-modal-content">
        <div className="sd-modal-header">
          <h3>Edit Order — {order.caseId}</h3>
          <button className="sd-modal-close" onClick={onClose} aria-label="Close">{Ico.x(16)}</button>
        </div>
        <div className="sd-modal-body">
          {/* Order summary strip */}
          <div className="sd-modal-summary">
            <span><strong>Patient:</strong> {order.patientName || 'Unknown'}</span>
            {order.owner?.name && <span><strong>Dentist:</strong> {order.owner.name}</span>}
          </div>
          <div className="sd-field-row">
            <div className="sd-field">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sd-field">
              <label>Stage</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="sd-field-row">
            <div className="sd-field">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="sd-field">
              <label>Due Date</label>
              <input
                type="date"
                value={(form.dueDate || '').slice(0, 10)}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="sd-field">
            <label>Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              placeholder="Internal notes about this order..."
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="sd-modal-actions">
          <button className="sd-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="sd-btn-primary" onClick={() => onSave(order, form)} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
