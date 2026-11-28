'use client';
import React, { useState, useEffect } from 'react';
import BaseModal from '../components/ui/BaseModal';
import { Icons as Ico } from '../components/common/DashboardIcons';
import {
  PaymentModeToggle,
  validateBatchPaymentForm,
} from '../components/common/BatchSettlementFlow';
import { formatINR } from '../utils/format';

const STAFF_PAYMENT_MODES = ['Cash', 'UPI', 'Cheque', 'Other'];

export default function StaffPaymentModal({ payment, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    status: payment?.paymentStatus || payment?.status || 'Pending',
    paymentMode: payment?.paymentMode || 'Cash',
    referenceNumber: payment?.referenceNumber || '',
    amount: payment?.paymentAmount ?? payment?.amount ?? '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setForm({
        status: payment.paymentStatus || payment.status || 'Pending',
        paymentMode: payment.paymentMode || 'Cash',
        referenceNumber: payment.referenceNumber || '',
        amount: payment.paymentAmount ?? payment.amount ?? '',
      });
      setError('');
    }
  }, [payment]);

  if (!payment) return null;

  const handleSaveClick = () => {
    setError('');
    if (form.amount !== '' && (Number.isNaN(Number(form.amount)) || Number(form.amount) < 0)) {
      setError('Please enter a valid positive amount.');
      return;
    }
    const modeErr = validateBatchPaymentForm({
      status: form.status,
      mode: form.paymentMode,
      referenceNumber: form.referenceNumber,
    });
    if (modeErr) {
      setError(modeErr);
      return;
    }
    onSave(payment, form);
  };

  const activeMode = form.paymentMode || 'Cash';
  const refLabel =
    activeMode === 'Cheque'
      ? 'Cheque Number *'
      : activeMode === 'UPI'
      ? 'UPI Transaction ID / UTR *'
      : 'Reference / Transaction Number';

  return (
    <BaseModal
      isOpen={Boolean(payment)}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="sd-modal-wrap"
      raw={true}
      id={`staff-pay-${payment.caseId}`}
    >
      <div className="sd-modal-content">
        <div className="sd-modal-header">
          <h3>Update Payment — {payment.caseId}</h3>
          <button
            type="button"
            className="sd-modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            {Ico.x(16)}
          </button>
        </div>

        <div className="sd-modal-body">
          {/* Payment summary strip */}
          <div className="sd-modal-summary">
            <span>
              <strong>Patient:</strong> {payment.patientName || 'Unknown'}
            </span>
            {Number(payment.paymentAmount ?? payment.amount) > 0 && (
              <span>
                <strong>Current Amount:</strong>{' '}
                {formatINR(Number(payment.paymentAmount ?? payment.amount))}
              </span>
            )}
          </div>

          <div className="sd-field">
            <label htmlFor="sp-amount">Amount (₹)</label>
            <input
              id="sp-amount"
              type="number"
              min="0"
              placeholder="e.g. 1500"
              value={form.amount}
              onChange={(e) => {
                setForm((f) => ({ ...f, amount: e.target.value }));
                setError('');
              }}
              style={{ minHeight: '44px' }}
            />
          </div>

          <div className="sd-field">
            <label htmlFor="sp-status">Payment Status</label>
            <select
              id="sp-status"
              value={form.status}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setForm((f) => ({
                  ...f,
                  status: nextStatus,
                  paymentMode: nextStatus === 'Paid' ? f.paymentMode || 'Cash' : f.paymentMode,
                }));
                setError('');
              }}
              style={{ minHeight: '44px' }}
            >
              {['Pending', 'Paid', 'Overdue', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {form.status === 'Paid' && (
            <>
              <div className="sd-field">
                <label>Payment Mode</label>
                <PaymentModeToggle
                  value={activeMode}
                  modes={STAFF_PAYMENT_MODES}
                  onChange={(m) => {
                    setForm((f) => ({ ...f, paymentMode: m, referenceNumber: '' }));
                    setError('');
                  }}
                />
              </div>

              {activeMode !== 'Cash' && (
                <div className="sd-field">
                  <label htmlFor="sp-ref">{refLabel}</label>
                  <input
                    id="sp-ref"
                    type="text"
                    placeholder={activeMode === 'Cheque' ? 'e.g. CHQ-650124' : 'UTR / Reference No.'}
                    value={form.referenceNumber}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, referenceNumber: e.target.value }));
                      setError('');
                    }}
                    style={{ minHeight: '44px' }}
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="sd-form-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="sd-modal-actions">
          <button
            type="button"
            className="sd-btn-secondary"
            onClick={onClose}
            style={{ minHeight: '44px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sd-btn-primary"
            onClick={handleSaveClick}
            disabled={saving}
            style={{ minHeight: '44px' }}
          >
            {saving ? 'Saving...' : 'Update Payment'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
