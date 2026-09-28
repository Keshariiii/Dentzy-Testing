# Production Pipeline Redesign Plan

**Date:** 2026-09-28
**Context:** Redesigning the Production Pipeline to gracefully handle multiple cases across PC and mobile.
**Guiding Principles:** 
- **Impeccable:** Premium aesthetics, micro-animations (pulse on active), elegant gradients, high-density but clean layout.
- **Ponytail:** One responsive component for all platforms (no separate mobile/desktop files), no new JS dependencies, native CSS scroll-snapping for multiple pipelines.

## 1. Architectural Strategy (Ponytail)
- **Problem:** Currently, the pipeline is duplicated in `DentistDashboard.jsx` (`LabTimeline`, `PipelineRow`) and `MobileDashboard.jsx` (`MobilePipeline`, `MobilePipelineRow`). When multiple pipelines are shown, they stack vertically, pushing all other dashboard content down.
- **Solution:** 
  - Create a single, unified component: `frontend/src/components/common/ProductionPipeline.jsx`.
  - Create a single CSS file: `ProductionPipeline.css` using media queries for responsiveness.
  - Handle multiple pipelines using a **horizontal scrolling card list** (`overflow-x: auto; scroll-snap-type: x mandatory`). This keeps the vertical height fixed and predictable, regardless of having 1 or 10 active cases.

## 2. Component Design (Impeccable)
### The Pipeline Card
Each active order gets its own card in the horizontal scroll view.
- **Header:** Case ID, Patient Name, Service Type, and a "Due: [Date]" badge.
- **The Timeline:**
  - **Past Stages:** Solid green circle with a white checkmark. Connecting lines are solid green.
  - **Current Stage:** Slightly larger circle, brand color (e.g., Purple/Blue), with a subtle CSS `@keyframes pulse` animation on the outer ring to indicate live activity.
  - **Future Stages:** Hollow circles with gray borders. Connecting lines are dashed gray.
- **Responsiveness:** 
  - On PC: Full labels below each circle.
  - On Mobile: Labels are smaller, spacing is condensed.

## 3. Implementation Steps

### Task 1: Create the Unified Component
- **File:** `frontend/src/components/common/ProductionPipeline.jsx`
- **File:** `frontend/src/components/common/ProductionPipeline.css`
- **Action:** Build the component that takes an array of `orders`. Render a horizontally scrollable container. Map over the orders to render individual pipeline cards.

### Task 2: Replace in Dentist Dashboard (PC)
- **File:** `frontend/src/components/DentistDashboard.jsx`
- **Action:** Delete the inline `LabTimeline` and `PipelineRow` components. Import and drop in `<ProductionPipeline orders={activeOrders} />`. Remove the old "View More" vertical expansion logic.

### Task 3: Replace in Mobile Dashboard (Mobile)
- **File:** `frontend/src/views/mobile/MobileDashboard.jsx`
- **Action:** Delete `MobilePipeline` and `MobilePipelineRow`. Import and drop in `<ProductionPipeline orders={activeOrders} />`.

### Task 4: Polish & Review
- Verify native CSS scroll snapping feels good on touch devices.
- Verify the pulse animation looks premium and not distracting.
- Ensure the empty state (no active pipelines) looks elegant (a quiet, beautifully typed empty state card).

## Next Steps
Wait for user approval to begin execution.
