/**
 * Skeleton — Reusable skeleton loader components with shimmer wave animation.
 * Theme-aware: dynamically adapts between light and dark modes via CSS variables.
 */
import React from 'react';

const shimmerKeyframes = `
@keyframes dz-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}`;

const baseStyle = {
  background: 'linear-gradient(90deg, var(--muted, #e8e6e1) 25%, var(--border, #bfc9bb) 50%, var(--muted, #e8e6e1) 75%)',
  backgroundSize: '200% 100%',
  animation: 'dz-shimmer 1.8s ease-in-out infinite',
  borderRadius: '8px',
};

// ── Base Skeleton Block ─────────────────────────────────────────────────────
export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => (
  <div
    className={`skeleton-item ${className}`}
    style={{ ...baseStyle, width, height, borderRadius, ...style }}
  />
);

// ── Card Skeleton ─────────────────────────────────────────────────────────────
export const CardSkeleton = ({ style = {}, className = '' }) => (
  <div
    className={`card-skeleton ${className}`}
    style={{
      background: 'var(--card, #ffffff)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: 'var(--dz-shadow-sm, 0 1px 4px rgba(0,0,0,0.06))',
      border: '1px solid var(--border, #e8e6e1)',
      ...style,
    }}
  >
    <Skeleton width="40%" height="14px" style={{ marginBottom: '12px' }} />
    <Skeleton width="60%" height="24px" style={{ marginBottom: '8px' }} />
    <Skeleton width="80%" height="12px" />
  </div>
);

// ── Stat Card Skeleton (dashboard metrics) ───────────────────────────────────
export const StatCardSkeleton = ({ count = 4, className = '' }) => (
  <div
    className={`stat-card-skeleton-grid ${className}`}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`,
      gap: '12px',
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ── Order Row Skeleton ────────────────────────────────────────────────────────
export const OrderSkeleton = ({ count = 3, className = '' }) => (
  <div className={`order-skeleton-list ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: 'var(--card, #ffffff)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: 'var(--dz-shadow-xs, 0 1px 2px rgba(0,0,0,0.04))',
          border: '1px solid var(--border, #e8e6e1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="120px" height="14px" />
          <Skeleton width="70px" height="24px" borderRadius="20px" />
        </div>
        <Skeleton width="200px" height="12px" />
        <div style={{ display: 'flex', gap: '16px' }}>
          <Skeleton width="80px" height="12px" />
          <Skeleton width="100px" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

// ── Table Row Skeleton ────────────────────────────────────────────────────────
export const TableRowSkeleton = ({ columns = 5, rows = 5, className = '' }) => (
  <div className={`table-row-skeleton ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '12px',
          padding: '14px 16px',
          background: i === 0 ? 'var(--muted, #f8fafc)' : 'var(--card, #ffffff)',
          borderBottom: '1px solid var(--border, #e8e6e1)',
          borderRadius: i === 0 ? '10px 10px 0 0' : i === rows - 1 ? '0 0 10px 10px' : '0',
        }}
      >
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton
            key={j}
            width={j === 0 ? '80%' : '60%'}
            height="14px"
          />
        ))}
      </div>
    ))}
  </div>
);

// ── Form Skeleton (Auth, Settings, Modals) ──────────────────────────────────
export const FormSkeleton = ({ fields = 4, className = '' }) => (
  <div
    className={`form-skeleton ${className}`}
    style={{
      background: 'var(--card, #ffffff)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid var(--border, #e8e6e1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
    }}
  >
    <Skeleton width="50%" height="22px" style={{ marginBottom: '8px' }} />
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton width="30%" height="12px" />
        <Skeleton width="100%" height="42px" borderRadius="10px" />
      </div>
    ))}
    <Skeleton width="100%" height="44px" borderRadius="12px" style={{ marginTop: '8px' }} />
  </div>
);

// ── Detail Modal Skeleton ───────────────────────────────────────────────────
export const DetailModalSkeleton = ({ className = '' }) => (
  <div
    className={`detail-modal-skeleton ${className}`}
    style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="160px" height="20px" />
      <Skeleton width="80px" height="26px" borderRadius="20px" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
      <Skeleton width="100%" height="60px" borderRadius="10px" />
      <Skeleton width="100%" height="60px" borderRadius="10px" />
    </div>
    <Skeleton width="100%" height="120px" borderRadius="12px" />
    <Skeleton width="100%" height="40px" borderRadius="8px" />
  </div>
);

// ── Style injection (runs once) ─────────────────────────────────────────────
const StyleInjector = () => (
  <style dangerouslySetInnerHTML={{ __html: shimmerKeyframes }} />
);

// ── Wrapper that auto-injects keyframes ──────────────────────────────────────
export const SkeletonGroup = ({ children }) => (
  <>
    <StyleInjector />
    {children}
  </>
);

export default Skeleton;
