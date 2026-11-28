'use client';
import React from 'react';
import { Icons } from './DashboardIcons';
import MonthFilterBar from './MonthFilterBar';
import { formatINR } from '../../utils/format';
import { openInvoiceWindow } from '../../utils/appleCompat';

/**
 * BalanceCreditCard — Shared Outstanding Balance, Credit Limit Progress, and Pending Statement Card.
 */
export default function BalanceCreditCard({
  totalUnpaid = 0,
  unpaidCount = 0,
  creditLimit = 200000,
  monthFilter = '',
  onMonthChange,
  onDownloadPendingBill,
  variant = 'pc',
  className = '',
  style,
}) {
  const isMobile = variant === 'mobile';
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const unpaid = Number(totalUnpaid) || 0;
  const limit = Number(creditLimit) || 200000;
  const creditUsedPct = Math.min(100, Math.round((unpaid / limit) * 100));

  const barColor =
    creditUsedPct >= 90 ? '#dc2626' : creditUsedPct >= 60 ? '#d97706' : '#1e5038';

  const handleDownload = () => {
    if (typeof onDownloadPendingBill === 'function') {
      onDownloadPendingBill(monthFilter);
      return;
    }
    const query = monthFilter ? `&month=${encodeURIComponent(monthFilter)}` : '';
    openInvoiceWindow(`/invoice?unpaid=true${query}`);
  };

  const thisMonthBtn = !monthFilter ? (
    <button
      type="button"
      onClick={() => onMonthChange?.(currentMonthISO)}
      style={{
        background: '#e8f5ee',
        border: '1px solid rgba(30, 80, 56, 0.2)',
        borderRadius: '8px',
        padding: isMobile ? '8px 12px' : '6px 10px',
        fontSize: '0.78rem',
        color: '#1e5038',
        cursor: 'pointer',
        fontWeight: 600,
        minHeight: isMobile ? '44px' : '36px',
      }}
    >
      This Month
    </button>
  ) : null;

  const downloadBtn = (
    <button
      type="button"
      onClick={handleDownload}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: isMobile ? '100%' : 'auto',
        padding: isMobile ? '10px 14px' : '8px 14px',
        minHeight: isMobile ? '44px' : '36px',
        background: '#1e5038',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {Icons.download(14)}
      <span>
        Download Pending Bill{isMobile && monthFilter ? ` (${monthFilter})` : ''}
      </span>
    </button>
  );

  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        border: '1px solid var(--dz-color-border-mint, #e2ece6)',
        borderRadius: '14px',
        padding: isMobile ? '16px' : '20px',
        marginBottom: isMobile ? '14px' : '20px',
        boxShadow: '0 2px 10px rgba(30, 80, 56, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '14px' : '16px',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--dz-color-sage, #708c80)',
              letterSpacing: '0.05em',
            }}
          >
            {isMobile ? 'Outstanding Balance to Pay' : 'Outstanding Balance / Amount to Pay'}
          </span>
          <div
            style={{
              fontSize: isMobile ? '1.65rem' : '1.75rem',
              fontWeight: 800,
              color: unpaid > 0 ? '#b45309' : '#1e5038',
              marginTop: '3px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatINR(unpaid)}
          </div>
          <div style={{ fontSize: isMobile ? '0.76rem' : '0.82rem', color: '#475569', marginTop: '2px' }}>
            Across {unpaidCount} unpaid {unpaidCount === 1 ? 'order' : 'orders'} pending lab clearance
          </div>
        </div>

        {!isMobile && (
          <MonthFilterBar
            id="dz-balance-month-pc"
            value={monthFilter}
            clearValue=""
            clearLabel="All Unpaid"
            label=""
            onChange={(val) => onMonthChange?.(val)}
            extraActions={
              <>
                {thisMonthBtn}
                {downloadBtn}
              </>
            }
          />
        )}
      </div>

      {/* Credit Limit Progress */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: isMobile ? '0.75rem' : '0.78rem',
            fontWeight: 600,
            color: '#4a7060',
            marginBottom: '6px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>Lab Credit Limit Usage ({creditUsedPct}%)</span>
          <span>
            {formatINR(unpaid)} / {formatINR(limit)}
          </span>
        </div>
        <div className="dz-progress-track">
          <div
            className="dz-progress-fill"
            style={{
              width: `${creditUsedPct}%`,
              background: barColor,
            }}
          />
        </div>
      </div>

      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <MonthFilterBar
            id="dz-balance-month-mobile"
            value={monthFilter}
            clearValue=""
            clearLabel="All Unpaid"
            label=""
            onChange={(val) => onMonthChange?.(val)}
            extraActions={thisMonthBtn}
            isMobile={true}
          />
          {downloadBtn}
        </div>
      )}
    </div>
  );
}
