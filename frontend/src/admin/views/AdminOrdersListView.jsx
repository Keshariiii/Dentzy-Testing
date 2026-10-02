'use client';
import React from 'react';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import EmptyState from '../../components/common/EmptyState';
import { formatINR, formatDate } from '../../utils/format';

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
      {/* Mobile Back to Landing */}
      {isMobile && onBack && !drillDentistOrders && (
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
      {drillDentistOrders ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}>
          <button
            onClick={() => {
              setDrillDentistOrders(null);
              setOrderFilter('all');
              setOrderSearch('');
            }}
            aria-label="Back to all orders"
            title="Back to all orders"
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
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a3028' }}>{drillDentistOrders.name}</div>
            {drillDentistOrders.clinicName && (
              <div style={{ fontSize: '0.8rem', color: '#708c80' }}>{drillDentistOrders.clinicName}</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: isMobile ? '0 16px' : '0 0 12px 0', marginBottom: '8px' }}>
          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Lab Orders
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--dz-color-primary-muted)', color: 'var(--dz-color-primary-dark)', padding: '2px 8px', borderRadius: '12px' }}>
              {filteredOrders.length}
            </span>
          </h2>
        </div>
      )}

      {/* Search Bar */}
      <div className={isMobile ? 'ma-search-wrap' : 'ad-search-wrap'} style={{ marginBottom: '12px' }}>
        <div className={isMobile ? 'ma-search-bar' : 'ad-search-bar'}>
          {Ico.search(14)}
          <input
            type="text"
            className={isMobile ? 'ma-search-input' : 'ad-search-input'}
            placeholder="Search patient, case ID, dentist..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
          />
          {orderSearch && (
            <button
              className={isMobile ? 'ma-search-clear' : 'ad-search-clear'}
              onClick={() => setOrderSearch('')}
              aria-label="Clear search"
            >
              {Ico.x(12)}
            </button>
          )}
        </div>
      </div>

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
          <div className={isMobile ? 'ma-order-list' : 'ad-orders-list'}>
            {filteredOrders.map((order) => {
              const oId = order._id || order.id || order.caseId;
              const dentistName = order.owner?.name || order.dentistName || '—';
              const clinicName = order.owner?.clinicName || order.clinicName || '';

              return (
                <div
                  key={oId}
                  className={isMobile ? 'ma-card' : 'ad-order-card'}
                  onClick={() => onSelectOrder(order)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={isMobile ? 'ma-card-top' : 'ad-order-header'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="odm-case-badge" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {order.caseId || 'Order'}
                      </span>
                      <span className={`odm-status-pill odm-status--${(order.status || 'pending').toLowerCase()}`}>
                        {order.status || 'Pending'}
                      </span>
                      {order.priority && order.priority !== 'Normal' && (
                        <span className={`odm-priority-pill odm-priority--${order.priority.toLowerCase()}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dz-color-text-muted)' }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dz-color-text-primary)' }}>
                      {order.patientName || 'Unnamed Patient'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--dz-color-text-muted)' }}>
                      {dentistName} {clinicName && `· ${clinicName}`}
                    </div>
                  </div>

                  {/* Stage & Details Row */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--dz-color-border-light)', paddingTop: '10px' }}>
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
                        {order.amount > 0 ? formatINR(order.amount) : '₹0'}
                      </span>
                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOrder(oId);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete Order"
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
