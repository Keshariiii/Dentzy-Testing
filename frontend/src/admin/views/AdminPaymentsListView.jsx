'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';
import { DentzyCard, DentzyCaseChip, DentzyKpiRow, DentzyStatusPill } from '../../components/common/DentzyCard';
import { formatINR, formatDate, formatDoctorName } from '../../utils/format';
import { getOrderPrice } from '../../utils/pricing';
import { openInvoiceWindow } from '../../utils/appleCompat';
import DentzySearchBar from '../../components/common/DentzySearchBar';
import SubViewHeader from '../../components/common/SubViewHeader';
import MonthFilterBar from '../../components/common/MonthFilterBar';

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
  payFilterMonth = 'all',
  setPayFilterMonth,
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
      {drillDentistPayments ? (
        <SubViewHeader
          title={formatDoctorName(drillDentistPayments.name, 'Dentist')}
          subtitle={drillDentistPayments.clinicName || undefined}
          onBack={() => {
            setDrillDentistPayments(null);
            setPayFilterStatus('all');
            setPayFilterMode('all');
            setPaySearch('');
          }}
          backLabel="Back to all payments"
          rightAction={
            <button
              type="button"
              onClick={() => {
                const dId = drillDentistPayments.id || drillDentistPayments._id;
                const mQuery = payFilterMonth && payFilterMonth !== 'all' ? `&month=${encodeURIComponent(payFilterMonth)}` : '';
                openInvoiceWindow(`/invoice?unpaid=true&dentistId=${encodeURIComponent(dId)}${mQuery}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: isMobile ? '44px' : undefined,
                background: '#1e5038',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {Ico.download(14)}
              Download Pending Bill
            </button>
          }
          style={{ padding: isMobile ? '12px 16px 0' : '0 0 4px 0', marginBottom: '12px' }}
        />
      ) : (
        <>
          <SubViewHeader
            title="Payments & Billing"
            count={payments.length}
            onBack={isMobile && onBack ? onBack : undefined}
            backLabel="Back"
            style={{ padding: isMobile ? '12px 16px 0' : 0, marginBottom: '12px' }}
          />

          {/* Revenue Stat Cards */}
          <div style={{ padding: isMobile ? '0 16px' : '0', marginBottom: '16px' }}>
            <DentzyKpiRow
              style={{ marginBottom: 0 }}
              items={[
                {
                  key: 'totalBilled',
                  label: 'Total Billed',
                  value: formatINR(summary.totalRevenue || 0),
                },
                {
                  key: 'collected',
                  label: 'Collected',
                  value: formatINR(summary.collectedRevenue || 0),
                  tone: 'success',
                },
                {
                  key: 'pending',
                  label: 'Pending',
                  value: formatINR(summary.pendingRevenue || 0),
                  tone: 'warning',
                },
              ]}
            />
          </div>
        </>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '12px' }}>
        <DentzySearchBar
          placeholder="Search patient, case, ref #, dentist..."
          value={paySearch}
          onChange={(e) => setPaySearch(e.target.value)}
          onClear={() => setPaySearch('')}
        />
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

        {setPayFilterMonth && (
          <MonthFilterBar
            id="apv-month-picker"
            value={payFilterMonth}
            onChange={setPayFilterMonth}
            clearValue="all"
            label=""
            isMobile={isMobile}
          />
        )}
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
          <div className={isMobile ? 'ma-pay-list' : 'ad-user-list'} style={!isMobile ? { gap: '12px' } : undefined}>
            {payments.map((p) => {
              const isPaid = (p.paymentStatus || p.status) === 'Paid';
              const pId = p._id || p.id || p.caseId;
              const dentistName = formatDoctorName(p.owner?.name || p.dentistName, '—');
              const clinicName = p.owner?.clinicName || p.clinicName || '';

              return (
                <DentzyCard
                  key={pId}
                  interactive
                  onClick={() => onSelectPayment(p)}
                  style={{
                    ...(isMobile ? { padding: '12px 14px' } : {}),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    className={isMobile ? 'ma-card-top' : undefined}
                    style={!isMobile ? { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' } : undefined}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dz-color-charcoal)' }}>
                          {p.patientName || 'Unnamed Patient'}
                        </span>
                        <DentzyStatusPill type="payment" status={isPaid ? 'Paid' : 'Pending'} />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--dz-color-text-muted)', marginTop: '2px' }}>
                        {dentistName} {clinicName && `· ${clinicName}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isPaid ? '#15803d' : '#b45309' }}>
                        {formatINR(getOrderPrice(p))}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--dz-color-text-muted)' }}>
                        {formatDate(p.paidAt || (isPaid ? p.updatedAt : p.createdAt))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--dz-color-border-light)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DentzyCaseChip caseId={p.caseId} />
                      {p.paymentMode && (
                        <DentzyStatusPill type="mode" status={p.paymentMode} />
                      )}
                      {p.referenceNumber && (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--dz-color-text-muted)' }}>
                          #{p.referenceNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isPaid && onRecordPayment && (
                        <TwentyFirstIconButton
                          icon={Ico.creditCard(14)}
                          title="Record Payment"
                          ariaLabel="Record Payment"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordPayment(p);
                          }}
                          size={isMobile ? 'lg' : 'sm'}
                          variant="success"
                        />
                      )}
                      {onDeletePayment && (
                        <TwentyFirstIconButton
                          icon={Ico.trash(14)}
                          title="Delete Payment"
                          ariaLabel="Delete Payment"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePayment(pId);
                          }}
                          size={isMobile ? 'lg' : 'sm'}
                          variant="danger"
                        />
                      )}
                    </div>
                  </div>
                </DentzyCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
