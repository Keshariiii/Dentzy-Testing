'use client';
import React from 'react';

const VARIANT_BG = {
  success: '#16a34a',
  primary: '#1e5038',
  danger: '#dc2626',
};

/**
 * ToggleSwitch — Accessible pill switch with 44px minimum touch target height.
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  variant = 'success',
  size = 'md',
  id,
  className = '',
  style,
}) {
  const isLg = size === 'lg';
  const trackW = isLg ? 54 : 48;
  const trackH = isLg ? 30 : 26;
  const thumbSize = isLg ? 24 : 20;
  const thumbOffset = 3;
  const activeBg = VARIANT_BG[variant] || VARIANT_BG.success;

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel || label || 'Toggle'}
      title={label || ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange?.(!checked);
      }}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: `${trackW}px`,
        minHeight: '44px',
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        flexShrink: 0,
        touchAction: 'manipulation',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'inline-block',
          width: `${trackW}px`,
          height: `${trackH}px`,
          borderRadius: `${trackH / 2}px`,
          background: checked ? activeBg : '#cbd5e1',
          transition: 'background 0.2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: `${thumbOffset}px`,
            left: checked ? `${trackW - thumbSize - thumbOffset}px` : `${thumbOffset}px`,
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            transition: 'left 0.2s ease',
          }}
        />
      </span>
    </button>
  );
}
