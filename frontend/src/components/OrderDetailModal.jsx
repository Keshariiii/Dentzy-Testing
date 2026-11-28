import React, { useState, useEffect, useRef } from 'react';
import BaseModal from './ui/BaseModal';
import ConfirmDialog from './ConfirmDialog';
import { formatINR, formatDate, formatDoctorName } from '../utils/format';
import { openInvoiceWindow } from '../utils/appleCompat';
import { DentzyStatusPill } from './common/DentzyCard';
import { DentzyPipelineChart } from './common/DentzyChartTable';
import InlineAmountEditor from './common/InlineAmountEditor';
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

// Rate card fallback pricing helper
const getFallbackAmount = (ord) => {
  if (!ord) return 750;
  const rates = { Crown: 750, Bridge: 750, Denture: 1500, Implant: 1800, Veneer: 1800, Retainer: 1200, Other: 500 };
  const sType = ord.restoration_type || ord.serviceType || ord.service_category || 'Other';
  const matched = Object.keys(rates).find(k => k.toLowerCase() === sType.toLowerCase()) || 'Other';
  const base = rates[matched] || 500;
  let units = 1;
  const raw = ord.teeth_data ?? ord.teethData ?? ord.teeth;
  if (Array.isArray(raw)) {
    units = raw.length > 0 ? raw.length : 1;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) units = p.length;
    } catch {}
  }
  return base * units;
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

  useEffect(() => {
    if (order) {
      setCurrentAmount(order.amount || 0);
      setIsEditingAmount(false);
    }
  }, [order]);

  if (!displayOrder && !order) return null;

  const orderId = displayOrder._id || displayOrder.id;

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

  const dentistName = formatDoctorName(displayOrder.owner?.name || displayOrder.dentistName, '—');
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
              <DentzyStatusPill type="workflow" status={displayOrder.status || 'Pending'} />
            </div>
            <button className="odm-close-btn" onClick={onClose} aria-label="Close modal">
              {Ico.x(16)}
            </button>
          </div>

          <div className="odm-body">
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
            <DentzyPipelineChart
              stage={displayOrder.stage}
              completed={displayOrder.status === 'Completed'}
              stages={STAGES.map((s) => ({ key: s, label: STAGE_LABELS[s] }))}
            />
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
                <DentzyStatusPill
                  type="priority"
                  status={displayOrder.priority || 'Normal'}
                  icon={(displayOrder.priority || 'normal').toLowerCase() === 'high' || (displayOrder.priority || 'normal').toLowerCase() === 'rush' || (displayOrder.priority || 'normal').toLowerCase() === 'urgent'
                    ? Ico.bolt(12)
                    : Ico.dot(10)}
                />
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
              <DentzyStatusPill type="payment" status={displayOrder.paymentStatus || 'Pending'} />
            </div>
            <div className="odm-payment-body">
              <div className="odm-pay-row odm-pay-row--amount">
                <span>Billed Amount:</span>
                <InlineAmountEditor
                  amount={currentAmount}
                  displayAmount={currentAmount > 0 ? currentAmount : getFallbackAmount(displayOrder)}
                  canEdit={Boolean(isAdmin && onUpdateAmount)}
                  onSave={async (val) => {
                    if (onUpdateAmount) await onUpdateAmount(displayOrder, val);
                    setCurrentAmount(val);
                  }}
                  variant="compact"
                  editLabel="Edit"
                  onEditingChange={setIsEditingAmount}
                />
              </div>
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
                          onClick={() => openInvoiceWindow(`/invoice?batchId=${encodeURIComponent(displayOrder.batchId)}`)}
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
                          {Ico.download(12)}
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
