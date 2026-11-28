'use client';
import React from 'react';
import { Icons } from './DashboardIcons';

const linkBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'background 0.18s ease, border-color 0.18s ease, color 0.18s ease',
};

/**
 * LabSupportBar — Shared Dentzy Lab Support contact bar for PC & Mobile portals.
 */
export default function LabSupportBar({
  variant = 'pc',
  id = 'dz-support-bar',
  className = '',
  style,
}) {
  const isMobile = variant === 'mobile';

  const pillStyle = {
    ...linkBase,
    padding: isMobile ? '8px 14px' : '6px 14px',
    minHeight: isMobile ? '44px' : '34px',
    borderRadius: isMobile ? '10px' : '9999px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: isMobile ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.75rem',
  };

  const waStyle = {
    ...pillStyle,
    background: 'rgba(22, 163, 74, 0.24)',
    border: '1px solid rgba(34, 197, 94, 0.45)',
    color: '#bbf7d0',
  };

  return (
    <div
      id={id}
      className={className}
      style={{
        background: 'var(--dz-color-text-forest, #1a3028)',
        borderRadius: '14px',
        padding: isMobile ? '14px' : '15px 22px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '10px' : '16px',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(255, 255, 255, 0.78)',
          fontSize: isMobile ? '0.76rem' : '0.8rem',
        }}
      >
        <span style={{ color: '#a3bfb1', display: 'inline-flex' }}>{Icons.phone(isMobile ? 14 : 15)}</span>
        <span>
          <strong style={{ color: '#ffffff' }}>Lab Support</strong> &mdash; Mon to Sat, 9 AM &ndash; 6 PM IST
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <a href="tel:+919503668112" style={pillStyle}>
          {Icons.phone(13)}
          <span>Call</span>
        </a>
        <a href="mailto:support@dentzy.in" style={pillStyle}>
          {Icons.mail(13, 2)}
          <span>Email</span>
        </a>
        <a href="https://wa.me/919503668112" target="_blank" rel="noreferrer" style={waStyle}>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
