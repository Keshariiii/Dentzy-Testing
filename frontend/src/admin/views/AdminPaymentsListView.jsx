'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import { formatINR, formatDate } from '../../utils/format';

const PAY_STATUS_TABS = ['all', 'Paid', 'Pending'];
const PAY_MODE_TABS = ['all', 'Cash', 'Cheque', 'UPI'];

export default function AdminPaymentsListView({
  payments,
  summary,
  loadingPayments,
  payFilterStatus,
  setPayFilterStatus,
  payFilterMode,
  setPayFilterMode,
  paySearch,
  setPaySearch,
  onSelectPayment,
  onRecordPayment,
  onUpdateAmount,
  onDeletePayment,
  drillDentistPayments,
  setDrillDentistPayments,
  isMobile = false,
  onBack,
}) {
  return (
    <div className="admin-payments-view-root">
      {/* Mobile Back to Landing */}
      {isMobile && onBack && !drillDentistPayments && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--dz-color-primary-dark)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
        </div>
      )}

      {/* Drill-down Header if single dentist */}
      {drillDentistPayments ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}>
          <button
            onClick={() => {
              setDrillDentistPayments(null);
              setPayFilterStatus('all');
              setPayFilterMode('all');
              setPaySearch('');
            }}
            aria-label="Back to all payments"
            title="Back to all payments"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e2ece6',
              background: '#ffffff',
              color: '#1e5038',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3028' }}>{drillDentistPayments.name}</div>
            {drillDentistPayments.clinicName && (
              <div style={{ fontSize: '0.8rem', color: '#708c80' }}>{drillDentistPayments.clinicName}</div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: isMobile ? '0 16px' : '0 0 12px 0', marginBottom: '8px' }}>
            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Payments & Billing
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--dz-color-primary-muted)', color: 'var(--dz-color-primary-dark)', padding: '2px 8px', borderRadius: '12px' }}>
                {payments.length}
              </span>
            </h2>
          </div>

          {/* Revenue Stat Cards */}
          <div
            className={isMobile ? 'ma-pay-summary-grid' : 'ad-pay-stats'}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '16px',
              padding: isMobile ? '0 16px' : '0',
            }}
          >
            <div className="ad-stat-card" style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--dz-color-border-light)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dz-color-text-muted)' }}>Total Billed</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', marginTop: '4px' }}>
                {formatINR(summary.totalRevenue || 0)}
              </div>
            </div>
            <div className="ad-stat-card" style={{ background: '#f0fdf4', padding: '14px 16px', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>Collected</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                {formatINR(summary.collectedRevenue || 0)}
              </div>
            </div>
            <div className="ad-stat-card" style={{ background: '#fffbeb', padding: '14px 16px', borderRadius: '14px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e' }}>Pending</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                {formatINR(summary.pendingRevenue || 0)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search Bar */}
      <div className={isMobile ? 'ma-search-wrap' : 'ad-search-wrap'} style={{ marginBottom: '12px' }}>
        <div className={isMobile ? 'ma-search-bar' : 'ad-search-bar'}>
          {Ico.search(14)}
          <input
            type="text"
            className={isMobile ? 'ma-search-input' : 'ad-search-input'}
            placeholder="Search patient, case, ref #, dentist..."
            value={paySearch}
            onChange={(e) => setPaySearch(e.target.value)}
          />
          {paySearch && (
            <button
              className={isMobile ? 'ma-search-clear' : 'ad-search-clear'}
              onClick={() => setPaySearch('')}
              aria-label="Clear search"
            >
              {Ico.x(12)}
            </button>
          )}
        </div>
      </div>

      {/* Filter Status & Mode Chips */}
      <div
        className={isMobile ? 'ma-tabs-wrap' : 'ad-controls'}
        style={{ padding: isMobile ? '0 16px' : '0', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--dz-color-primary-dark)' }}>{Ico.filter(18)}</span>
          <select
            value={payFilterStatus}
            onChange={(e) => setPayFilterStatus(e.target.value)}
            className={isMobile ? 'ma-sort-select' : 'ad-sort-select'}
            style={{ fontWeight: 600 }}
          >
            {PAY_STATUS_TABS.map((st) => (
              <option key={st} value={st}>
                {st === 'all' ? 'All Status' : st}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={payFilterMode}
            onChange={(e) => setPayFilterMode(e.target.value)}
            className={isMobile ? 'ma-sort-select' : 'ad-sort-select'}
            style={{ fontWeight: 600 }}
          >
            {PAY_MODE_TABS.map((m) => (
              <option key={m} value={m}>
                {m === 'all' ? 'All Modes' : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className={isMobile ? 'ma-main' : 'ad-content'}>
        {loadingPayments ? (
          <div className={isMobile ? 'ma-loading' : 'ad-loading'}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={isMobile ? 'ma-skeleton-card' : 'ad-skeleton-card'} />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            variant="payments"
            message="No payment records found"
            subtext="Payment records will appear here as orders are placed and processed."
          />
        ) : (
          <div className={isMobile ? 'ma-pay-list' : 'ad-payments-list'}>
            {payments.map((p) => {
              const isPaid = (p.paymentStatus || p.status) === 'Paid';
              const pId = p._id || p.id || p.caseId;
              const dentistName = p.owner?.name || p.dentistName || '—';
              const clinicName = p.owner?.clinicName || p.clinicName || '';

              return (
                <div
                  key={pId}
                  className={isMobile ? 'ma-card' : 'ad-payment-card'}
                  onClick={() => onSelectPayment(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={isMobile ? 'ma-card-top' : 'ad-payment-header'}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dz-color-charcoal)' }}>
                          {p.patientName || 'Unnamed Patient'}
                        </span>
                        <span className={`pdm-status-pill ${isPaid ? 'pdm-status--paid' : 'pdm-status--pending'}`}>
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--dz-color-text-muted)', marginTop: '2px' }}>
                        {dentistName} {clinicName && `· ${clinicName}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isPaid ? '#15803d' : '#b45309' }}>
                        {p.amount > 0 ? formatINR(p.amount) : '₹0'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--dz-color-text-muted)' }}>
                        {formatDate(p.paidAt || (isPaid ? p.updatedAt : p.createdAt))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--dz-color-border-light)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="pdm-case-badge" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                        {p.caseId}
                      </span>
                      {p.paymentMode && (
                        <span className={`pdm-mode-pill pdm-mode--${p.paymentMode.toLowerCase()}`}>
                          {p.paymentMode}
                        </span>
                      )}
                      {p.referenceNumber && (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--dz-color-text-muted)' }}>
                          #{p.referenceNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isPaid && onRecordPayment && (
                        <button
                          type="button"
                          className="ma-btn ma-btn--sm ma-btn--primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordPayment(p);
                          }}
                          style={{
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'var(--dz-color-primary-accent)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Record Pay
                        </button>
                      )}
                      {onDeletePayment && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePayment(pId);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete Payment"
                        >
                          {Ico.trash(14)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
