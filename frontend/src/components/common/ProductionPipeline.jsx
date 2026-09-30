/**
 * ProductionPipeline — Unified, responsive production pipeline component.
 * Ponytail: one component replaces LabTimeline + PipelineRow (desktop)
 * and MobilePipeline + MobilePipelineRow (mobile). Zero duplication.
 *
 * Shows a single pipeline card on the dashboard overview.
 * "View All" redirects to /dashboard/pipeline for the full list.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { PIPELINE_STEPS, PIPELINE_STAGES } from '../dashboard/shared/constants';
import { Check, Package } from 'lucide-react';
import './ProductionPipeline.css';

/* ── Single Pipeline Row (step icons + connectors) ─────────────────────────── */
export const PipelineSteps = ({ order }) => {
  const activeIdx = order ? PIPELINE_STAGES.indexOf(order.stage) : -1;
  const isCompleted = order?.stage === 'completed';

  return (
    <div className="pp-steps">
      {PIPELINE_STEPS.map((step, idx) => {
        const isPast = (activeIdx >= 0 && idx < activeIdx) || isCompleted;
        const isCurrent = idx === activeIdx && !isCompleted;
        const cls = isPast ? 'pp-step--past' : isCurrent ? 'pp-step--current' : 'pp-step--future';

        return (
          <React.Fragment key={step.key}>
            <div className={`pp-step ${cls}`}>
              <div className="pp-step-icon">
                {isPast ? (
                  <Check size={15} strokeWidth={3} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.iconD} />
                  </svg>
                )}
              </div>
              <span className="pp-step-label">{step.labelDesktop || step.label}</span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`pp-connector${isPast ? ' pp-connector--filled' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────────────────── */
const ProductionPipeline = ({ stats, orders, onViewOrders }) => {
  const router = useRouter();

  const inProgress = stats?.orders?.inProgress ?? 0;
  const unfinished = orders?.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled') || [];
  const displayOrder = unfinished[0] || orders?.[0];
  const hasMultiple = unfinished.length > 1;

  // No orders at all
  if (!orders?.length) {
    return (
      <div className="pp-card pp-card--single">
        <div className="pp-header">
          <div>
            <h3 className="pp-title">Production Pipeline</h3>
            <p className="pp-sub">Live status of your active lab cases</p>
          </div>
        </div>
        <div className="pp-empty">
          <div className="pp-empty-icon">
            <Package size={36} strokeWidth={1.5} />
          </div>
          <p>No active orders in the pipeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-card pp-card--single">
      <div className="pp-header">
        <div>
          <h3 className="pp-title">Production Pipeline</h3>
          <p className="pp-sub">
            {displayOrder
              ? `Case ${displayOrder.caseId} \u2022 ${displayOrder.patientName}${displayOrder.serviceType ? ` (${displayOrder.serviceType})` : ''}`
              : 'Live status of your active lab cases'}
          </p>
        </div>
        <div className="pp-hdr-right">
          {inProgress > 0 && (
            <span className="pp-live-pill">
              <span className="pp-pulse-dot" />
              {inProgress} In Progress
            </span>
          )}
          {hasMultiple && (
            <button
              className="pp-toggle-btn"
              onClick={() => router.push('/dashboard/pipeline')}
            >
              View All ({unfinished.length})
            </button>
          )}
        </div>
      </div>
      <PipelineSteps order={displayOrder} />
    </div>
  );
};

export default ProductionPipeline;
