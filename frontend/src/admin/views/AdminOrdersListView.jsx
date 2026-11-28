'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import { formatINR, formatDate, formatDoctorName } from '../../utils/format';
import { getOrderPrice } from '../../utils/pricing';
import { DentzyCard, DentzyCaseChip, DentzyStatusPill } from '../../components/common/DentzyCard';
import SubViewHeader from '../../components/common/SubViewHeader';
import TwentyFirstIconButton from '../../components/ui/twentyfirst-icon-button';

const ORDER_STAGES = [
  'received',
  'design',
  'production',
  'qc',
  'dispatched',
  'completed',
];

const ORDER_TABS = ['all', 'In Progress', 'Pending', 'Completed', 'Cancelled'];

export default function AdminOrdersListView({
  allOrders,
  filteredOrders,
  loadingOrders,
  orderFilter,
  setOrderFilter,
  orderSearch,
  setOrderSearch,
  onSelectOrder,
  onStageChange,
  onUpdateAmount,
  onDeleteOrder,
  drillDentistOrders,
  setDrillDentistOrders,
  isMobile = false,
  onBack,
}) {
  return (
    <div className="admin-orders-view-root">
      {drillDentistOrders ? (
        <SubViewHeader
          title={formatDoctorName(drillDentistOrders.name, 'Dentist')}
          subtitle={drillDentistOrders.clinicName || undefined}
          onBack={() => {
            setDrillDentistOrders(null);
            setOrderFilter('all');
            setOrderSearch('');
          }}
          backLabel="Back to all orders"
          style={{ padding: isMobile ? '12px 16px 0' : '0 0 4px 0', marginBottom: '12px' }}
        />
      ) : (
        <SubViewHeader
          title="Lab Orders"
          count={filteredOrders.length}
          onBack={isMobile && onBack ? onBack : undefined}
          backLabel="Back"
          style={{ padding: isMobile ? '12px 16px 0' : 0, marginBottom: '12px' }}
        />
      )}

      {/* Filter Status Selector */}
      <div className={isMobile ? 'ma-tabs-wrap' : 'ad-controls'} style={{ padding: isMobile ? '0 16px' : '0', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--dz-color-primary-dark)' }}>{Ico.filter(18)}</span>
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className={isMobile ? 'ma-sort-select' : 'ad-sort-select'}
            style={{ fontWeight: 600 }}
          >
            {ORDER_TABS.map((st) => (
              <option key={st} value={st}>
                {st === 'all' ? 'All Orders' : st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className={isMobile ? 'ma-main' : 'ad-content'}>
        {loadingOrders ? (
          <div className={isMobile ? 'ma-loading' : 'ad-loading'}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={isMobile ? 'ma-skeleton-card' : 'ad-skeleton-card'} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            variant="orders"
            message="No lab orders found"
            subtext="Orders will appear here once submitted by dentists or staff."
          />
        ) : (
          <div className={isMobile ? 'ma-order-list' : 'ad-user-list'} style={!isMobile ? { gap: '12px' } : undefined}>
            {filteredOrders.map((order) => {
              const oId = order._id || order.id || order.caseId;
              const dentistName = formatDoctorName(order.owner?.name || order.dentistName, '—');
              const clinicName = order.owner?.clinicName || order.clinicName || '';

              return (
                <DentzyCard
                  key={oId}
                  interactive
                  onClick={() => onSelectOrder(order)}
                  style={{
                    ...(isMobile ? { padding: '12px 14px' } : {}),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    className={isMobile ? 'ma-card-top' : undefined}
                    style={!isMobile ? { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' } : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <DentzyCaseChip caseId={order.caseId || 'Order'} />
                      <DentzyStatusPill type="workflow" status={order.status || 'Pending'} />
                      {order.priority && order.priority !== 'Normal' && (
                        <DentzyStatusPill type="priority" status={order.priority} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dz-color-text-muted)' }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dz-color-text-primary)' }}>
                      {order.patientName || 'Unnamed Patient'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--dz-color-text-muted)' }}>
                      {dentistName} {clinicName && `· ${clinicName}`}
                    </div>
                  </div>

                  {/* Stage & Details Row */}
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--dz-color-border-light)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--dz-color-text-muted)' }}>Stage:</span>
                      <select
                        value={order.stage || 'received'}
                        onChange={(e) => onStageChange?.(oId, e.target.value)}
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          padding: '3px 8px',
                          border: '1px solid var(--dz-color-border)',
                          background: '#fff',
                          minHeight: isMobile ? '44px' : undefined,
                        }}
                      >
                        {ORDER_STAGES.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg.charAt(0).toUpperCase() + stg.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dz-color-primary-accent)' }}>
                        {formatINR(getOrderPrice(order))}
                      </span>
                      {onDeleteOrder && (
                        <TwentyFirstIconButton
                          icon={Ico.trash(14)}
                          title="Delete Order"
                          ariaLabel="Delete Order"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOrder(oId);
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
