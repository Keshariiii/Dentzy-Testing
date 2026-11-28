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
 * @param {'workflow'|'payment'|'account'|'priority'|'mode'|'clinic'|'orders'|'notice'} [type='workflow']
 */
export function DentzyStatusPill({
  status,
  label,
  type = 'workflow',
  pulse = false,
  icon = null,
  size = 'sm',
  className = '',
  style,
  children,
}) {
  const raw = (status || (typeof children === 'string' ? children : '')).toString().trim();
  const s = raw.toLowerCase();
  const display = label || children || raw || 'Pending';

  let variantClass = 'dz-pill--wf-pending';

  if (type === 'payment') {
    variantClass = s === 'paid' ? 'dz-pill--pay-paid' : 'dz-pill--pay-pending';
  } else if (type === 'account') {
    if (s === 'approved' || s === 'active') variantClass = 'dz-pill--wf-completed';
    else if (s === 'rejected') variantClass = 'dz-pill--wf-cancelled';
    else if (s === 'archived' || s === 'inactive') variantClass = 'dz-pill--wf-pending';
    else variantClass = 'dz-pill--pay-pending';
  } else if (type === 'priority') {
    if (s === 'rush' || s === 'urgent') variantClass = 'dz-pill--priority-urgent';
    else if (s === 'high') variantClass = 'dz-pill--priority-high';
    else variantClass = 'dz-pill--priority-normal';
  } else if (type === 'mode') {
    if (s === 'cash') variantClass = 'dz-pill--mode-cash';
    else if (s === 'cheque') variantClass = 'dz-pill--mode-cheque';
    else variantClass = 'dz-pill--mode-upi';
  } else if (type === 'notice') {
    variantClass = 'dz-pill--notice';
  } else if (type === 'clinic') {
    variantClass = 'dz-pill--clinic';
  } else if (type === 'orders') {
    variantClass = 'dz-pill--orders';
  } else {
    // workflow
    if (s === 'completed' || s === 'delivered' || s === 'qc' || s === 'success' || s === 'approved' || s === 'active') {
      variantClass = 'dz-pill--wf-completed';
    } else if (['in progress', 'in-progress', 'design', 'production', 'dispatched', 'processing', 'manufacturing', 'packaging'].includes(s)) {
      variantClass = 'dz-pill--wf-in-progress';
    } else if (s === 'cancelled' || s === 'rejected' || s === 'failed' || s === 'overdue' || s === 'blocked') {
      variantClass = 'dz-pill--wf-cancelled';
    } else {
      variantClass = 'dz-pill--wf-pending';
    }
  }

  const shouldPulse = pulse || (type === 'workflow' && variantClass === 'dz-pill--wf-in-progress');
  const sizeClass = size === 'md' || size === 'lg' ? 'dz-pill--md' : '';

  return (
    <span className={`dz-pill ${variantClass} ${sizeClass} ${className}`.trim()} style={style}>
      {shouldPulse && <span className="dz-pulse-dot" aria-hidden="true" style={{ width: 6, height: 6, background: 'currentColor' }} />}
      {icon}
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
 * DentzyKpiRow — Shared Metric Summary & Dashboard Stat Card Strip
 * Supports plain KPI drill-downs as well as interactive dashboard stat cards (with icons, tones, tags).
 */
export function DentzyKpiRow({ items = [], className = '', style }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`dz-kpi-row ${className}`.trim()} style={style}>
      {items.map((item, idx) => {
        const interactive = Boolean(item.onClick);
        const toneClass = item.tone ? `dz-kpi-card--${item.tone}` : '';
        return (
          <div
            key={item.key || item.label || idx}
            className={`dz-kpi-card ${interactive ? 'dz-kpi-card--clickable' : ''} ${toneClass}`.trim()}
            onClick={item.onClick}
            title={item.title}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick(e);
                    }
                  }
                : undefined
            }
          >
            <div className="dz-kpi-card__top">
              <div className="dz-kpi-card__main">
                <span className="dz-kpi-card__label">{item.label}</span>
                <span className="dz-kpi-card__value" style={item.valueColor ? { color: item.valueColor } : undefined}>
                  {item.value}
                </span>
                {item.hint && <span className="dz-kpi-card__hint">{item.hint}</span>}
              </div>
              {item.icon && <div className="dz-kpi-card__icon">{item.icon}</div>}
            </div>
            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="dz-kpi-card__tags">
                {item.tags.map((t, tIdx) => (
                  <DentzyStatusPill
                    key={t.label || tIdx}
                    type={t.type || 'workflow'}
                    status={t.status || t.label}
                    label={t.label}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DentzyCard;
