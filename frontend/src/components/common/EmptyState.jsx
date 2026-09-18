'use client';
/**
 * EmptyState — Reusable empty-state component with inline SVG illustrations.
 * Phase 4 #18 / Phase 7 #52
 *
 * Usage:
 *   <EmptyState variant="orders" message="No orders yet" />
 *   <EmptyState variant="dentists" message="No dentists found" />
 *   <EmptyState variant="payments" message="No payments found" />
 *   <EmptyState variant="generic" message="Nothing here" />
 */
import React from 'react';

const illustrations = {
  orders: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard with tooth */}
      <rect x="30" y="15" width="60" height="85" rx="8" fill="#f0fdf4" stroke="#708c80" strokeWidth="2"/>
      <rect x="45" y="8" width="30" height="14" rx="4" fill="#708c80"/>
      <circle cx="60" cy="15" r="3" fill="#fff"/>
      {/* Tooth shape */}
      <path d="M52 50 C52 42, 58 38, 60 38 C62 38, 68 42, 68 50 C68 55, 66 65, 64 72 C63 75, 61 75, 60 72 C59 75, 57 75, 56 72 C54 65, 52 55, 52 50Z" fill="#e0f2f1" stroke="#708c80" strokeWidth="1.5"/>
      {/* Empty lines */}
      <line x1="40" y1="82" x2="80" y2="82" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="90" x2="68" y2="90" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
      {/* Sparkle */}
      <circle cx="85" cy="28" r="2" fill="#708c80" opacity="0.5"/>
      <circle cx="90" cy="22" r="1.5" fill="#708c80" opacity="0.3"/>
    </svg>
  ),

  dentists: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person silhouette with stethoscope */}
      <circle cx="60" cy="38" r="18" fill="#f0fdf4" stroke="#708c80" strokeWidth="2"/>
      {/* Face details */}
      <circle cx="54" cy="35" r="2" fill="#708c80"/>
      <circle cx="66" cy="35" r="2" fill="#708c80"/>
      <path d="M55 43 Q60 47 65 43" stroke="#708c80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Body */}
      <path d="M35 95 C35 72, 45 62, 60 62 C75 62, 85 72, 85 95" fill="#e0f2f1" stroke="#708c80" strokeWidth="2"/>
      {/* Stethoscope */}
      <path d="M52 68 C52 78, 60 82, 60 82 C60 82, 68 78, 68 68" stroke="#708c80" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="60" cy="84" r="3" fill="#708c80"/>
      {/* Plus sign */}
      <circle cx="88" cy="75" r="12" fill="#f0fdf4" stroke="#708c80" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="88" y1="70" x2="88" y2="80" stroke="#708c80" strokeWidth="2" strokeLinecap="round"/>
      <line x1="83" y1="75" x2="93" y2="75" stroke="#708c80" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  payments: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wallet */}
      <rect x="25" y="35" width="70" height="50" rx="10" fill="#f0fdf4" stroke="#708c80" strokeWidth="2"/>
      <path d="M25 50 L95 50" stroke="#708c80" strokeWidth="1.5"/>
      {/* Card slot */}
      <rect x="70" y="58" width="25" height="18" rx="4" fill="#e0f2f1" stroke="#708c80" strokeWidth="1.5"/>
      <circle cx="82" cy="67" r="5" fill="#708c80" opacity="0.3"/>
      {/* Coins */}
      <circle cx="45" cy="67" r="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5"/>
      <text x="45" y="71" textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400e">₹</text>
      {/* Sparkles */}
      <circle cx="38" cy="32" r="2" fill="#708c80" opacity="0.4"/>
      <circle cx="82" cy="28" r="1.5" fill="#708c80" opacity="0.3"/>
      <path d="M50 28 L52 24 L54 28 L50 28Z" fill="#708c80" opacity="0.3"/>
    </svg>
  ),

  generic: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Empty box */}
      <path d="M30 50 L60 35 L90 50 L90 85 L60 100 L30 85Z" fill="#f0fdf4" stroke="#708c80" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M60 65 L60 100" stroke="#708c80" strokeWidth="1.5"/>
      <path d="M30 50 L60 65 L90 50" stroke="#708c80" strokeWidth="1.5"/>
      {/* Dashed opening */}
      <path d="M40 43 L60 30 L80 43" stroke="#708c80" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
      {/* Sparkle */}
      <circle cx="75" cy="30" r="2" fill="#708c80" opacity="0.4"/>
      <circle cx="42" cy="34" r="1.5" fill="#708c80" opacity="0.3"/>
    </svg>
  ),
};

export default function EmptyState({ variant = 'generic', message = 'Nothing here yet', subtext, action, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      textAlign: 'center',
      gap: '12px',
      opacity: 0.9,
    }}>
      <div style={{ marginBottom: '4px' }}>
        {illustrations[variant] || illustrations.generic}
      </div>
      <p style={{
        fontSize: '0.92rem',
        fontWeight: 700,
        color: 'var(--dz-color-charcoal, #1e2824)',
        margin: 0,
      }}>
        {message}
      </p>
      {subtext && (
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--dz-color-text-muted, #64748b)',
          margin: 0,
          maxWidth: '280px',
          lineHeight: 1.5,
        }}>
          {subtext}
        </p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '4px',
            padding: '8px 20px',
            background: 'var(--dz-color-primary, #708c80)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'transform 0.15s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none'; }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
