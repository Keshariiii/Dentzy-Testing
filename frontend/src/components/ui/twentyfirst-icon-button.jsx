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
      background: '#163E2B',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 1px 3px rgba(22, 62, 43, 0.2)',
    },
    soft: {
      background: '#F0F5F2',
      color: '#163E2B',
      border: '1px solid #D5E2DC',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    },
    secondary: {
      background: '#ffffff',
      color: '#374151',
      border: '1px solid #E2ECE6',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    },
    ghost: {
      background: 'transparent',
      color: '#4B5563',
      border: 'none',
      boxShadow: 'none',
    },
    success: {
      background: '#ECFDF3',
      color: '#067647',
      border: '1px solid #ABEFC6',
      boxShadow: '0 1px 2px rgba(6, 118, 71, 0.06)',
    },
    danger: {
      background: '#FEF3F2',
      color: '#B42318',
      border: '1px solid #FECDCA',
      boxShadow: '0 1px 2px rgba(180, 35, 24, 0.06)',
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
    if (variant === 'primary') hoverBg = '#0F2C1E';
    else if (variant === 'soft') hoverBg = '#E2ECE6';
    else if (variant === 'secondary') hoverBg = '#F8FAFC';
    else if (variant === 'ghost') hoverBg = '#F0F5F2';
    else if (variant === 'success') hoverBg = '#D1FADF';
    else if (variant === 'danger') hoverBg = '#FEE4E2';
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
