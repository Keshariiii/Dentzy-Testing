'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './DashboardIcons';
import { formatINR } from '../../utils/format';

/**
 * InlineAmountEditor — Shared inline ₹ amount viewer & editor for OrderDetailModal and PaymentDetailModal.
 */
export default function InlineAmountEditor({
  amount = 0,
  displayAmount,
  onSave,
  saving: externalSaving,
  canEdit = false,
  variant = 'compact',
  addLabel = 'Add Amount',
  editLabel = 'Edit',
  placeholder = 'e.g. 4500',
  onEditingChange,
  className = '',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [internalSaving, setInternalSaving] = useState(false);
  const [error, setError] = useState('');
  const onEditingChangeRef = useRef(onEditingChange);
  onEditingChangeRef.current = onEditingChange;

  const isSaving = externalSaving !== undefined ? externalSaving : internalSaving;
  const shownAmount = displayAmount !== undefined ? displayAmount : amount;
  const isCard = variant === 'card';

  useEffect(() => {
    setIsEditing(false);
    setError('');
    onEditingChangeRef.current?.(false);
  }, [amount]);

  const startEditing = () => {
    const seed = isCard ? (amount > 0 ? String(amount) : '') : String(shownAmount || 0);
    setInputVal(seed);
    setError('');
    setIsEditing(true);
    onEditingChange?.(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
    onEditingChange?.(false);
  };

  const handleSave = async () => {
    const val = Number(inputVal);
    if (inputVal === '' || Number.isNaN(val) || val < 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setInternalSaving(true);
    setError('');
    try {
      await onSave?.(val);
      setIsEditing(false);
      onEditingChange?.(false);
    } catch (err) {
      setError(err?.message || 'Failed to update amount.');
    } finally {
      setInternalSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      cancelEditing();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCard ? 'space-between' : 'flex-end',
          gap: '10px',
        }}
      >
        <strong
          style={{
            fontSize: isCard ? '1.65rem' : '0.95rem',
            fontWeight: isCard ? 800 : 700,
            color: 'var(--dz-color-charcoal, #1e2824)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {shownAmount > 0 ? formatINR(shownAmount) : '₹0'}
        </strong>

        {canEdit && (
          <button
            type="button"
            onClick={startEditing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: isCard ? '0.78rem' : '0.72rem',
              fontWeight: 600,
              padding: isCard ? '6px 12px' : '4px 9px',
              minHeight: isCard ? '36px' : '30px',
              borderRadius: isCard ? '8px' : '6px',
              cursor: 'pointer',
              border: '1px solid',
              borderColor:
                isCard && Number(amount) <= 0 ? '#1e5038' : '#c2dcd0',
              background:
                isCard && Number(amount) <= 0 ? '#1e5038' : '#f8faf9',
              color:
                isCard && Number(amount) <= 0 ? '#ffffff' : '#1e5038',
            }}
          >
            {isCard &&
              (Number(amount) > 0
                ? Icons.edit(13, 2)
                : Icons.plus(13, 'currentColor', 2.4))}
            <span>{isCard && Number(amount) <= 0 ? addLabel : editLabel}</span>
          </button>
        )}
      </div>
    );
  }

  if (isCard) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '4px',
          paddingTop: '10px',
          borderTop: '1px solid var(--dz-color-border-mint, #e2ece6)',
        }}
      >
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a7060' }}>
          Set Payment Amount
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #c2dcd0',
            borderRadius: '10px',
            padding: '2px 10px',
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#708c80', marginRight: '6px' }}>
            ₹
          </span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder={placeholder}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              border: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--dz-color-charcoal, #1e2824)',
              padding: '8px 0',
              outline: 'none',
            }}
          />
        </div>
        {error && (
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>{error}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            style={{
              background: '#f1f5f9',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              minHeight: '38px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || inputVal === ''}
            style={{
              background: '#1e5038',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: isSaving || inputVal === '' ? 'not-allowed' : 'pointer',
              opacity: isSaving || inputVal === '' ? 0.65 : 1,
              minHeight: '38px',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Amount'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 700, color: '#4a6a5a' }}>₹</span>
        <input
          type="number"
          min="0"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '96px',
            padding: '5px 8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: '1px solid #1e5038',
            borderRadius: '6px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || inputVal === ''}
          style={{
            background: '#1e5038',
            color: '#ffffff',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: isSaving || inputVal === '' ? 'not-allowed' : 'pointer',
            opacity: isSaving || inputVal === '' ? 0.65 : 1,
          }}
        >
          {isSaving ? '...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={cancelEditing}
          disabled={isSaving}
          style={{
            background: '#f1f5f9',
            color: '#475569',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
      {error && <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>{error}</div>}
    </div>
  );
}
