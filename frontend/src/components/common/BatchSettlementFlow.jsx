'use client';
import React from 'react';
import BaseModal from '../ui/BaseModal';
import { Icons as Ico } from './DashboardIcons';
import { formatINR, formatDoctorName } from '../../utils/format';

export const BATCH_PAYMENT_MODES = ['Cash', 'Cheque', 'UPI', 'Net Banking'];

/**
 * Shared validation rule matching backend `updatePaymentStatusSchema`:
 * - Cheque: min 3 characters
 * - UPI / Net Banking / Bank Transfer: min 4 characters
 * Returns empty string when valid, or an error message string.
 */
export function validateBatchPaymentForm(form = {}) {
  const status = form.status || 'Paid';
  if (status !== 'Paid') return '';
  const mode = (form.mode ?? form.paymentMode ?? '').trim();
  const ref = (form.referenceNumber || '').trim();

  if (mode === 'Cheque' && ref.length < 3) {
    return 'Cheque number is required (min 3 characters).';
  }
  if ((mode === 'UPI' || mode === 'Net Banking' || mode === 'Bank Transfer') && ref.length < 4) {
    return mode === 'UPI'
      ? 'UPI transaction / UTR number is required (min 4 characters).'
      : 'Transaction / UTR number is required (min 4 characters).';
  }
  return '';
}

/**
 * PaymentModeToggle — Shared Dentzy segmented mode selector used by BatchPaymentModal & StaffPaymentModal.
 */
