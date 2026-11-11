'use client';
import React from 'react';
import { Skeleton } from './Skeleton';
import { DentzyCard } from './common/DentzyCard';
import { PIPELINE_STEPS } from './dashboard/shared/constants';

// ── D2: Recent Orders Skeleton ──────────────────────────────────────────────

export const RecentOrdersSkeleton = ({ rows = 5, variant = 'pc' }) => {
  if (variant === 'mobile') {
    return (
      <div className="m-recent-cases-list" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="m-recent-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 2px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                className="m-recent-row-top"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span className="m-case-mono" style={{ background: 'transparent', padding: 0 }}>
                  <Skeleton width="68px" height="16px" borderRadius="4px" />
                </span>
                <Skeleton width="60px" height="22px" borderRadius="999px" />
              </div>
              <div
                className="m-recent-row-bottom"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
              >
                <Skeleton width="110px" height="15px" borderRadius="4px" />
                <Skeleton width="65px" height="14px" borderRadius="4px" />
              </div>
            </div>
            <span style={{ marginLeft: '12px', flexShrink: 0 }}>
              <Skeleton width="15px" height="15px" borderRadius="2px" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ud-recent-cases-list" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ud-recent-case-row">
          <div className="ud-recent-case-left">
            <span className="ud-case-id-mono" style={{ background: 'transparent', padding: 0 }}>
              <Skeleton width="72px" height="18px" borderRadius="4px" />
            </span>
            <span className="ud-recent-case-name">
              <Skeleton width="120px" height="16px" borderRadius="4px" />
            </span>
          </div>
          <div className="ud-recent-case-right">
            <span className="ud-case-tag" style={{ background: 'transparent', padding: 0 }}>
              <Skeleton width="70px" height="16px" borderRadius="4px" />
            </span>
            <Skeleton width="64px" height="24px" borderRadius="999px" />
            <span className="ud-recent-case-chevron" style={{ color: 'transparent' }}>
              <Skeleton width="12px" height="12px" borderRadius="2px" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── D3: Production Pipeline Card Skeleton ───────────────────────────────────

export const PipelineCardSkeleton = () => (
  <div className="pp-card pp-card--single" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <div className="pp-header">
      <div>
        <h3 className="pp-title">
          <Skeleton width="140px" height="18px" borderRadius="4px" />
        </h3>
        <p className="pp-sub" style={{ marginTop: '4px' }}>
          <Skeleton width="220px" height="13px" borderRadius="4px" />
        </p>
      </div>
      <div className="pp-hdr-right">
        <Skeleton width="96px" height="24px" borderRadius="99px" />
        <Skeleton width="86px" height="28px" borderRadius="8px" />
      </div>
    </div>
    <div className="pp-steps">
      {PIPELINE_STEPS.map((step, idx) => (
        <React.Fragment key={step.key || idx}>
          <div className="pp-step">
            <div className="pp-step-icon" style={{ border: 'none', background: 'transparent' }}>
              <Skeleton width="100%" height="100%" borderRadius="50%" />
            </div>
            <span className="pp-step-label">
              <Skeleton width="48px" height="12px" borderRadius="4px" />
            </span>
          </div>
          {idx < PIPELINE_STEPS.length - 1 && <div className="pp-connector" />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ── D4 & A8: Data Table Skeleton ────────────────────────────────────────────

export const DataTableSkeleton = ({
  headers = [],
  rows = 6,
  kpiCount = 0,
  selectable = false,
}) => (
  <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {kpiCount > 0 && (
      <div className="dz-kpi-row" style={{ marginBottom: '14px' }}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div key={i} className="dz-kpi-card">
            <span className="dz-kpi-card__label">
              <Skeleton width="70px" height="12px" borderRadius="4px" />
            </span>
            <span className="dz-kpi-card__value">
              <Skeleton width="90px" height="20px" borderRadius="4px" />
            </span>
          </div>
        ))}
      </div>
    )}
    <div className="dz-table-shell">
      <table className="dz-data-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: '38px', textAlign: 'center', padding: '10px 8px' }}>
                <Skeleton width="15px" height="15px" borderRadius="3px" style={{ margin: '0 auto' }} />
              </th>
            )}
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => {
            const rowBg = rIdx % 2 === 0 ? '#ffffff' : '#f8faf9';
            return (
              <tr key={rIdx} style={{ background: rowBg }}>
                {selectable && (
                  <td style={{ width: '38px', textAlign: 'center', padding: '10px 8px' }}>
                    <Skeleton width="15px" height="15px" borderRadius="3px" style={{ margin: '0 auto' }} />
                  </td>
                )}
                {headers.map((h, cIdx) => {
                  const hLower = String(h || '').toLowerCase();
                  const isPill =
                    hLower.includes('status') ||
                    hLower.includes('priority') ||
                    hLower.includes('payment') ||
                    hLower.includes('action');
                  return (
                    <td key={cIdx}>
                      {isPill ? (
                        <Skeleton width="72px" height="22px" borderRadius="999px" />
                      ) : (
                        <Skeleton
                          width={cIdx === 0 ? '70%' : '55%'}
                          height="18px"
                          borderRadius="4px"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ── D5: Balance Card Skeleton ───────────────────────────────────────────────

export const BalanceCardSkeleton = ({ variant = 'pc' }) => {
  if (variant === 'mobile') {
    return (
      <div
        aria-hidden="true"
        style={{
          background: '#ffffff',
          border: '1px solid #e2ece6',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '14px',
          boxShadow: '0 2px 8px rgba(30, 80, 56, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'none',
        }}
      >
        <Skeleton width="150px" height="12px" borderRadius="4px" />
        <Skeleton width="140px" height="28px" borderRadius="6px" style={{ marginTop: '2px' }} />
        <Skeleton
          width="200px"
          height="12px"
          borderRadius="4px"
          style={{ marginTop: '2px', marginBottom: '12px' }}
        />
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <Skeleton width="140px" height="12px" borderRadius="4px" />
            <Skeleton width="110px" height="12px" borderRadius="4px" />
          </div>
          <Skeleton width="100%" height="7px" borderRadius="4px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="120px" height="32px" borderRadius="6px" />
          <Skeleton width="80px" height="32px" borderRadius="6px" />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        background: '#ffffff',
        border: '1px solid #e2ece6',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(30, 80, 56, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <Skeleton width="190px" height="14px" borderRadius="4px" />
          <Skeleton width="160px" height="30px" borderRadius="6px" style={{ marginTop: '4px' }} />
          <Skeleton width="220px" height="14px" borderRadius="4px" style={{ marginTop: '2px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Skeleton width="130px" height="32px" borderRadius="6px" />
          <Skeleton width="80px" height="32px" borderRadius="6px" />
          <Skeleton width="150px" height="34px" borderRadius="8px" />
        </div>
      </div>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <Skeleton width="160px" height="14px" borderRadius="4px" />
          <Skeleton width="120px" height="14px" borderRadius="4px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="4px" />
      </div>
    </div>
  );
};

// ── D6: Mobile Compact Card Skeleton ────────────────────────────────────────

export const MobileCompactCardSkeleton = ({ count = 4 }) => (
  <div className="m-cards-list" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="m-compact-card">
        <div className="m-compact-card__top">
          <Skeleton width="85px" height="18px" borderRadius="4px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skeleton width="64px" height="22px" borderRadius="999px" />
            <Skeleton width="70px" height="22px" borderRadius="999px" />
          </div>
        </div>
        <div className="m-compact-card__main">
          <div className="m-compact-card__info">
            <Skeleton width="130px" height="18px" borderRadius="4px" style={{ marginBottom: '6px' }} />
            <div className="m-compact-card__meta" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Skeleton width="60px" height="14px" borderRadius="4px" />
              <Skeleton width="70px" height="14px" borderRadius="4px" />
              <Skeleton width="50px" height="14px" borderRadius="4px" />
            </div>
          </div>
          <span className="m-compact-card__arrow">
            <Skeleton width="16px" height="16px" borderRadius="4px" />
          </span>
        </div>
      </div>
    ))}
  </div>
);

// ── D7: Completed Orders Skeleton ───────────────────────────────────────────

export const CompletedOrdersSkeleton = () => (
  <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {/* Desktop Table View */}
    <div className="cov-table-card">
      <table className="cov-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Patient Name</th>
            <th>Service Type</th>
            <th>Completion Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="cov-row">
              <td>
                <Skeleton width="90px" height="20px" borderRadius="4px" />
              </td>
              <td>
                <Skeleton width="130px" height="18px" borderRadius="4px" />
              </td>
              <td>
                <Skeleton width="100px" height="18px" borderRadius="4px" />
              </td>
              <td>
                <Skeleton width="90px" height="16px" borderRadius="4px" />
              </td>
              <td>
                <Skeleton width="75px" height="24px" borderRadius="999px" />
              </td>
              <td style={{ textAlign: 'right' }}>
                <Skeleton
                  width="85px"
                  height="16px"
                  borderRadius="4px"
                  style={{ marginLeft: 'auto' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile Cards View */}
    <div className="cov-mobile-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="cov-card">
          <div className="cov-card-top">
            <Skeleton width="90px" height="20px" borderRadius="4px" />
            <Skeleton width="75px" height="24px" borderRadius="999px" />
          </div>
          <div className="cov-card-main">
            <div className="cov-card-info">
              <Skeleton width="140px" height="18px" borderRadius="4px" style={{ marginBottom: '6px' }} />
              <div className="cov-card-meta" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Skeleton width="70px" height="14px" borderRadius="4px" />
                <Skeleton width="80px" height="14px" borderRadius="4px" />
              </div>
            </div>
            <span className="cov-card-arrow">
              <Skeleton width="16px" height="16px" borderRadius="4px" />
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── D8: Dentist Dashboard Shell Skeleton ────────────────────────────────────

export const DentistDashboardShellSkeleton = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="m-app-shell" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <div className="m-header" style={{ height: '56px' }}>
          <div className="m-header__left">
            <Skeleton width="70px" height="24px" borderRadius="4px" />
          </div>
          <div className="m-header__center">
            <Skeleton width="100%" height="32px" borderRadius="16px" />
          </div>
          <div className="m-header__right">
            <Skeleton width="32px" height="32px" borderRadius="50%" />
          </div>
        </div>
        <main className="m-dash-main">
          <div className="m-tab-content">
            <div style={{ marginBottom: '16px' }}>
              <Skeleton width="140px" height="20px" borderRadius="4px" style={{ marginBottom: '4px' }} />
              <Skeleton width="190px" height="12px" borderRadius="4px" />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #eef2f0',
                }}
              >
                <Skeleton width="40%" height="12px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60%" height="22px" />
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #eef2f0',
                }}
              >
                <Skeleton width="40%" height="12px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60%" height="22px" />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <PipelineCardSkeleton />
            </div>
            <RecentOrdersSkeleton rows={5} variant="mobile" />
          </div>
        </main>
        <div
          style={{
            position: 'fixed',
            bottom: '12px',
            left: '12px',
            right: '12px',
            height: '64px',
            zIndex: 50,
          }}
        >
          <Skeleton width="100%" height="100%" borderRadius="16px" />
        </div>
      </div>
    );
  }

  return (
    <div className="ud-layout" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <header className="ud-header">
        <div style={{ width: '32px', height: '32px' }} />
        <div className="ud-header-logo">
          <Skeleton width="90px" height="26px" borderRadius="4px" />
        </div>
        <div className="ud-header-search">
          <Skeleton width="100%" height="36px" borderRadius="8px" />
        </div>
        <div className="ud-header-user">
          <div className="ud-user-info">
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="120px" height="12px" borderRadius="4px" style={{ marginTop: '2px' }} />
          </div>
          <div className="ud-user-avatar" style={{ background: 'transparent' }}>
            <Skeleton width="34px" height="34px" borderRadius="50%" />
          </div>
        </div>
      </header>
      <div className="ud-body">
        <aside className="ud-sidebar">
          <nav className="ud-nav">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ud-nav-item">
                <Skeleton width="18px" height="18px" borderRadius="4px" />
                <Skeleton width="90px" height="16px" borderRadius="4px" />
              </div>
            ))}
            <div
              style={{
                marginTop: 'auto',
                borderTop: '1px solid rgba(112, 140, 128, 0.12)',
                paddingTop: '12px',
              }}
            >
              <div className="ud-nav-item">
                <Skeleton width="18px" height="18px" borderRadius="4px" />
                <Skeleton width="70px" height="16px" borderRadius="4px" />
              </div>
            </div>
          </nav>
        </aside>
        <main className="ud-main">
          <div className="ud-content-inner">
            <div
              className="ud-greeting-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <Skeleton width="180px" height="24px" borderRadius="4px" />
                <Skeleton
                  width="240px"
                  height="14px"
                  borderRadius="4px"
                  style={{ marginTop: '4px' }}
                />
              </div>
              <Skeleton width="110px" height="26px" borderRadius="99px" />
            </div>
            <div className="ud-stats-skeleton" style={{ marginBottom: '20px' }}>
              <div className="ud-skeleton-card" />
              <div className="ud-skeleton-card" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <PipelineCardSkeleton />
            </div>
            <RecentOrdersSkeleton rows={5} variant="pc" />
          </div>
        </main>
      </div>
    </div>
  );
};

// ── D9: Pipeline Page & List Skeletons ───────────────────────────────────────

export const PipelineListSkeleton = () => (
  <div className="plp-list" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="plp-card plp-card--skeleton">
        <div className="plp-card-top">
          <Skeleton width="140px" height="16px" borderRadius="4px" />
          <Skeleton width="80px" height="22px" borderRadius="99px" />
        </div>
        <div className="plp-card-body">
          <div className="plp-card-info">
            <Skeleton width="60%" height="14px" borderRadius="4px" style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height="12px" borderRadius="4px" />
          </div>
          <div className="plp-card-pipeline">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} width="36px" height="36px" borderRadius="50%" />
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const PipelinePageSkeleton = () => (
  <div className="plp-viewport" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <header className="plp-top-header">
      <div className="plp-top-header-left">
        <Skeleton width="90px" height="26px" borderRadius="4px" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
          <Skeleton width="60px" height="14px" borderRadius="4px" />
          <span style={{ color: '#c5d8ce' }}>/</span>
          <Skeleton width="110px" height="14px" borderRadius="4px" />
        </div>
      </div>
      <div className="plp-top-header-right">
        <div className="plp-header-user">
          <Skeleton width="90px" height="14px" borderRadius="4px" />
          <Skeleton width="34px" height="34px" borderRadius="50%" />
        </div>
      </div>
    </header>
    <div className="plp-container">
      <div className="plp-page-header">
        <Skeleton width="120px" height="16px" borderRadius="4px" style={{ marginBottom: '12px' }} />
        <div className="plp-title-row">
          <div>
            <Skeleton width="200px" height="28px" borderRadius="4px" />
            <Skeleton width="260px" height="14px" borderRadius="4px" style={{ marginTop: '6px' }} />
          </div>
          <Skeleton width="90px" height="26px" borderRadius="99px" />
        </div>
      </div>
      <div className="plp-filters">
        {[1, 2, 3].map((i) => (
          <div key={i} className="plp-filter-tab" style={{ border: 'none' }}>
            <Skeleton width="70px" height="16px" borderRadius="4px" />
          </div>
        ))}
      </div>
      <PipelineListSkeleton />
    </div>
  </div>
);

// ── D10: Invoice Skeleton ───────────────────────────────────────────────────

export const InvoiceSkeleton = () => (
  <div
    style={{ minHeight: '100vh', background: '#f8faf9', padding: '16px 0' }}
    aria-hidden="true"
  >
    <div
      className="pi-standalone-wrap"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="pi-paper" style={{ margin: '0 auto', pointerEvents: 'none' }}>
        {/* Top Header Row */}
        <div className="pi-top-row">
          <div className="pi-brand-logo">
            <Skeleton width="130px" height="32px" borderRadius="4px" />
          </div>
          <div className="pi-title-block">
            <Skeleton
              width="240px"
              height="20px"
              borderRadius="4px"
              style={{ marginLeft: 'auto', marginBottom: '6px' }}
            />
            <Skeleton
              width="120px"
              height="14px"
              borderRadius="4px"
              style={{ marginLeft: 'auto' }}
            />
          </div>
        </div>

        {/* Address Grid */}
        <div className="pi-address-grid">
          <div className="pi-col-soldby">
            <Skeleton width="60px" height="12px" borderRadius="4px" style={{ marginBottom: '8px' }} />
            <Skeleton width="180px" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
            <Skeleton width="140px" height="12px" borderRadius="4px" style={{ marginBottom: '4px' }} />
            <Skeleton width="120px" height="12px" borderRadius="4px" style={{ marginBottom: '4px' }} />
            <Skeleton width="160px" height="12px" borderRadius="4px" style={{ marginBottom: '4px' }} />
          </div>
          <div className="pi-col-billing">
            <Skeleton width="90px" height="12px" borderRadius="4px" style={{ marginBottom: '8px' }} />
            <Skeleton width="160px" height="16px" borderRadius="4px" style={{ marginBottom: '6px' }} />
            <Skeleton width="130px" height="12px" borderRadius="4px" style={{ marginBottom: '4px' }} />
            <Skeleton width="150px" height="12px" borderRadius="4px" style={{ marginBottom: '4px' }} />
          </div>
        </div>

        {/* Order Info Row */}
        <div className="pi-order-info-row" style={{ marginTop: '14px', marginBottom: '14px' }}>
          <div className="pi-order-left">
            <Skeleton width="200px" height="14px" borderRadius="4px" />
          </div>
          <div className="pi-order-right">
            <Skeleton
              width="180px"
              height="14px"
              borderRadius="4px"
              style={{ marginLeft: 'auto' }}
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '45%' }}>Description / Service</th>
                <th style={{ width: '15%' }}>Patient / Ref</th>
                <th style={{ width: '15%' }}>Unit Price</th>
                <th style={{ width: '8%' }}>Qty</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton width="16px" height="14px" borderRadius="3px" />
                  </td>
                  <td>
                    <Skeleton width="80%" height="14px" borderRadius="3px" />
                  </td>
                  <td>
                    <Skeleton width="70%" height="14px" borderRadius="3px" />
                  </td>
                  <td>
                    <Skeleton width="60%" height="14px" borderRadius="3px" />
                  </td>
                  <td>
                    <Skeleton width="20px" height="14px" borderRadius="3px" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Skeleton
                      width="60px"
                      height="14px"
                      borderRadius="3px"
                      style={{ marginLeft: 'auto' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Block */}
        <div
          className="pi-totals-row"
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}
        >
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="80px" height="14px" borderRadius="3px" />
              <Skeleton width="70px" height="14px" borderRadius="3px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="100px" height="16px" borderRadius="3px" />
              <Skeleton width="90px" height="18px" borderRadius="3px" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pi-fineprint" style={{ marginTop: '32px' }}>
          <Skeleton
            width="80%"
            height="10px"
            borderRadius="3px"
            style={{ margin: '0 auto 6px' }}
          />
          <Skeleton
            width="60%"
            height="10px"
            borderRadius="3px"
            style={{ margin: '0 auto' }}
          />
        </div>
      </div>
    </div>
  </div>
);

// ── S1: Task Card Skeleton (Production Staff) ───────────────────────────────

export const TaskCardSkeleton = ({ count = 4 }) => (
  <div
    aria-hidden="true"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '16px',
      pointerEvents: 'none',
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <DentzyCard
        key={i}
        className="sd-order-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton width="96px" height="24px" borderRadius="6px" />
            <Skeleton width="72px" height="22px" borderRadius="9999px" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="80px" height="22px" borderRadius="9999px" />
          </div>
        </div>

        {/* Patient Name & Clinic Line */}
        <div>
          <Skeleton width="55%" height="22px" borderRadius="4px" />
          <Skeleton width="70%" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Skeleton width="110px" height="24px" borderRadius="6px" />
          <Skeleton width="34px" height="22px" borderRadius="6px" />
          <Skeleton width="34px" height="22px" borderRadius="6px" />
        </div>

        {/* Stage stepper block */}
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f3',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <Skeleton width="110px" height="12px" borderRadius="4px" />
            <Skeleton width="150px" height="26px" borderRadius="8px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 2px',
                }}
              >
                <Skeleton width="10px" height="10px" borderRadius="50%" />
                <Skeleton width="40px" height="10px" borderRadius="3px" />
              </div>
            ))}
          </div>
        </div>
      </DentzyCard>
    ))}
  </div>
);

