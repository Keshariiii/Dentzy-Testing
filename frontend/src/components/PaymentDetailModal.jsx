'use client';
import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import './PaymentDetailModal.css';
import { Icons as Ico } from './common/DashboardIcons';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function PaymentDetailModal({
  payment,
  isOpen,
  onClose,
  isAdmin = false,
  onDelete = null,
  onRecordPayment = null,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !showConfirmDelete) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmDelete, onClose]);

  if (!isOpen || !payment) return null;

  const paymentId = payment._id || payment.id;
  const isPaid = (payment.paymentStatus || payment.status) === 'Paid';
  const dentistName = payment.owner?.name || payment.dentistName || '—';
  const clinicName = payment.owner?.clinicName || payment.clinicName || '';

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(paymentId);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Delete payment error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="pdm-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="pdm-modal" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="pdm-header">
            <div className="pdm-badge-wrap">
              <span className="pdm-case-badge">{payment.caseId || 'Payment'}</span>
              {payment.invoiceNumber && (
                <span className="pdm-inv-badge">{payment.invoiceNumber}</span>
              )}
            </div>
            <button className="pdm-close-btn" onClick={onClose} aria-label="Close modal">
              {Ico.x(16)}
            </button>
          </div>

          {/* Amount Card */}
          <div className="pdm-amount-card">
            <div className="pdm-amount-top">
              <span className="pdm-amount-lbl">Payment Amount</span>
              <span className={`pdm-status-pill ${isPaid ? 'pdm-status--paid' : 'pdm-status--pending'}`}>
                {isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="pdm-amount-val">
              {payment.amount > 0 ? formatINR(payment.amount) : '₹0'}
            </div>
          </div>

          {/* Patient & Clinic Details */}
          <div className="pdm-section">
            <h2 className="pdm-patient-name">{payment.patientName || 'Patient'}</h2>
            <p className="pdm-clinic-sub">
              <span>{dentistName}</span>
              {clinicName && <span> · {clinicName}</span>}
            </p>
          </div>

          {/* Payment Method & Transaction Breakdown */}
          <div className="pdm-grid">
            <div className="pdm-grid-item">
              <span className="pdm-grid-label">Payment Mode</span>
              <span className="pdm-grid-value">
                {payment.paymentMode ? (
                  <span className={`pdm-mode-pill pdm-mode--${payment.paymentMode.toLowerCase()}`}>
                    {payment.paymentMode}
                  </span>
                ) : (
                  <span className="pdm-text-muted">Pending Mode</span>
                )}
              </span>
            </div>

            <div className="pdm-grid-item">
              <span className="pdm-grid-label">
                {payment.paymentMode === 'Cheque' ? 'Cheque Number' : payment.paymentMode === 'UPI' ? 'UPI UTR / Ref' : 'Reference'}
              </span>
              <span className="pdm-grid-value">
                {payment.referenceNumber ? (
                  <code>{payment.referenceNumber}</code>
                ) : (
                  <span className="pdm-text-muted">—</span>
                )}
              </span>
            </div>

            <div className="pdm-grid-item">
              <span className="pdm-grid-label">Payment Date</span>
              <span className="pdm-grid-value">
                {formatDate(payment.paidAt || (isPaid ? payment.updatedAt : null))}
              </span>
            </div>

            <div className="pdm-grid-item">
              <span className="pdm-grid-label">Invoice / Due Date</span>
              <span className="pdm-grid-value">
                {formatDate(payment.dueDate || payment.createdAt)}
              </span>
            </div>
          </div>

          {/* Description or Notes */}
          {(payment.description || payment.notes) && (
            <div className="pdm-notes-box">
              <span className="pdm-notes-label">Payment Notes</span>
              <p className="pdm-notes-text">{payment.description || payment.notes}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pdm-footer">
            {isAdmin && onDelete && (
              <button
                type="button"
                className="pdm-delete-btn"
                onClick={() => setShowConfirmDelete(true)}
              >
                {Ico.trash(14)} Delete Payment
              </button>
            )}

            <div className="pdm-footer-right">
              {isAdmin && !isPaid && onRecordPayment && (
                <button
                  type="button"
                  className="pdm-record-btn"
                  onClick={() => {
                    onClose();
                    onRecordPayment(payment);
                  }}
                >
                  {Ico.check(14)} Record Payment
                </button>
              )}
              <button type="button" className="pdm-close-footer-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Payment Record?"
        message={`Are you sure you want to delete this payment record for case "${payment.caseId}"? This action cannot be undone.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}
