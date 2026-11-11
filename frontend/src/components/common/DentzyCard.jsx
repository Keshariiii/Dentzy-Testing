'use client';
import React from 'react';
import './DentzyCard.css';

/**
 * DentzyCaseChip — DESIGN.md compliant Case ID badge (App font + 0.04em tracking)
 */
export function DentzyCaseChip({ caseId, children, className = '', style }) {
  return (
    <span className={`dz-case-chip ${className}`.trim()} style={style}>
      {caseId || children || '—'}
    </span>
  );
}

/**
 * DentzyStatusPill — Separates Clinical Workflow Status from Financial Payment Status
 * @param {'workflow'|'payment'|'account'|'meta'} [type='workflow']
 */
export function DentzyStatusPill({ status, label, type = 'workflow', className = '', style }) {
  const raw = (status || '').toString().trim();
  const s = raw.toLowerCase();
  const display = label || raw || 'Pending';

  let variantClass = 'dz-pill--wf-pending';

  if (type === 'payment') {
    variantClass = s === 'paid' ? 'dz-pill--pay-paid' : 'dz-pill--pay-pending';
  } else if (type === 'account') {
    if (s === 'approved' || s === 'active') variantClass = 'dz-pill--wf-completed';
    else if (s === 'rejected') variantClass = 'dz-pill--wf-cancelled';
    else if (s === 'archived' || s === 'inactive') variantClass = 'dz-pill--wf-pending';
    else variantClass = 'dz-pill--pay-pending';
  } else if (type === 'clinic') {
    variantClass = 'dz-pill--clinic';
  } else if (type === 'orders') {
    variantClass = 'dz-pill--orders';
  } else {
    // workflow
    if (s === 'completed' || s === 'delivered' || s === 'qc') variantClass = 'dz-pill--wf-completed';
    else if (s === 'in progress' || s === 'in-progress' || s === 'design' || s === 'production' || s === 'dispatched') {
      variantClass = 'dz-pill--wf-in-progress';
    } else if (s === 'cancelled' || s === 'rejected') {
      variantClass = 'dz-pill--wf-cancelled';
    } else {
      variantClass = 'dz-pill--wf-pending';
    }
  }

  return (
    <span className={`dz-pill ${variantClass} ${className}`.trim()} style={style}>
      {display}
    </span>
  );
}

/**
 * DentzyCard — Universal Card Container with lowered shadow & -1px hover lift
 */
export function DentzyCard({
  children,
  onClick,
  interactive = Boolean(onClick),
  className = '',
  style,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`dz-common-card ${interactive ? 'dz-common-card--interactive' : ''} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * DentzyRowCard — Rebalanced Horizontal Entity Row Card (Dentists, Groups, Staff)
 */
export function DentzyRowCard({
  avatarText,
  avatarMuted = false,
  title,
  badge,
  subtitle,
  dateText,
  dateIcon,
  rightPills,
  actions,
  onClick,
  className = '',
  style,
}) {
  const initial = (avatarText || title || 'U').toString().trim().charAt(0).toUpperCase();

  return (
    <DentzyCard
      onClick={onClick}
      interactive={Boolean(onClick)}
      className={`dz-row-card ${className}`.trim()}
      style={style}
    >
      <div className="dz-row-card__left">
        <div className={`dz-row-card__avatar ${avatarMuted ? 'dz-row-card__avatar--muted' : ''}`.trim()}>
          {initial}
        </div>
        <div className="dz-row-card__info">
          <div className="dz-row-card__title-row">
            <span className="dz-row-card__title">{title}</span>
            {badge}
          </div>
          {subtitle && <div className="dz-row-card__sub">{subtitle}</div>}
          {dateText && (
            <div className="dz-row-card__date">
              {dateIcon}
              <span>{dateText}</span>
            </div>
          )}
        </div>
      </div>

      {(rightPills || actions) && (
        <div className="dz-row-card__right">
          {rightPills}
          {actions && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {actions}
            </div>
          )}
        </div>
      )}
    </DentzyCard>
  );
}

/**
 * DentzyKpiRow — 3-Metric Summary Header Strip for Drill-Downs & Overviews
 * @param {Array<{label: string, value: React.ReactNode, valueColor?: string}>} items
 */
export function DentzyKpiRow({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`dz-kpi-row ${className}`.trim()}>
      {items.map((item, idx) => (
        <div key={item.label || idx} className="dz-kpi-card">
          <span className="dz-kpi-card__label">{item.label}</span>
          <span className="dz-kpi-card__value" style={item.valueColor ? { color: item.valueColor } : undefined}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default DentzyCard;