// ── S2: Receptionist Staff Dashboard Skeletons ──────────────────────────────

export const StaffSummaryTilesSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '14px',
      marginBottom: '20px',
      pointerEvents: 'none',
    }}
  >
    {[1, 2, 3].map((i) => (
      <DentzyCard key={i} style={{ padding: '18px 20px' }}>
        <Skeleton width="80px" height="14px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <Skeleton width="120px" height="24px" borderRadius="4px" />
      </DentzyCard>
    ))}
  </div>
);

export const DentistFinanceCardsSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '14px',
      pointerEvents: 'none',
    }}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <DentzyCard
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Skeleton width="120px" height="18px" borderRadius="4px" />
            <Skeleton width="150px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
          </div>
          <Skeleton width="18px" height="18px" borderRadius="4px" />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <Skeleton width="90px" height="22px" borderRadius="6px" />
          <Skeleton width="95px" height="22px" borderRadius="6px" />
          <Skeleton width="90px" height="22px" borderRadius="6px" />
        </div>
        <div
          style={{
            borderTop: '1px solid #f0f4f2',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Skeleton width="80px" height="14px" borderRadius="4px" />
          <Skeleton width="70px" height="18px" borderRadius="10px" />
        </div>
      </DentzyCard>
    ))}
  </div>
);

