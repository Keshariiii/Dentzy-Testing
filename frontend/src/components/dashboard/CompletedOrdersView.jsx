'use client';
import React, { useState, useMemo } from 'react';
import { Icons } from '../common/DashboardIcons';
import { StatusBadge } from '../ui/status-badge';
import EmptyState from '../common/EmptyState';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import { formatDate } from '../../utils/format';
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
              <span className="cov-count-pill">
                {Icons.checkCircle(14)}
                {completedOrders.length} {completedOrders.length === 1 ? 'case' : 'cases'}
              </span>
            </div>
            <p className="cov-subtitle">Cases that have cleared quality check and been dispatched</p>
          </div>
        </div>

        {/* Search input */}
        <div className="cov-search-wrap">
          <span className="cov-search-icon">{Icons.search(15)}</span>
          <input
            type="text"
            className="cov-search-input"
            placeholder="Search patient, case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="cov-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              {Icons.x(12)}
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="cov-skeleton-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="cov-skeleton-line" />
          ))}
        </div>
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
                {filteredOrders.map((o) => (
                  <tr
                    key={o._id}
                    className="cov-row"
                    onClick={() => onSelectOrder?.(o)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && onSelectOrder?.(o)}
                  >
                    <td>
                      <code className="cov-case-code">{o.caseId}</code>
                    </td>
                    <td>
                      <span className="cov-patient-name">{o.patientName}</span>
                    </td>
                    <td>
                      <span className="cov-service-label">{o.serviceType || 'Standard'}</span>
                    </td>
                    <td>{formatDate(o.completedDate || o.dueDate || o.updatedAt)}</td>
                    <td>
                      <StatusBadge status="completed" size="sm" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="cov-action-cta">
                        View Details {Icons.chevronRight(13)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Safe bottom spacer for mobile floating bottom navigation */}
      <div className="cov-bottom-spacer" />
    </div>
  );
}
