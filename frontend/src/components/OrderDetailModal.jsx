'use client';
import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';
import './OrderDetailModal.css';
import { Icons as Ico } from './common/DashboardIcons';

const STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];
const STAGE_LABELS = {
  received: 'Received', design: 'Design', production: 'Production',
  qc: 'QC', dispatched: 'Dispatched', completed: 'Completed',
};

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

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  isAdmin = false,
  onDelete = null,
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

  if (!isOpen || !order) return null;

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

  const dentistName = order.owner?.name || order.dentistName || '—';
  const clinicName = order.owner?.clinicName || order.clinicName || '';
  const dentistEmail = order.owner?.email || '';

  return (
    <>
      <div className="odm-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="odm-header">
            <div className="odm-case-wrap">
              <span className="odm-case-badge">{order.caseId || 'Order'}</span>
              <span className={`odm-status-badge odm-status--${(order.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
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
              <div className="odm-pay-row">
                <span>Billed Amount:</span>
                <strong>{order.amount > 0 ? formatINR(order.amount) : 'Pending Calculation'}</strong>
              </div>
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

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Lab Order?"
        message={`Are you sure you want to delete case "${order.caseId}" for patient "${order.patientName}"? This will permanently delete the order and any associated payment record.`}
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
