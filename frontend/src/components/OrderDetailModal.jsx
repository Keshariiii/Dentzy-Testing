import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { formatINR, formatDate } from '../utils/format';
import './OrderDetailModal.css';
import { Icons as Ico } from './common/DashboardIcons';

const STAGES = ['received', 'cad_cam', 'casting', 'finishing', 'qc', 'ready'];
const STAGE_LABELS = {
  received: 'Received',
  cad_cam: 'CAD/CAM',
  casting: 'Casting',
  finishing: 'Finishing',
  qc: 'QC Check',
  ready: 'Ready for Dispatch',
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

  // Amount inline edit state
  const [currentAmount, setCurrentAmount] = useState(order?.amount || 0);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showConfirmDelete && !isEditingAmount) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmDelete, isEditingAmount, onClose]);

  if (!order) return null;

  const orderId = order._id || order.id;
  const currentStage = (order.stage || 'received').toLowerCase();
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
        await onUpdateAmount(order, val);
      }
      setCurrentAmount(val);
      setIsEditingAmount(false);
    } catch (err) {
      setAmountError(err.message || 'Failed to update amount.');
    } finally {
      setSavingAmount(false);
    }
  };

  const dentistName = order.owner?.name || order.dentistName || '—';
  const clinicName = order.owner?.clinicName || order.clinicName || '';
  const dentistEmail = order.owner?.email || order.dentistEmail || '';

  return (
    <>
      <div className="odm-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="odm-header">
            <div className="odm-case-badge-wrap">
              <span className="odm-case-badge">{order.caseId || 'Order Details'}</span>
              <span className={`odm-status-pill odm-status--${(order.status || 'pending').toLowerCase()}`}>
                {order.status || 'Pending'}
              </span>
            </div>
            <button className="odm-close-btn" onClick={onClose} aria-label="Close modal">
              {Ico.x(16)}
            </button>
          </div>

          {/* Title / Patient */}
          <div className="odm-title-section">
            <h2 className="odm-patient-name">{order.patientName || 'Unnamed Patient'}</h2>
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
              <span className="odm-grid-value">{order.serviceType || 'Standard'}</span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Priority</span>
              <span className="odm-grid-value">
                <span className={`odm-priority-pill odm-priority--${(order.priority || 'normal').toLowerCase()}`}>
                  {order.priority || 'Normal'}
                </span>
              </span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Created At</span>
              <span className="odm-grid-value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="odm-grid-item">
              <span className="odm-grid-label">Target Due Date</span>
              <span className="odm-grid-value">{formatDate(order.dueDate)}</span>
            </div>
          </div>

          {/* Clinical Notes */}
          {order.notes && (
            <div className="odm-notes-box">
              <span className="odm-notes-label">Clinical Instructions & Notes</span>
              <p className="odm-notes-text">{order.notes}</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="odm-payment-card">
            <div className="odm-payment-header">
              <span className="odm-payment-title">Payment Information</span>
              <span className={`odm-pay-pill odm-pay--${(order.paymentStatus || 'pending').toLowerCase()}`}>
                {order.paymentStatus || 'Pending'}
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
              {order.paymentStatus === 'Paid' && (
                <>
                  <div className="odm-pay-row">
                    <span>Payment Mode:</span>
                    <span className="odm-pay-mode-val">{order.paymentMode || 'Direct'}</span>
                  </div>
                  {order.referenceNumber && (
                    <div className="odm-pay-row">
                      <span>Ref / Transaction ID:</span>
                      <code>{order.referenceNumber}</code>
                    </div>
                  )}
                  {order.paidAt && (
                    <div className="odm-pay-row">
                      <span>Payment Verified:</span>
                      <span>{formatDate(order.paidAt)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="odm-footer">
            {isAdmin && onDelete && (
              <button
                type="button"
                className="odm-delete-btn"
                onClick={() => setShowConfirmDelete(true)}
              >
                {Ico.trash(14)} Delete Order
              </button>
            )}
            <button type="button" className="odm-close-footer-btn" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Order?"
        message={`Are you sure you want to delete order "${order.caseId}" for ${order.patientName || 'this patient'}? This will also remove any linked payment records. This action cannot be undone.`}
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
