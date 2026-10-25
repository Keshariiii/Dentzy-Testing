import React, { useState, useEffect, useRef } from 'react';
import BaseModal from './ui/BaseModal';
import ConfirmDialog from './ConfirmDialog';
import { formatINR, formatDate } from '../utils/format';
import { StatusBadge } from './ui/status-badge';
import './OrderDetailModal.css';
import { Icons as Ico } from './common/DashboardIcons';
import { PIPELINE_STAGES } from './dashboard/shared/constants';

/* #64 — Use shared pipeline stages instead of local duplicates */
const STAGES = PIPELINE_STAGES.filter(s => s !== 'completed');
const STAGE_LABELS = {
  received: 'Received',
  design: 'CAD/CAM',
  production: 'Milling',
  qc: 'QC Check',
  dispatched: 'Dispatch',
};

export default function OrderDetailModal({
  order,
  onClose,
  isAdmin = false,
  onDelete = null,
  onUpdateAmount = null,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Keep last order in ref so exit animation has data to render
  const lastOrderRef = useRef(order);
  if (order) {
    lastOrderRef.current = order;
  }
  const displayOrder = order || lastOrderRef.current;

  // Amount inline edit state
  const [currentAmount, setCurrentAmount] = useState(displayOrder?.amount || 0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [savingAmount, setSavingAmount] = useState(false);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (order) {
      setCurrentAmount(order.amount || 0);
      setIsEditingAmount(false);
      setAmountError('');
    }
  }, [order]);

  if (!displayOrder && !order) return null;

  const orderId = displayOrder._id || displayOrder.id;
  const currentStage = (displayOrder.stage || 'received').toLowerCase();
  const stageIdx = STAGES.indexOf(currentStage);

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(orderId);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Delete order error:', err);
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
        await onUpdateAmount(displayOrder, val);
      }
      setCurrentAmount(val);
      setIsEditingAmount(false);
    } catch (err) {
      setAmountError(err.message || 'Failed to update amount.');
    } finally {
      setSavingAmount(false);
    }
  };

  const dentistName = displayOrder.owner?.name || displayOrder.dentistName || '—';
  const clinicName = displayOrder.owner?.clinicName || displayOrder.clinicName || '';
  const dentistEmail = displayOrder.owner?.email || displayOrder.dentistEmail || '';

  return (
    <>
      <BaseModal
        isOpen={Boolean(order)}
        onClose={onClose}
        maxWidth="max-w-2xl"
        className="odm-modal-wrap"
        closeOnEscape={!showConfirmDelete && !isEditingAmount}
        raw={true}
        id={`order-${orderId}`}
      >
        <div className="odm-modal-content">
          {/* Header */}
          <div className="odm-header">
            <div className="odm-case-badge-wrap">
              <span className="odm-case-badge">{displayOrder.caseId || 'Order Details'}</span>
              <StatusBadge status={displayOrder.status || 'Pending'} size="sm" />
            </div>
            <button className="odm-close-btn" onClick={onClose} aria-label="Close modal">
              {Ico.x(16)}
            </button>
          </div>

          {/* Title / Patient */}
          <div className="odm-title-section">
            <h2 className="odm-patient-name">{displayOrder.patientName || 'Unnamed Patient'}</h2>
            <p className="odm-dentist-sub">
              <span>{dentistName}</span>
              {clinicName && <span> · {clinicName}</span>}
              {dentistEmail && <span className="odm-email"> ({dentistEmail})</span>}
            </p>
          </div>

          {/* Pipeline Progress Track */}
          <div className="odm-pipeline-card">
            <div className="odm-pipeline-title">Production Stage</div>
            <div className="odm-pipeline">
              {STAGES.map((s, idx) => (
                <React.Fragment key={s}>
                  <div className={`odm-pipeline-step ${idx <= stageIdx ? 'odm-pipeline-step--done' : ''} ${idx === stageIdx ? 'odm-pipeline-step--current' : ''}`}>
                    <div className="odm-pipeline-dot" />
                    <span className="odm-pipeline-label">{STAGE_LABELS[s]}</span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`odm-pipeline-line ${idx < stageIdx ? 'odm-pipeline-line--done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="odm-grid">
            <div className="odm-grid-item">
              <span className="odm-grid-label">Service Type</span>
              <span className="odm-grid-value">{displayOrder.serviceType || 'Standard'}</span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Priority</span>
              <span className="odm-grid-value">
                <span className={`odm-priority-pill odm-priority--${(displayOrder.priority || 'normal').toLowerCase()}`}>
                  {(displayOrder.priority || 'normal').toLowerCase() === 'high' || (displayOrder.priority || 'normal').toLowerCase() === 'rush' || (displayOrder.priority || 'normal').toLowerCase() === 'urgent'
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:'3px',verticalAlign:'middle'}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:'3px',verticalAlign:'middle'}}><circle cx="12" cy="12" r="6"/></svg>}
                  {displayOrder.priority || 'Normal'}
                </span>
              </span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Created At</span>
              <span className="odm-grid-value">{formatDate(displayOrder.createdAt)}</span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Target Due Date</span>
              <span className="odm-grid-value">{formatDate(displayOrder.dueDate)}</span>
            </div>
          </div>

          {/* Clinical Notes */}
          {displayOrder.notes && (
            <div className="odm-notes-box">
              <span className="odm-notes-label">Clinical Instructions & Notes</span>
              <p className="odm-notes-text">{displayOrder.notes}</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="odm-payment-card">
            <div className="odm-payment-header">
              <span className="odm-payment-title">Payment Information</span>
              <span className={`odm-pay-pill odm-pay--${(displayOrder.paymentStatus || 'pending').toLowerCase()}`}>
                {displayOrder.paymentStatus || 'Pending'}
              </span>
            </div>
            <div className="odm-payment-body">
              <div className="odm-pay-row odm-pay-row--amount">
                <span>Billed Amount:</span>
                {isEditingAmount ? (
                  <div className="odm-amount-edit-wrap">
                    <span className="odm-currency-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={amountInput}
                      onChange={e => { setAmountInput(e.target.value); setAmountError(''); }}
                      placeholder="e.g. 5000"
                      className="odm-amount-input"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveAmount}
                      disabled={savingAmount || amountInput === ''}
                      className="odm-amount-btn-save"
                    >
                      {savingAmount ? '…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditingAmount(false); setAmountError(''); }}
                      disabled={savingAmount}
                      className="odm-amount-btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="odm-amount-display-row">
                    <strong>{currentAmount > 0 ? formatINR(currentAmount) : 'Pending Calculation'}</strong>
                    {isAdmin && onUpdateAmount && (
                      <button
                        type="button"
                        className={`odm-amount-edit-trigger ${currentAmount > 0 ? 'odm-amount-trigger--edit' : 'odm-amount-trigger--add'}`}
                        onClick={() => {
                          setAmountInput(currentAmount > 0 ? String(currentAmount) : '');
                          setIsEditingAmount(true);
                        }}
                      >
                        {currentAmount > 0 ? 'Edit' : '+ Add Amount'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {amountError && (
                <div className="odm-amount-error-msg">{amountError}</div>
              )}
              {displayOrder.paymentStatus === 'Paid' && (
                <>
                  <div className="odm-pay-row">
                    <span>Payment Mode:</span>
                    <span className="odm-pay-mode-val">{displayOrder.paymentMode || 'Direct'}</span>
                  </div>
                  {displayOrder.referenceNumber && (
                    <div className="odm-pay-row">
                      <span>Ref / Transaction ID:</span>
                      <code>{displayOrder.referenceNumber}</code>
                    </div>
                  )}
                  {displayOrder.paidAt && (
                    <div className="odm-pay-row">
                      <span>Payment Verified:</span>
                      <span>{formatDate(displayOrder.paidAt)}</span>
                    </div>
                  )}
                  {displayOrder.batchId && (
                    <div className="odm-pay-row" style={{ alignItems: 'center' }}>
                      <span>Batch Settlement:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <code>{displayOrder.batchId}</code>
                        <button
                          type="button"
                          onClick={() => window.open(`/invoice?batchId=${encodeURIComponent(displayOrder.batchId)}`, '_blank')}
                          style={{
                            background: '#1e5038',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download Batch Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {(displayOrder.paymentStatus || 'Pending').toLowerCase() === 'pending' && currentAmount > 0 && (
              <div className="odm-pending-banner">
                Payment Pending — {formatINR(currentAmount)} due
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="odm-footer">
            {isAdmin && onDelete && (
              displayOrder.paymentStatus === 'Paid' ? (
                <span
                  title="Cannot delete an order that has already been paid. Revert payment to Pending first."
                  style={{
                    fontSize: '0.76rem',
                    color: '#708c80',
                    padding: '8px 12px',
                    background: '#edf5f0',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  Paid Order (Protected)
                </span>
              ) : (
                <button
                  type="button"
                  className="odm-delete-btn"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  {Ico.trash(14)} Delete Order
                </button>
              )
            )}
            <button type="button" className="odm-close-footer-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Order?"
        message={`Are you sure you want to delete order "${displayOrder.caseId}" for ${displayOrder.patientName || 'this patient'}? This will also remove any linked payment records. This action cannot be undone.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}