export const DentistCardSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '14px',
      pointerEvents: 'none',
    }}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <DentzyCard
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width="42px" height="42px" borderRadius="12px" />
            <div>
              <Skeleton width="120px" height="18px" borderRadius="4px" />
              <Skeleton width="140px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
            </div>
          </div>
          <Skeleton width="18px" height="18px" borderRadius="4px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Skeleton width="110px" height="14px" borderRadius="4px" />
          <Skeleton width="140px" height="14px" borderRadius="4px" />
        </div>
        <div
          style={{
            borderTop: '1px solid #f0f4f2',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Skeleton width="120px" height="22px" borderRadius="6px" />
          <Skeleton width="80px" height="14px" borderRadius="4px" />
        </div>
      </DentzyCard>
    ))}
  </div>
);

export const StaffOrderRowSkeleton = ({ count = 4 }) => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <DentzyCard
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Skeleton width="85px" height="24px" borderRadius="6px" />
            <Skeleton width="120px" height="18px" borderRadius="4px" />
            <Skeleton width="90px" height="22px" borderRadius="6px" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skeleton width="70px" height="22px" borderRadius="999px" />
            <Skeleton width="80px" height="22px" borderRadius="6px" />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="80px" height="14px" borderRadius="4px" />
            <Skeleton width="70px" height="14px" borderRadius="4px" />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Skeleton width="30px" height="30px" borderRadius="8px" />
            <Skeleton width="30px" height="30px" borderRadius="8px" />
          </div>
        </div>
      </DentzyCard>
    ))}
  </div>
);

