import React, { useState } from 'react';

/**
 * TwentyFirstIconButton — 21st.dev Micro-Interactive Icon Action Button
 * Theme-aware with full light & dark mode token support.
 */
export const TwentyFirstIconButton = ({
  icon,
  children,
  onClick,
  title,
  ariaLabel,
  variant = 'secondary', // 'primary' | 'soft' | 'secondary' | 'ghost' | 'success' | 'danger'
  size = 'md',          // 'sm' (34px) | 'md' (40px) | 'lg' (44px)
  rounded = 'md',       // 'md' (10px) | 'lg' (14px) | 'full' (circle)
  disabled = false,
  loading = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}) => {
  const accessibleLabel = ariaLabel || title || 'Action';

  const sizeStyles = {
    sm: { width: '34px', height: '34px', minWidth: '34px', minHeight: '34px' },
    md: { width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' },
    lg: { width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' },
  }[size] || { width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' };

  const radiusMap = {
    sm: '8px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  };
  const borderRadius = radiusMap[rounded] || '10px';

  const variantStyles = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--primary-foreground)',
      border: 'none',
      boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.16)',
    },
    soft: {
      background: 'var(--accent)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    },
    secondary: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--muted-foreground)',
      border: 'none',
      boxShadow: 'none',
    },
    success: {
      background: 'var(--dz-color-success-bg)',
      color: 'var(--dz-color-success-text)',
      border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(21, 128, 61, 0.08)',
    },
    danger: {
      background: 'var(--dz-color-error-bg)',
      color: 'var(--dz-color-error-text)',
      border: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
    },
  }[variant] || {};

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  let computedTransform = 'none';
  let computedBoxShadow = variantStyles.boxShadow || 'none';

  if (!disabled && !loading) {
    if (isActive) {
      computedTransform = 'scale(0.95)';
    } else if (isHovered) {
      computedTransform = 'translateY(-1px)';
      computedBoxShadow = '0 4px 12px -2px rgba(0, 0, 0, 0.14)';
    }
  }

  let hoverBg = variantStyles.background;
  if (isHovered && !disabled && !loading) {
    if (variant === 'primary') hoverBg = 'var(--dz-color-primary-dark, #5a6b5e)';
    else if (variant === 'soft') hoverBg = 'var(--muted)';
    else if (variant === 'secondary') hoverBg = 'var(--muted)';
    else if (variant === 'ghost') hoverBg = 'var(--muted)';
    else if (variant === 'success') hoverBg = 'var(--dz-color-success-bg)';
    else if (variant === 'danger') hoverBg = 'var(--dz-color-error-bg)';
  }

  const combinedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    borderRadius,
    transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
    outline: 'none',
    ...sizeStyles,
    ...variantStyles,
    background: hoverBg,
    transform: computedTransform,
    boxShadow: computedBoxShadow,
    ...style,
  };

  return (
    <button
      type={type}
      aria-label={accessibleLabel}
      title={title || accessibleLabel}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsActive(false); }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={`twentyfirst-icon-btn ${className}`}
      style={combinedStyle}
      {...props}
    >
      {loading ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-spin"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      ) : (
        icon || children
      )}
    </button>
  );
};

export default TwentyFirstIconButton;