export function PaymentModeToggle({
  value = 'Cash',
  onChange,
  modes = BATCH_PAYMENT_MODES,
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {modes.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange?.(m)}
            style={{
              flex: '1 1 auto',
              minWidth: '68px',
              minHeight: '44px',
              padding: '8px 6px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: active ? '#1e5038' : '#c2dcd0',
              background: active ? '#e8f5ee' : '#ffffff',
              color: active ? '#1e5038' : '#4a7060',
              fontWeight: active ? 700 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/**
 * BatchFloatingBar — Sticky or fixed multi-select settlement summary bar.
 */
export function BatchFloatingBar({
  count = 0,
  totalAmount = 0,
  onDeselect,
  onSettle,
  settleLabel,
  variant = 'sticky',
  isMobile = false,
  className = '',
  style,
}) {
  if (!count || count <= 0) return null;

  const isFixed = variant === 'fixed';
  const minBtnH = isMobile || isFixed ? '44px' : '38px';

  const containerStyle = isFixed
    ? {
        position: 'fixed',
        bottom: '76px',
        left: '12px',
        right: '12px',
        maxWidth: '800px',
        margin: '0 auto',
        zIndex: 60,
      }
    : {
        position: 'sticky',
        bottom: '12px',
        zIndex: 20,
        marginTop: '14px',
      };

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '10px 14px' : '12px 18px',
        borderRadius: '14px',
        background: '#1a3028',
        color: '#ffffff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        gap: '10px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
        <span
          style={{
            background: '#25503b',
            color: '#a3bfb1',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}
        >
          {count} {count === 1 ? 'order' : 'orders'} selected
        </span>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2ece6' }}>
          Total:{' '}
          <strong style={{ color: '#ffffff', fontSize: '1rem' }}>
            {formatINR(totalAmount)}
          </strong>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onDeselect}
          style={{
            background: 'transparent',
            border: '1px solid #4a6a5a',
            color: '#c2d6cc',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: minBtnH,
          }}
        >
          Deselect
        </button>
        <button
          type="button"
          onClick={onSettle}
          style={{
            background: '#1e5038',
            border: '1px solid #708c80',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: minBtnH,
          }}
        >
          {Ico.creditCard(14)}
          <span>{settleLabel || `Settle ${count} ${count === 1 ? 'Order' : 'Orders'}`}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * BatchPaymentModal — Shared batch payment settlement dialog across Admin, Mobile Admin, DentistDetailModal, and Receptionist.
 */
export function BatchPaymentModal({
  isOpen,
  onClose,
  selectedCount = 0,
  totalAmount = 0,
  dentistName = '',
  clinicName = '',
  form = {},
  onFormChange,
  onConfirm,
  saving = false,
  error = '',
  onClearError,
  modes = BATCH_PAYMENT_MODES,
  id = 'dz-batch-pay-modal',
}) {
  const status = form.status || 'Paid';
  const activeMode = form.mode ?? form.paymentMode ?? 'Cash';

  const updateForm = (patch) => {
    onClearError?.();
    onFormChange?.((prev) => ({ ...(prev || form), ...patch }));
  };

  const formattedDentist = dentistName ? formatDoctorName(dentistName) : '';
  const subtitle = formattedDentist
    ? `${formattedDentist}${clinicName ? ` · ${clinicName}` : ''}`
    : undefined;

  const refLabel =
    activeMode === 'Cheque'
      ? 'Cheque Number *'
      : activeMode === 'UPI'
      ? 'UPI Transaction ID / UTR *'
      : 'Transaction Reference *';

  const refPlaceholder =
    activeMode === 'Cheque' ? 'e.g. CHQ-650124' : 'e.g. 428190382910';

  return (
    <BaseModal
      isOpen={Boolean(isOpen)}
      onClose={onClose}
      title={`Settle Batch Payment (${selectedCount} ${selectedCount === 1 ? 'Order' : 'Orders'})`}
      subtitle={subtitle}
      maxWidth="max-w-md"
      id={id}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #c2dcd0',
              background: '#ffffff',
              color: '#4a7060',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#1e5038',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              minHeight: '44px',
            }}
          >
            {saving ? 'Saving...' : `Confirm (${selectedCount})`}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
        <div
          style={{
            background: '#f8faf9',
            border: '1px solid #e2ece6',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#4a7060' }}>Selected Cases:</span>
            <strong style={{ color: '#1a3028' }}>{selectedCount}</strong>
          </div>
          {formattedDentist && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#4a7060' }}>Dentist:</span>
              <strong style={{ color: '#1a3028', textAlign: 'right' }}>{subtitle}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#4a7060' }}>Total Batch Amount:</span>
            <strong style={{ color: '#1e5038', fontSize: '1rem' }}>
              {formatINR(totalAmount)}
            </strong>
          </div>
        </div>

        {/* Payment status toggle */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: '#f0f7f3',
            padding: '4px',
            borderRadius: '10px',
          }}
        >
          {[
            { key: 'Paid', label: 'Mark as Paid' },
            { key: 'Pending', label: 'Mark as Pending' },
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => updateForm({ status: st.key })}
              style={{
                flex: 1,
                padding: '8px 12px',
                minHeight: '44px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: status === st.key ? '#1e5038' : 'transparent',
                color: status === st.key ? '#ffffff' : '#4a7060',
                transition: 'all 0.15s ease',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {status === 'Paid' && (
          <>
            <div>
              <label
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#4a7060',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Payment Mode
              </label>
              <PaymentModeToggle
                value={activeMode}
                modes={modes}
                onChange={(m) =>
                  updateForm({ mode: m, paymentMode: m, referenceNumber: '' })
                }
              />
            </div>

            {activeMode !== 'Cash' && (
              <div>
                <label
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#4a7060',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {refLabel}
                </label>
                <input
                  type="text"
                  value={form.referenceNumber || ''}
                  onChange={(e) => updateForm({ referenceNumber: e.target.value })}
                  placeholder={refPlaceholder}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #c2dcd0',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </>
        )}

        <div>
          <label
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#4a7060',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Notes / Remarks (optional)
          </label>
          <input
            type="text"
            value={form.notes || ''}
            onChange={(e) => updateForm({ notes: e.target.value })}
            placeholder="e.g. Batch settlement clearance"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #c2dcd0',
              fontSize: '0.84rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
