import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { formatINR, formatDate } from '../utils/format';
import './PaymentDetailModal.css';
import { Icons as Ico } from './common/DashboardIcons';



export default function PaymentDetailModal({
  payment,
  onClose,
  isAdmin = false,
  onDelete = null,
  onRecordPayment = null,
  onUpdateAmount = null,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Amount inline editor state
  const [currentAmount, setCurrentAmount] = useState(payment?.amount || 0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [savingAmount, setSavingAmount] = useState(false);
  const [amountError, setAmountError] = useState('');


  useEffect(() => {
    if (payment) {
      setCurrentAmount(payment.amount || 0);
      setIsEditingAmount(false);
      setAmountError('');
    }
  }, [payment]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showConfirmDelete && !isEditingAmount) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDelete, isEditingAmount, onClose]);

  if (!payment) return null;

  const paymentId = payment._id || payment.id || payment.caseId;
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

  const handleSaveAmount = async () => {
    const val = Number(amountInput);
    if (isNaN(val) || val < 0) {
      setAmountError('Please enter a valid positive amount.');
      return;
    }
    setSavingAmount(true);
    setAmountError('');
    try {
      if (onUpdateAmount) {
        await onUpdateAmount(payment, val);
      }
      setCurrentAmount(val);
      setIsEditingAmount(false);
    } catch (err) {
      setAmountError(err.message || 'Failed to update amount.');
    } finally {
      setSavingAmount(false);
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

          {/* Amount Card & Add/Edit Amount Section */}
          <div className="pdm-amount-card">
            <div className="pdm-amount-top">
              <span className="pdm-amount-lbl">Payment Amount</span>
              <span className={`pdm-status-pill ${isPaid ? 'pdm-status--paid' : 'pdm-status--pending'}`}>
                {isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>

            {isEditingAmount ? (
              <div className="pdm-amount-edit-wrap">
                <label className="pdm-amount-input-label">Set Payment Amount</label>
                <div className="pdm-amount-input-box">
                  <span className="pdm-currency-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 4500"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setAmountError('');
                    }}
                    className="pdm-amount-input"
                    autoFocus
                  />
                </div>
                {amountError && <div className="pdm-amount-error-msg">{amountError}</div>}
                <div className="pdm-amount-edit-btns">
                  <button
                    type="button"
                    className="pdm-amount-btn-cancel"
                    onClick={() => {
                      setIsEditingAmount(false);
                      setAmountError('');
                    }}
                    disabled={savingAmount}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="pdm-amount-btn-save"
                    onClick={handleSaveAmount}
                    disabled={savingAmount || amountInput === ''}
                  >
                    {savingAmount ? 'Saving…' : 'Save Amount'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pdm-amount-display-row">
                <div className="pdm-amount-val">
                  {currentAmount > 0 ? formatINR(currentAmount) : '₹0'}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className={`pdm-amount-edit-trigger ${currentAmount > 0 ? 'pdm-amount-trigger--edit' : 'pdm-amount-trigger--add'}`}
                    onClick={() => {
                      setAmountInput(currentAmount > 0 ? String(currentAmount) : '');
                      setIsEditingAmount(true);
                      setAmountError('');
                    }}
                  >
                    {currentAmount > 0 ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Edit Amount
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        + Add Amount
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

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
                    onRecordPayment({ ...payment, amount: currentAmount });
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