export const StaffPayRowSkeleton = ({ count = 4 }) => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <DentzyCard
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Skeleton width="16px" height="16px" borderRadius="3px" />
            <Skeleton width="85px" height="24px" borderRadius="6px" />
            <Skeleton width="120px" height="18px" borderRadius="4px" />
          </div>
          <Skeleton width="70px" height="22px" borderRadius="999px" />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Skeleton width="80px" height="14px" borderRadius="4px" />
            <Skeleton width="70px" height="14px" borderRadius="4px" />
            <Skeleton width="80px" height="14px" borderRadius="4px" />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Skeleton width="30px" height="30px" borderRadius="8px" />
          </div>
        </div>
      </DentzyCard>
    ))}
  </div>
);

// ── S3: Delivery Card Skeleton ──────────────────────────────────────────────

export const DeliveryCardSkeleton = ({ count = 4 }) => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', flexDirection: 'column', gap: '14px', pointerEvents: 'none' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <DentzyCard
        key={i}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* ROW 1: Case info, patient, restoration, priority, QC badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Skeleton width="85px" height="24px" borderRadius="6px" />
            <Skeleton width="130px" height="18px" borderRadius="4px" />
            <Skeleton width="90px" height="22px" borderRadius="6px" />
            <Skeleton width="70px" height="20px" borderRadius="6px" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Skeleton width="70px" height="22px" borderRadius="8px" />
            <Skeleton width="80px" height="22px" borderRadius="8px" />
          </div>
        </div>

        {/* ROW 2: Clinic Name, Dentist, Address, Phone */}
        <div
          style={{
            background: '#f8faf9',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <Skeleton width="140px" height="18px" borderRadius="4px" />
              <Skeleton width="110px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
            </div>
            <Skeleton width="100px" height="28px" borderRadius="8px" />
          </div>
          <Skeleton width="240px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
        </div>

        {/* ROW 3: Due Date, QC timestamp, Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Skeleton width="110px" height="14px" borderRadius="4px" />
            <Skeleton width="120px" height="14px" borderRadius="4px" />
          </div>
          <Skeleton width="90px" height="22px" borderRadius="6px" />
        </div>

        {/* ROW 4: Action Button */}
        <div
          style={{
            borderTop: '1px solid #f0f4f2',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Skeleton width="140px" height="36px" borderRadius="10px" />
        </div>
      </DentzyCard>
    ))}
  </div>
);

