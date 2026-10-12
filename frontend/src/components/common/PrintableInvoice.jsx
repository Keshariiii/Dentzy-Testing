'use client';
import React from 'react';
import { formatINR, formatDate } from '../../utils/format';
import { Icons as Ico } from '../common/DashboardIcons';
import './PrintableInvoice.css';

/**
 * PrintableInvoice — Official Dentzy Dental Laboratory Tax Invoice & Statement.
 * Includes official founder signature (Tanish Dinesh Poojari), letterhead,
 * itemized case breakdown, GST exemption notice (HSN 9021), and @media print support.
 *
 * @param {object} props
 * @param {object} [props.payment] - Single payment or order record
 * @param {object} [props.statement] - Multi-order batch statement object
 * @param {Array<object>} [props.items] - Direct line items array
 * @param {Function} props.onClose - Modal close handler
 * @param {boolean} [props.isStandalone=false] - When true, rendered without modal backdrop
 */
export default function PrintableInvoice({
  payment = null,
  statement = null,
  items: directItems = null,
  onClose,
  isStandalone = false,
}) {
  // Normalize statement or single payment data
  const isBatch = Boolean(statement || (directItems && directItems.length > 1));

  const docNumber =
    statement?.statementNumber ||
    statement?.batchId ||
    payment?.invoiceNumber ||
    (payment?.caseId ? `INV-${payment.caseId}` : `INV-${Date.now().toString(36).toUpperCase()}`);

  const docDate = formatDate(
    statement?.paidAt || payment?.paidAt || payment?.updatedAt || payment?.createdAt || new Date()
  );

  const doctorName =
    statement?.dentist?.name ||
    payment?.owner?.name ||
    payment?.dentistName ||
    'Registered Practitioner';

  const clinicName =
    statement?.dentist?.clinicName ||
    payment?.owner?.clinicName ||
    payment?.clinicName ||
    '';

  const clinicAddress =
    statement?.dentist?.address ||
    payment?.owner?.address ||
    'Maharashtra, India';

  const doctorPhone =
    statement?.dentist?.phone ||
    payment?.owner?.phone ||
    '';

  // Normalize line items
  let lineItems = [];
  if (statement?.items && Array.isArray(statement.items)) {
    lineItems = statement.items;
  } else if (directItems && Array.isArray(directItems)) {
    lineItems = directItems;
  } else if (payment) {
    lineItems = [
      {
        caseId: payment.caseId || '—',
        patientName: payment.patientName || 'Patient',
        service: payment.serviceType || payment.service || 'Dental Prosthetics',
        units: payment.teeth || payment.units || '1 unit',
        amount: Number(payment.amount) || 0,
      },
    ];
  }

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const discount = statement?.discount || 0;
  const totalPaid = Math.max(0, subtotal - discount);

  const paymentStatus =
    statement?.status ||
    payment?.paymentStatus ||
    payment?.status ||
    (payment?.paidAt ? 'Paid' : 'Pending');

  const isPaid = paymentStatus === 'Paid';
  const paymentMode = statement?.paymentMode || payment?.paymentMode || '';
  const referenceNumber = statement?.referenceNumber || payment?.referenceNumber || '';
  const notes = statement?.notes || payment?.notes || payment?.description || '';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `*DENTZY DENTAL LABORATORY*`,
      `*Official Invoice / Statement*`,
      `📄 Statement No: ${docNumber}`,
      `📅 Date: ${docDate}`,
      `👨‍⚕️ Billed To: Dr. ${doctorName}${clinicName ? ` (${clinicName})` : ''}`,
      `💰 Total Amount: ${formatINR(totalPaid)}`,
      `✅ Status: ${isPaid ? 'PAID' : 'PENDING'}`,
      paymentMode ? `💳 Mode: ${paymentMode}` : '',
      referenceNumber ? `🔖 Ref / UTR: ${referenceNumber}` : '',
      ``,
      `Authorized Signatory: Tanish Dinesh Poojari (Founder, Dentzy Lab)`,
      `Tel / WhatsApp: +91 9503668112 | support@dentzy.in`,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  const paperContent = (
    <div className="pi-paper" id="printable-invoice-root">
      {/* ── Official Letterhead Header ───────────────────────── */}
      <div className="pi-header">
        <div className="pi-brand-block">
          <h1 className="pi-brand-title">Dentzy Dental Laboratory</h1>
          <p className="pi-brand-subtitle">Advanced Digital Dental Prosthetics & CAD/CAM Milling Center</p>
          <div className="pi-brand-meta">
            <div>Dindayal Nagar, Vasai West - 401202, Maharashtra, India</div>
            <div>
              <strong>Tel / WhatsApp:</strong> +91 9503668112 &nbsp;|&nbsp; <strong>Email:</strong> support@dentzy.in
            </div>
            <div>
              <strong>GSTIN:</strong> 27AAAAA0000A1Z5 (Maharashtra) &nbsp;|&nbsp; <strong>Timings:</strong> 10:00 AM - 10:00 PM (Sun Closed)
            </div>
          </div>
        </div>

        <div className="pi-header-badge-col">
          <div className="pi-doc-type-badge">
            {isBatch ? 'Consolidated Tax Statement' : 'Official Lab Receipt'}
          </div>
          <div className="pi-doc-num">{docNumber}</div>
          <div className="pi-doc-date">Date: {docDate}</div>
        </div>
      </div>

      {/* ── Billed To & Payment Summary Meta ─────────────────── */}
      <div className="pi-meta-section">
        <div className="pi-billed-to">
          <div className="pi-section-label">Billed To (Doctor / Clinic)</div>
          <div className="pi-doctor-name">Dr. {doctorName}</div>
          {clinicName && <div className="pi-clinic-name">{clinicName}</div>}
          <div className="pi-doctor-sub">{clinicAddress}</div>
          {doctorPhone && <div className="pi-doctor-sub">Phone: {doctorPhone}</div>}
        </div>

        <div className="pi-payment-details-box">
          <div className="pi-section-label">Settlement Details</div>
          <div className="pi-pay-row">
            <span className="pi-pay-lbl">Status:</span>
            <span className="pi-pay-val" style={{ color: isPaid ? '#16a34a' : '#d97706' }}>
              {isPaid ? 'PAID' : 'PENDING CLEARANCE'}
            </span>
          </div>
          {paymentMode && (
            <div className="pi-pay-row">
              <span className="pi-pay-lbl">Mode:</span>
              <span className="pi-pay-val">{paymentMode}</span>
            </div>
          )}
          {referenceNumber && (
            <div className="pi-pay-row">
              <span className="pi-pay-lbl">Reference / UTR:</span>
              <span className="pi-pay-val" style={{ fontFamily: 'monospace' }}>{referenceNumber}</span>
            </div>
          )}
          {notes && (
            <div className="pi-pay-row">
              <span className="pi-pay-lbl">Notes:</span>
              <span className="pi-pay-val">{notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Itemized Table ────────────────────────────────────── */}
      <div className="pi-table-wrap">
        <table className="pi-table">
          <thead>
            <tr>
              <th className="pi-col-num">#</th>
              <th>Case ID</th>
              <th>Patient Name</th>
              <th>Service / Prosthetics</th>
              <th>Teeth / Units</th>
              <th className="pi-col-amount">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={item.caseId || idx}>
                <td className="pi-col-num">{idx + 1}</td>
                <td className="pi-col-case">{item.caseId}</td>
                <td><strong>{item.patientName || '—'}</strong></td>
                <td>{item.service || item.serviceType || 'Dental Prosthetics'}</td>
                <td>{item.units || item.teeth || '1 unit'}</td>
                <td className="pi-col-amount">{formatINR(item.amount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals & Stamp Block ──────────────────────────────── */}
      <div className="pi-summary-grid">
        <div className="pi-stamp-block">
          {isPaid && (
            <div className="pi-paid-stamp">
              <span className="pi-stamp-word">PAID</span>
              <span className="pi-stamp-sub">DENTZY LAB OFFICIAL</span>
            </div>
          )}
        </div>

        <div className="pi-totals-box">
          <div className="pi-total-line">
            <span>Subtotal:</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="pi-total-line" style={{ color: '#16a34a' }}>
              <span>Special Concession:</span>
              <span>- {formatINR(discount)}</span>
            </div>
          )}
          <div className="pi-total-line">
            <span>GST (0% Healthcare Exemption):</span>
            <span>₹0</span>
          </div>
          <div className="pi-total-line pi-total-line--final">
            <span>Total Settled:</span>
            <span>{formatINR(totalPaid)}</span>
          </div>
          <div className="pi-total-line" style={{ fontSize: '0.78rem', color: '#708c80', marginTop: '4px' }}>
            <span>Balance Due:</span>
            <span>{isPaid ? '₹0 (Cleared)' : formatINR(totalPaid)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer & Founder's Signature Block ────────────────── */}
      <div className="pi-footer">
        <div className="pi-terms-block">
          <div><strong>Quality Guarantee:</strong> All clinical prosthetics fabricated by Dentzy Dental Laboratory are backed by our 1-Year Laboratory Guarantee against material defects.</div>
          <div style={{ marginTop: '6px' }}>Prosthetics & appliances (HSN Code 9021) exempt under Indian healthcare regulations. Thank you for your continued clinical partnership!</div>
        </div>

        <div className="pi-signatory-block">
          <div className="pi-section-label">Authorized Lab Signatory</div>
          <div className="pi-signature-wrap">
            <img
              src="/images/founder-signature.png"
              alt="Signature of Tanish Dinesh Poojari"
              className="pi-signature-img"
              loading="eager"
            />
          </div>
          <div className="pi-signatory-name">Tanish Dinesh Poojari</div>
          <div className="pi-signatory-title">Founder & Managing Director</div>
          <div className="pi-signatory-lab">Dentzy Dental Laboratory</div>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="pi-standalone-wrap" style={{ padding: '20px', maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }} className="pi-screen-bar-standalone">
          <button type="button" onClick={handleShareWhatsApp} className="pi-btn-share">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm0 18.11c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31c-.83-1.32-1.27-2.86-1.27-4.43 0-4.51 3.67-8.18 8.18-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.51-3.67 8.18-8.18 8.18z"/>
            </svg>
            Share on WhatsApp
          </button>
          <button type="button" onClick={handlePrint} className="pi-btn-print">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Statement
          </button>
        </div>
        {paperContent}
      </div>
    );
  }

  return (
    <div className="pi-backdrop" onClick={onClose}>
      <div className="pi-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="pi-screen-bar">
          <div className="pi-screen-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>{isBatch ? 'Consolidated Monthly Statement' : 'Official Lab Receipt'}</span>
          </div>

          <div className="pi-screen-actions">
            <button type="button" onClick={handleShareWhatsApp} className="pi-btn-share" title="Share via WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm0 18.11c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.13.82.84-3.05-.2-.31c-.83-1.32-1.27-2.86-1.27-4.43 0-4.51 3.67-8.18 8.18-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.51-3.67 8.18-8.18 8.18z"/>
              </svg>
              Share WhatsApp
            </button>
            <button type="button" onClick={handlePrint} className="pi-btn-print">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="pi-btn-close" aria-label="Close invoice">
                {Ico.x(16)}
              </button>
            )}
          </div>
        </div>

        <div className="pi-scroll-body">
          {paperContent}
        </div>
      </div>
    </div>
  );
}
