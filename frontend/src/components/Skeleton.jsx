/**
 * Skeleton — Reusable skeleton loader components with shimmer wave animation.
 *
 * Usage:
 *   import { Skeleton, CardSkeleton, OrderSkeleton, TableRowSkeleton } from '../components/Skeleton';
 *   {loading ? <OrderSkeleton count={3} /> : <OrderList ... />}
 */
import React from 'react';

// ── Shimmer wave keyframes ──────────────────────────────────────────────────

const shimmerKeyframes = `
@keyframes dz-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}`;

const baseStyle = {
  background: 'linear-gradient(90deg, #e8ede9 25%, #f0f5f2 37%, #e8ede9 63%)',
  backgroundSize: '200% 100%',
  animation: 'dz-shimmer 1.8s ease-in-out infinite',
  borderRadius: '8px',
};

// ── Base Skeleton Block ─────────────────────────────────────────────────────

export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  style = {},
}) => (
  <div style={{ ...baseStyle, width, height, borderRadius, ...style }} />
);

// ── Card Skeleton ─────────────────────────────────────────────────────────────

export const CardSkeleton = ({ style = {} }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #f0f2f1',
    ...style,
  }}>
    <Skeleton width="40%" height="14px" style={{ marginBottom: '12px' }} />
    <Skeleton width="60%" height="24px" style={{ marginBottom: '8px' }} />
    <Skeleton width="80%" height="12px" />
  </div>
);

// ── Stat Card Skeleton (dashboard metrics) ───────────────────────────────────

export const StatCardSkeleton = ({ count = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`, gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ── Order Row Skeleton ────────────────────────────────────────────────────────

export const OrderSkeleton = ({ count = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #f0f2f1',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
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

export const TableRowSkeleton = ({ columns = 5, rows = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '12px',
        padding: '14px 16px',
        background: i === 0 ? '#f8fafc' : '#fff',
        borderRadius: i === 0 ? '10px 10px 0 0' : i === rows - 1 ? '0 0 10px 10px' : '0',
      }}>
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
