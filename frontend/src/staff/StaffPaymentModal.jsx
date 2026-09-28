import React, { useState } from 'react';
import { Icons as Ico } from '../components/common/DashboardIcons';

export default function StaffPaymentModal({ payment, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    status: payment.paymentStatus || payment.status || 'Pending',
    paymentMode: payment.paymentMode || '',
    referenceNumber: payment.referenceNumber || '',
  });

  return (
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal" onClick={e => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h3>Update Payment — {payment.caseId}</h3>
          <button className="sd-modal-close" onClick={onClose}>{Ico.x(16)}</button>
        </div>
        <div className="sd-modal-body">
          {/* Payment summary strip */}
          <div className="sd-modal-summary">
            <span><strong>Patient:</strong> {payment.patientName || 'Unknown'}</span>
            {payment.paymentAmount > 0 && (
              <span><strong>Amount:</strong> INR {payment.paymentAmount.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="sd-field">
            <label>Payment Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {['Pending', 'Paid', 'Overdue', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {form.status === 'Paid' && (
            <>
              <div className="sd-field">
                <label>Payment Mode</label>
                <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
                  {['', 'Cash', 'UPI', 'Cheque', 'Other'].map(m => (
                    <option key={m} value={m}>{m || 'Select...'}</option>
                  ))}
                </select>
              </div>
              <div className="sd-field">
                <label>Reference / Transaction Number</label>
                <input
                  type="text"
                  placeholder="UTR / Cheque No."
                  value={form.referenceNumber}
                  onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>
        <div className="sd-modal-actions">
          <button className="sd-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="sd-btn-primary" onClick={() => onSave(payment, form)} disabled={saving}>
            {saving ? 'Saving...' : 'Update Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
