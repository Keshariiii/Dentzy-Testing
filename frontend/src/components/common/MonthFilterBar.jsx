'use client';
import React from 'react';
import { safeShowPicker } from '../../utils/appleCompat';
import useIsMobile from '../../hooks/useIsMobile';

/**
 * MonthFilterBar — Native month picker with Apple/Safari safeShowPicker() and 44px mobile touch targets.
 */
export default function MonthFilterBar({
  id = 'dz-month-filter',
  value = '',
  onChange,
  onClear,
  clearValue = '',
  clearLabel = 'All Months',
  label = 'Month:',
  placeholder = 'Select Month',
  extraActions = null,
  isMobile,
  className = '',
  style,
}) {
  const detectedMobile = useIsMobile();
  const mobile = isMobile !== undefined ? isMobile : Boolean(detectedMobile);
  const inputValue = value && value !== clearValue ? value : '';
  const hasSelection = Boolean(inputValue);
  const minH = mobile ? '44px' : '36px';

  const handleClear = () => {
    if (onClear) onClear();
    else onChange?.(clearValue);
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {label ? (
        <label
          htmlFor={id}
          style={{
            fontSize: mobile ? '0.82rem' : '0.8rem',
            fontWeight: 600,
            color: '#4a7060',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </label>
      ) : null}

      <input
        id={id}
        type="month"
        value={inputValue}
        placeholder={placeholder}
        aria-label={placeholder || 'Select Month'}
        data-empty={!hasSelection}
        onClick={safeShowPicker}
        onChange={(e) => onChange?.(e.target.value || clearValue)}
        style={{
          border: '1px solid var(--dz-color-border-strong, #c2dcd0)',
          borderRadius: '8px',
          padding: mobile ? '6px 10px' : '4px 10px',
          fontSize: mobile ? '0.84rem' : '0.8rem',
          fontWeight: 600,
          color: 'var(--dz-color-text-forest, #1a3028)',
          background: '#ffffff',
          cursor: 'pointer',
          minHeight: minH,
          boxSizing: 'border-box',
        }}
      />

      {hasSelection && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: '#f0f5f2',
            border: '1px solid #d4e3db',
            borderRadius: '8px',
            padding: mobile ? '8px 12px' : '5px 10px',
            fontSize: '0.78rem',
            color: '#4a7060',
            cursor: 'pointer',
            fontWeight: 600,
            minHeight: minH,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {clearLabel}
        </button>
      )}

      {extraActions}
    </div>
  );
}