// ── A2: Settings Tiles Skeleton (Admin) ─────────────────────────────────────

export const SettingsTilesSkeleton = ({ count = 4, variant = 'pc' }) => {
  if (variant === 'mobile') {
    return (
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e2ece6',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Skeleton width="80px" height="12px" borderRadius="4px" />
            <Skeleton width="60px" height="20px" borderRadius="4px" style={{ marginTop: '6px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#f8faf9',
            border: '1px solid #e2ece6',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <Skeleton width="90px" height="14px" borderRadius="4px" />
          <Skeleton width="70px" height="24px" borderRadius="4px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  );
};

// ── A3: Notice Editor Skeleton ──────────────────────────────────────────────

export const NoticeEditorSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e2ece6',
      padding: '24px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      pointerEvents: 'none',
    }}
  >
    {/* Master Toggle */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '16px 20px',
        background: '#f8faf9',
        border: '1px solid #e2ece6',
        borderRadius: '14px',
      }}
    >
      <div>
        <Skeleton width="180px" height="18px" borderRadius="4px" />
        <Skeleton width="320px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
      </div>
      <Skeleton width="52px" height="28px" borderRadius="14px" />
    </div>

    {/* Live Preview */}
    <div style={{ marginBottom: '24px' }}>
      <Skeleton width="90px" height="12px" borderRadius="4px" style={{ marginBottom: '10px' }} />
      <Skeleton width="100%" height="40px" borderRadius="14px" />
    </div>

    {/* Add Message */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <Skeleton width="100%" height="44px" borderRadius="12px" style={{ flex: 1 }} />
      <Skeleton width="44px" height="44px" borderRadius="10px" />
    </div>

    {/* Messages list */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            background: '#f8faf9',
            border: '1px solid #e2ece6',
            borderRadius: '10px',
            height: '46px',
            boxSizing: 'border-box',
          }}
        >
          <Skeleton width="16px" height="16px" borderRadius="2px" />
          <Skeleton width="60%" height="16px" borderRadius="4px" />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <Skeleton width="24px" height="24px" borderRadius="4px" />
            <Skeleton width="24px" height="24px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>

    {/* Action Footer */}
    <div
      style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '16px',
        borderTop: '1px solid #edf2ef',
      }}
    >
      <Skeleton width="100px" height="40px" borderRadius="10px" />
      <Skeleton width="140px" height="40px" borderRadius="10px" />
    </div>
  </div>
);

