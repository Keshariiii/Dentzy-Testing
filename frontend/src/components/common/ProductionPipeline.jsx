/**
 * ProductionPipeline — Unified, responsive production pipeline component.
 * Ponytail: one component replaces LabTimeline + PipelineRow (desktop)
 * and MobilePipeline + MobilePipelineRow (mobile). Zero duplication.
 * Multiple pipelines use horizontal scroll-snap — native CSS, no JS lib.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PIPELINE_STEPS, PIPELINE_STAGES } from '../dashboard/shared/constants';
import './ProductionPipeline.css';

/* ── Single Pipeline Row (step icons + connectors) ─────────────────────────── */
const PipelineSteps = ({ order }) => {
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
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
  const [showAll, setShowAll] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef(null);

  const inProgress = stats?.orders?.inProgress ?? 0;
  const unfinished = orders?.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled') || [];

  // When collapsed: show just the first; expanded with multiple: show all in scroll
  const displayOrders = showAll ? unfinished : [unfinished[0] || orders?.[0]];
  const hasMultiple = unfinished.length > 1;
  const isMultiCard = showAll && hasMultiple;

  // Track scroll position for dot indicator
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !isMultiCard) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const idx = Math.round(el.scrollLeft / (cardWidth + 16));
    setActiveDot(idx);
  }, [isMultiCard]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2h6l3 7H6L9 2zM5 9h14v13a2 2 0 01-2 2H7a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <p>No active orders in the pipeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Scrollable row when expanded; single card when collapsed */}
      <div
        className={isMultiCard ? 'pp-scroll-container' : ''}
        ref={scrollRef}
      >
        {displayOrders.map((order, index) => (
          <div
            key={order?._id || order?.id || index}
            className={`pp-card ${isMultiCard ? 'pp-card--multi' : 'pp-card--single'}`}
          >
            <div className="pp-header">
              <div>
                <h3 className="pp-title">Production Pipeline</h3>
                <p className="pp-sub">
                  {order
                    ? `Case ${order.caseId} \u2022 ${order.patientName}${order.serviceType ? ` (${order.serviceType})` : ''}`
                    : 'Live status of your active lab cases'}
                </p>
              </div>
              <div className="pp-hdr-right">
                {index === 0 && inProgress > 0 && (
                  <span className="pp-live-pill">
                    <span className="pp-pulse-dot" />
                    {inProgress} In Progress
                  </span>
                )}
                {index === 0 && hasMultiple && (
                  <button
                    className="pp-toggle-btn"
                    onClick={() => { setShowAll(v => !v); setActiveDot(0); }}
                  >
                    {showAll ? 'View Less' : `View All (${unfinished.length})`}
                  </button>
                )}
              </div>
            </div>
            <PipelineSteps order={order} />
          </div>
        ))}
      </div>

      {/* Dot indicators for horizontal scroll */}
      {isMultiCard && unfinished.length > 1 && (
        <div className="pp-dots">
          {unfinished.map((_, i) => (
            <div key={i} className={`pp-dot ${i === activeDot ? 'pp-dot--active' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionPipeline;
