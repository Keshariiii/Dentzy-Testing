import React from 'react';

/**
 * TwentyFirstIconButton — 21st.dev Micro-Interactive Icon Action Button
 *
 * Designed with Ponytail minimalism & Impeccable human craft:
 * - Zero text rendered inside (Icon Only)
 * - Dentzy Forest Green palette (#1e5038, #174230, #e8f5ee)
 * - 21st.dev subtle elevation box-shadows (no harsh or colored accent lines)
 * - Minimum 44px mobile touch targets (Rule 7 compliance)
 * - Micro-interaction feedback (spring hover lift, active press scale-down)
 * - Full accessibility (aria-label + native tooltip title)
 */
export const TwentyFirstIconButton = ({
  icon,
  children,
  onClick,
  title,
  ariaLabel,
  variant = 'secondary', // 'primary' | 'soft' | 'secondary' | 'ghost' | 'success' | 'danger'
  size = 'md',          // 'sm' (32px/desktop compact) | 'md' (40px) | 'lg' (44px mobile target)
  rounded = 'md',       // 'md' (10px) | 'lg' (14px) | 'full' (circle)
  disabled = false,
  loading = false,
  className = '',
  style = {},
  type = 'button',
  ...props
}) => {
  const accessibleLabel = ariaLabel || title || 'Action';

  // Size styling
  const sizeStyles = {
    sm: { width: '34px', height: '34px', minWidth: '34px', minHeight: '34px' },
    md: { width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' },
    lg: { width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' },
  }[size] || { width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' };

  // Radius styling
  const radiusMap = {
    sm: '8px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  };
  const borderRadius = radiusMap[rounded] || '10px';

  // Palette Variants
  const variantStyles = {
    primary: {
      background: '#78937E',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 2px 6px -1px rgba(120, 147, 126, 0.3), 0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    soft: {
      background: '#eff5f1',
      color: '#78937E',
      border: '1px solid rgba(120, 147, 126, 0.25)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    },
    secondary: {
      background: '#ffffff',
      color: '#374151',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
    },
    ghost: {
      background: 'transparent',
      color: '#4b5563',
      border: 'none',
      boxShadow: 'none',
    },
    success: {
      background: '#eff5f1',
      color: '#78937E',
      border: '1px solid #c6d8cb',
      boxShadow: '0 1px 3px rgba(120, 147, 126, 0.08)',
    },
    danger: {
      background: '#fbf3f3',
      color: '#7a3838',
      border: '1px solid #eddada',
      boxShadow: '0 1px 3px rgba(122, 56, 56, 0.08)',
    },
  }[variant] || {};

  const baseStyle = {
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
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  // Compute micro-interaction transformations on hover/active
  let computedTransform = 'none';
  let computedBoxShadow = baseStyle.boxShadow;

  if (!disabled && !loading) {
    if (isActive) {
      computedTransform = 'scale(0.95)';
    } else if (isHovered) {
      computedTransform = 'translateY(-1px)';
      if (variant === 'primary') {
        computedBoxShadow = '0 4px 12px -2px rgba(30, 80, 56, 0.4)';
      } else if (variant === 'secondary' || variant === 'soft') {
        computedBoxShadow = '0 3px 10px -2px rgba(0, 0, 0, 0.09)';
      }
    }
  }

  // Hover background override
  let hoverBg = baseStyle.background;
  if (isHovered && !disabled && !loading) {
    if (variant === 'primary') hoverBg = '#174230';
    else if (variant === 'soft') hoverBg = '#dcf2e5';
    else if (variant === 'secondary') hoverBg = '#f9fafb';
    else if (variant === 'ghost') hoverBg = '#f3f4f6';
    else if (variant === 'success') hoverBg = '#bbf7d0';
    else if (variant === 'danger') hoverBg = '#fecaca';
  }

  const activeStyle = {
    ...baseStyle,
    background: hoverBg,
    transform: computedTransform,
    boxShadow: computedBoxShadow,
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
      style={activeStyle}
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
