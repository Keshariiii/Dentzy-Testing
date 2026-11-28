'use client';
import React, { useState, useMemo } from 'react';
import { Skeleton } from '../Skeleton';
import { CompletedOrdersSkeleton } from '../SkeletonBlocks';
import { Icons } from '../common/DashboardIcons';
import { DentzyStatusPill, DentzyCaseChip } from '../common/DentzyCard';
import { DentzyDataTable } from '../common/DentzyChartTable';
import EmptyState from '../common/EmptyState';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import { formatDate } from '../../utils/format';
import DentzySearchBar from '../common/DentzySearchBar';
import './CompletedOrdersView.css';

/**
 * CompletedOrdersView — 21st.dev UI for Completed Lab Orders
 * Dedicated sub-view accessed exclusively by clicking the "Completed" stat card.
 *
 * Rules:
 * - Zero emojis (semantic SVG icons only)
 * - Elevation box shadows only (no colored border lines)
 * - Dentzy color palette only (#1e5038, #16a34a, #e8f5ee, #f4f6f5)
 * - Ponytail minimal code
 */
export default function CompletedOrdersView({
  orders = [],
  loading = false,
  onSelectOrder,
  onBack,
  isMobile = false,
}) {
  const [search, setSearch] = useState('');

  // Filter completed cases
  const completedOrders = useMemo(() => {
    return orders.filter(
      (o) => o?.status === 'Completed' || o?.stage === 'completed'
    );
  }, [orders]);

  // Apply search query
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completedOrders;
    return completedOrders.filter(
      (o) =>
        o?.patientName?.toLowerCase().includes(q) ||
        o?.caseId?.toLowerCase().includes(q) ||
        o?.serviceType?.toLowerCase().includes(q)
    );
  }, [completedOrders, search]);

  return (
    <div className="cov-container">
      {/* Header bar */}
      <div className="cov-header">
        <div className="cov-header-left">
          <TwentyFirstIconButton
            icon={Icons.arrowLeft(18)}
            title="Back to Dashboard Overview"
            ariaLabel="Back to Dashboard Overview"
            onClick={onBack}
            size="lg"
            variant="soft"
            rounded="md"
          />
          <div className="cov-title-wrap">
            <div className="cov-title-row">
              <h2 className="cov-title">Completed Orders</h2>
              {loading ? (
                <Skeleton width="64px" height="22px" borderRadius="999px" />
              ) : (
                <span className="cov-count-pill">
                  {Icons.checkCircle(14)}
                  {completedOrders.length} {completedOrders.length === 1 ? 'case' : 'cases'}
                </span>
              )}
            </div>
            <p className="cov-subtitle">Cases that have cleared quality check and been dispatched</p>
          </div>
        </div>

        {/* Search input */}
        <div style={{ flex: 1, maxWidth: '340px' }}>
          <DentzySearchBar
            placeholder="Search patient, case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <CompletedOrdersSkeleton />
      ) : completedOrders.length === 0 ? (
        <EmptyState
          variant="orders"
          message="No completed orders yet"
          subtext="Orders will appear here once quality check is passed and cases are dispatched."
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          variant="search"
          message="No matching completed cases"
          subtext="Try adjusting your search criteria to find the case."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="cov-table-card">
            <DentzyDataTable
              data={filteredOrders}
              onRowClick={(o) => onSelectOrder?.(o)}
              columns={[
                { key: 'caseId', header: 'Case ID', render: (o) => <DentzyCaseChip caseId={o.caseId} /> },
                { key: 'patientName', header: 'Patient Name', render: (o) => <span className="cov-patient-name">{o.patientName}</span> },
                { key: 'serviceType', header: 'Service Type', render: (o) => <span className="cov-service-label">{o.serviceType || 'Standard'}</span> },
                { key: 'completedDate', header: 'Completion Date', render: (o) => formatDate(o.completedDate || o.dueDate || o.updatedAt) },
                { key: 'status', header: 'Status', render: () => <DentzyStatusPill type="workflow" status="completed" label="Completed" /> },
                {
                  key: 'action',
                  header: 'Action',
                  align: 'right',
                  render: () => (
                    <span className="cov-action-cta">
                      View Details {Icons.chevronRight(13)}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="cov-mobile-list">
            {filteredOrders.map((o) => (
              <div
                key={o._id}
                className="cov-card"
                onClick={() => onSelectOrder?.(o)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === 'Enter' && onSelectOrder?.(o)}
              >
                <div className="cov-card-top">
                  <DentzyCaseChip caseId={o.caseId} />
                  <DentzyStatusPill type="workflow" status="completed" label="Completed" />
                </div>
                <div className="cov-card-main">
                  <div className="cov-card-info">
                    <span className="cov-card-patient">{o.patientName}</span>
                    <span className="cov-card-meta">
                      <span className="cov-card-service">{o.serviceType || 'Standard'}</span>
                      <span className="cov-card-dot">&bull;</span>
                      <span className="cov-card-date">{formatDate(o.completedDate || o.dueDate || o.updatedAt)}</span>
                    </span>
                  </div>
                  <span className="cov-card-arrow">
                    {Icons.chevronRight(16)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Safe bottom spacer for mobile floating bottom navigation */}
      <div className="cov-bottom-spacer" />
    </div>
  );
}