// ── A4: Maintenance Mode Controller Skeleton ────────────────────────────────

export const MaintenanceControllerSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2ece6',
      padding: '28px',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Inter, -apple-system, sans-serif',
      pointerEvents: 'none',
    }}
  >
    {/* Section Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <Skeleton width="220px" height="24px" borderRadius="4px" />
        <Skeleton width="340px" height="14px" borderRadius="4px" style={{ marginTop: '6px' }} />
      </div>
      <Skeleton width="150px" height="32px" borderRadius="9999px" />
    </div>

    {/* Master Power Toggle Card */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: '#f8faf9',
        border: '1px solid #e2ece6',
        borderRadius: '14px',
        marginBottom: '28px',
      }}
    >
      <div>
        <Skeleton width="180px" height="18px" borderRadius="4px" />
        <Skeleton width="360px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
      </div>
      <Skeleton width="56px" height="30px" borderRadius="15px" />
    </div>

    {/* Target Audience */}
    <div style={{ marginBottom: '28px' }}>
      <Skeleton width="180px" height="14px" borderRadius="4px" style={{ marginBottom: '10px' }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '2px solid #e5ebe7',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="32px" height="32px" borderRadius="8px" />
                <Skeleton width="100px" height="16px" borderRadius="4px" />
              </div>
              <Skeleton width="18px" height="18px" borderRadius="50%" />
            </div>
            <Skeleton width="90%" height="12px" borderRadius="4px" />
            <Skeleton width="70%" height="12px" borderRadius="4px" />
          </div>
        ))}
      </div>
    </div>

    {/* Custom Announcement Message */}
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Skeleton width="160px" height="14px" borderRadius="4px" />
        <Skeleton width="40px" height="12px" borderRadius="4px" />
      </div>
      <Skeleton width="100%" height="80px" borderRadius="10px" />
      <Skeleton width="260px" height="12px" borderRadius="4px" style={{ marginTop: '6px' }} />
    </div>

    {/* Estimated Restoration Time */}
    <div style={{ marginBottom: '24px' }}>
      <Skeleton width="160px" height="14px" borderRadius="4px" style={{ marginBottom: '8px' }} />
      <Skeleton width="100%" height="44px" borderRadius="10px" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <Skeleton width="70px" height="12px" borderRadius="4px" />
        <Skeleton width="60px" height="24px" borderRadius="9999px" />
        <Skeleton width="60px" height="24px" borderRadius="9999px" />
        <Skeleton width="60px" height="24px" borderRadius="9999px" />
        <Skeleton width="120px" height="24px" borderRadius="9999px" />
      </div>
    </div>

    {/* Emergency Contact Toggle */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#f8faf9',
        border: '1px solid #e2ece6',
        borderRadius: '12px',
        marginBottom: '28px',
      }}
    >
      <div>
        <Skeleton width="220px" height="16px" borderRadius="4px" />
        <Skeleton width="340px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
      </div>
      <Skeleton width="48px" height="26px" borderRadius="13px" />
    </div>

    {/* Footer Save */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #eef3f0',
        paddingTop: '20px',
        flexWrap: 'wrap',
        gap: '14px',
      }}
    >
      <Skeleton width="200px" height="14px" borderRadius="4px" />
      <Skeleton width="140px" height="44px" borderRadius="10px" />
    </div>
  </div>
);

