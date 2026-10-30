/**
 * Dashboard Constants — Shared between PC and Mobile dashboards.
 *
 * Single source of truth for ticker messages, pipeline stages,
 * and other data used by both DentistDashboard and MobileDashboard.
 */

// ── Ticker banner messages ────────────────────────────────────────
export const TICKER_MESSAGES = [
  'Welcome to Dentzy Clinical Lab Portal',
  'Standard turnaround: 5-7 working days  |  Rush: 2-3 working days',
  'New: Zirconia monolithic crowns with multi-shade gradients now available',
  'Submit STL files for faster digital impression processing',
  'Invoices are generated upon case dispatch — check the Payments tab',
  'All cases backed by the Dentzy 1-Year Quality Guarantee',
  'Lab support: Mon-Sat, 9 AM to 6 PM IST',
];

// ── Production pipeline stages ────────────────────────────────────
export const PIPELINE_STAGES = ['received', 'design', 'production', 'qc', 'dispatched', 'completed'];

export const PIPELINE_STEPS = [
  { key: 'received',   label: 'Received',      labelDesktop: 'Order\nReceived',     iconD: 'M9 2h6l3 7H6L9 2zM5 9h14v13a2 2 0 01-2 2H7a2 2 0 01-2-2V9z' },
  { key: 'design',     label: 'CAD Design',    labelDesktop: 'CAD\nDesign',         iconD: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'production', label: 'Milling',       labelDesktop: 'Milling /\nPrinting', iconD: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { key: 'qc',         label: 'QC',            labelDesktop: 'Quality\nCheck',      iconD: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  { key: 'dispatched', label: 'Dispatched',    labelDesktop: 'Dispatched',          iconD: 'M5 12h14M12 5l7 7-7 7' },
];

// ── Nav items (desktop sidebar) ───────────────────────────────────
export const NAV_KEYS = {
  DASHBOARD: 'dashboard',
  ORDERS:    'orders',
  PAYMENTS:  'payments',
  SETTINGS:  'settings',
};