// ── A5: Attendance & Staff Skeletons ────────────────────────────────────────

export const AttendanceRowsSkeleton = ({ count = 6 }) => (
  <div
    aria-hidden="true"
    style={{ display: 'grid', gap: '8px', pointerEvents: 'none' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid rgba(112, 140, 128, 0.14)',
        }}
      >
        <Skeleton width="90px" height="16px" borderRadius="4px" />
        <Skeleton width="70px" height="24px" borderRadius="12px" />
      </div>
    ))}
  </div>
);

export const StaffRowSkeleton = ({ count = 5 }) => (
  <div
    aria-hidden="true"
    style={{ display: 'grid', gap: '12px', pointerEvents: 'none' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid rgba(112, 140, 128, 0.14)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div>
            <Skeleton width="120px" height="16px" borderRadius="4px" />
            <Skeleton width="80px" height="13px" borderRadius="4px" style={{ marginTop: '4px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Skeleton width="32px" height="32px" borderRadius="8px" />
          <Skeleton width="32px" height="32px" borderRadius="8px" />
        </div>
      </div>
    ))}
  </div>
);

// ── A6: Dentist Detail Modal Skeleton ───────────────────────────────────────

export const DentistDetailSkeleton = () => (
  <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <div className="ddm-profile">
      <div className="ddm-profile-avatar" style={{ background: 'transparent' }}>
        <Skeleton width="100%" height="100%" borderRadius="50%" />
      </div>
      <div className="ddm-profile-info">
        <div className="ddm-profile-name-row">
          <Skeleton width="160px" height="24px" borderRadius="4px" />
          <Skeleton width="70px" height="22px" borderRadius="999px" />
        </div>
        <div className="ddm-profile-meta">
          <span className="ddm-meta-item">
            <Skeleton width="140px" height="14px" borderRadius="4px" />
          </span>
          <span className="ddm-meta-item">
            <Skeleton width="110px" height="14px" borderRadius="4px" />
          </span>
          <span className="ddm-meta-item">
            <Skeleton width="130px" height="14px" borderRadius="4px" />
          </span>
          <span className="ddm-meta-item">
            <Skeleton width="160px" height="14px" borderRadius="4px" />
          </span>
        </div>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        borderBottom: '1px solid #eef2f0',
        paddingBottom: '12px',
      }}
    >
      <Skeleton width="130px" height="34px" borderRadius="8px" />
      <Skeleton width="150px" height="34px" borderRadius="8px" />
    </div>

    <div className="ddm-section">
      <div className="ddm-section-header">
        <Skeleton width="120px" height="18px" borderRadius="4px" />
        <Skeleton width="34px" height="34px" borderRadius="8px" />
      </div>
      <div className="ddm-orders-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ddm-order-card">
            <div className="ddm-order-top">
              <div className="ddm-order-id-row">
                <Skeleton width="90px" height="20px" borderRadius="4px" />
                <Skeleton width="60px" height="20px" borderRadius="4px" />
              </div>
              <div className="ddm-order-patient">
                <Skeleton width="140px" height="18px" borderRadius="4px" />
              </div>
              <div className="ddm-order-meta-row">
                <Skeleton width="80px" height="14px" borderRadius="4px" />
                <Skeleton width="60px" height="14px" borderRadius="4px" />
                <Skeleton width="90px" height="14px" borderRadius="4px" />
              </div>
            </div>
            <div className="ddm-order-stage-row">
              <Skeleton width="100%" height="24px" borderRadius="6px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── A7: Admin Dashboard Shell Skeleton ──────────────────────────────────────

export const AdminShellSkeleton = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="ma-shell" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <header className="ma-header" style={{ height: '56px' }}>
          <div className="ma-header-left">
            <Skeleton width="70px" height="24px" borderRadius="4px" />
          </div>
          <div className="ma-header-right">
            <Skeleton width="32px" height="32px" borderRadius="50%" />
          </div>
        </header>
        <main className="ma-main">
          <div className="ma-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ma-skeleton-card" />
            ))}
          </div>
        </main>
        <div
          style={{
            position: 'fixed',
            bottom: '12px',
            left: '12px',
            right: '12px',
            height: '64px',
            zIndex: 50,
          }}
        >
          <Skeleton width="100%" height="100%" borderRadius="16px" />
        </div>
      </div>
    );
  }

  return (
    <div className="ad-layout" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <header className="ad-header">
        <div className="ad-header-logo">
          <Skeleton width="90px" height="26px" borderRadius="4px" />
        </div>
        <div className="ad-header-user">
          <div className="ad-user-info">
            <Skeleton width="90px" height="14px" borderRadius="4px" />
            <Skeleton width="120px" height="12px" borderRadius="4px" style={{ marginTop: '2px' }} />
          </div>
          <div className="ad-user-avatar" style={{ background: 'transparent' }}>
            <Skeleton width="34px" height="34px" borderRadius="50%" />
          </div>
        </div>
      </header>
      <div className="ad-body">
        <aside className="ad-sidebar">
          <nav className="ad-nav">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ad-nav-item">
                <Skeleton width="18px" height="18px" borderRadius="4px" />
                <Skeleton width="90px" height="16px" borderRadius="4px" />
              </div>
            ))}
            <div
              style={{
                marginTop: 'auto',
                borderTop: '1px solid rgba(112, 140, 128, 0.12)',
                paddingTop: '12px',
              }}
            >
              <div className="ad-nav-item">
                <Skeleton width="18px" height="18px" borderRadius="4px" />
                <Skeleton width="70px" height="16px" borderRadius="4px" />
              </div>
            </div>
          </nav>
        </aside>
        <main className="ad-main">
          <div className="ad-content-inner">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="90px" height="32px" borderRadius="20px" />
              ))}
            </div>
            <div className="ad-skeleton-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ad-skeleton-card" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
