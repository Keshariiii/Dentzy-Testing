'use client';
import React from 'react';
import { formatINR, formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import './PrintableInvoice.css';

/**
 * PrintableInvoice — Official Dentzy Dental Laboratory Tax Invoice & Statement.
 * Strictly Monochrome / Black & White matching Indian Tax Invoice & Cash Memo standards.
 * Ponytail: Supports both Paid Batch/Single Invoices and Unpaid Monthly Statements.
 * Strict SVG-only compliance: zero emojis or Unicode glyphs.
 */
export default function PrintableInvoice({
  payment = null,
  statement = null,
  items: directItems = null,
  dentist = null,
  onClose,
  isStandalone = false,
}) {
  const { user } = useAuth() || {};

  const isUnpaid =
    statement?.statementType === 'UNPAID_BILL' ||
    (statement?.status && statement.status !== 'Paid') ||
    (payment?.status && payment.status !== 'Paid');

  // Invoice Numbers & Dates
  const invoiceNumber =
    statement?.statementNumber ||
    statement?.batchId ||
    payment?.invoiceNumber ||
    `INV-${payment?.caseId || Date.now().toString(36).toUpperCase()}`;

  const orderNumber = payment?.caseId ? `DZ-${payment.caseId}` : (statement?.batchId || 'DZ-ORD-ONLINE');

  const rawDate = statement?.paidAt || payment?.paidAt || payment?.updatedAt || payment?.createdAt || new Date();
  const invoiceDate = formatDate(rawDate);
  const orderDate = formatDate(payment?.createdAt || rawDate);

  // Robust Dentist & Clinic Data Resolution (Check dentist prop -> statement -> payment owner -> logged-in user)
  const resolvedDentist =
    dentist ||
    statement?.dentist ||
    payment?.owner ||
    (user?.role !== 'admin' && user?.role !== 'staff' ? user : null);

  const doctorName =
    resolvedDentist?.name ||
    payment?.dentistName ||
    payment?.ownerName ||
    'Practitioner';

  const clinicName =
    resolvedDentist?.clinicName ||
    payment?.clinicName ||
    payment?.ownerClinicName ||
    '';

  const rawAddress =
    resolvedDentist?.address ||
    payment?.address ||
    '';

  // Only show address if dentist actually updated it (skip dummy defaults)
  const clinicAddress = rawAddress && !rawAddress.toLowerCase().includes('girnar darshan')
    ? rawAddress.trim()
    : (rawAddress.trim() || null);

  const doctorPhone =
    resolvedDentist?.phone ||
    payment?.phone ||
    payment?.ownerPhone ||
    '';

  // Normalize Line Items
  let lineItems = [];
  if (statement?.items && Array.isArray(statement.items)) {
    lineItems = statement.items;
  } else if (directItems && Array.isArray(directItems)) {
    lineItems = directItems;
  } else if (payment) {
    lineItems = [
      {
        caseId: payment.caseId,
        patientName: payment.patientName,
        description: payment.serviceType || payment.service || 'Dental Prosthetics Restoration',
        teeth: payment.teeth || payment.units || '',
        specs: payment.notes || 'Custom Dental Lab Prosthetics | 1-Year Lab Guarantee',
        hsn: '90212000',
        unitPrice: Number(payment.amount) || 0,
        discount: 0,
        qty: 1,
        netAmount: Number(payment.amount) || 0,
        taxRate: 0,
        taxType: 'GST Exempt',
        taxAmount: 0,
        total: Number(payment.amount) || 0,
      },
    ];
  } else {
    lineItems = [
      {
        description: 'Dental Prosthetics Restoration',
        teeth: '',
        specs: 'Custom Dental Lab Prosthetics | 1-Year Lab Guarantee',
        hsn: '90212000',
        unitPrice: 0,
        discount: 0,
        qty: 1,
        netAmount: 0,
        taxRate: 0,
        taxType: 'GST Exempt',
        taxAmount: 0,
        total: 0,
      },
    ];
  }

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.netAmount ?? item.amount) || 0), 0);
  const totalTax = lineItems.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0);
  const totalAmount = lineItems.reduce((acc, item) => acc + (Number(item.total ?? item.amount) || 0), 0);

  const paymentMode = statement?.paymentMode || payment?.paymentMode || (isUnpaid ? 'Direct Clearance / UPI' : 'Direct Clearance / UPI');
  const txnId = statement?.referenceNumber || payment?.referenceNumber || 'TXN-' + (payment?.caseId || Date.now().toString(36).toUpperCase());

  const handlePrint = () => {
    const el = document.getElementById('printable-invoice-root');
    if (!el) return;

    let css = '';
    try {
      css = Array.from(document.styleSheets)
        .flatMap(sheet => {
          try { return Array.from(sheet.cssRules); } catch { return []; }
        })
        .map(rule => rule.cssText)
        .join('\n');
    } catch { }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups for this site to download the PDF, or use your browser\'s Share -> Print option.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Dentzy ${isUnpaid ? 'Statement' : 'Invoice'}</title>
    <style>
      @page { size: A4 portrait; margin: 8mm 10mm; }
      html, body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; }
      ${css}
      .pi-backdrop { position: static !important; background: transparent !important; padding: 0 !important; display: block !important; }
      .pi-modal-shell { box-shadow: none !important; border: none !important; max-height: none !important; border-radius: 0 !important; display: block !important; }
      .pi-scroll-body { overflow: visible !important; background: transparent !important; padding: 0 !important; display: block !important; }
      .pi-paper { box-shadow: none !important; min-height: auto !important; }
      .no-print, .pi-screen-bar, .pi-screen-bar-standalone { display: none !important; }
    </style>
  </head>
  <body>
    ${el.outerHTML}
    <script>
      window.onload = function() {
        window.focus();
        window.print();
        setTimeout(function() { window.close(); }, 500);
      };
    <\/script>
  </body>
</html>`);
    printWindow.document.close();
  };

  const paperContent = (
    <div className="pi-paper" id="printable-invoice-root">
      {/* ── Top Header Section ───────────────────────────────────── */}
      <div className="pi-top-row">
        <div className="pi-brand-logo">
          <span className="pi-logo-text">dentzy</span><span className="pi-logo-sub">.in</span>
        </div>
        <div className="pi-title-block">
          <h2 className="pi-title">{isUnpaid ? 'Statement of Outstanding Dues / Unpaid Bill' : 'Tax Invoice/Bill of Supply/Cash Memo'}</h2>
          <div className="pi-recipient-type">{isUnpaid ? '(Statement of Amount Due)' : '(Original for Recipient)'}</div>
        </div>
      </div>

      {/* ── Sold By & Single Dentist Details Grid ───────────────── */}
      <div className="pi-address-grid">
        <div className="pi-col-soldby">
          <div className="pi-section-label">Sold By :</div>
          <div className="pi-bold-name">DENTZY DENTAL LABORATORY</div>
          <div>Dindayal Nagar, Vasai West,</div>
          <div>MAHARASHTRA, 401202</div>
          <div>IN</div>
          <div className="pi-meta-line"><strong>PAN No:</strong> AAICA3918J</div>
          <div className="pi-meta-line"><strong>GST Registration No:</strong> 27AAICA3918J1ZE</div>
        </div>

        {/* Unified Single Dentist Block — Checks data before rendering */}
        <div className="pi-col-billing">
          <div className="pi-section-label">Billed To (Doctor / Clinic) :</div>
          <div className="pi-bold-name">Dr. {doctorName}</div>
          {clinicName && <div className="pi-clinic-name">{clinicName}</div>}
          {clinicAddress ? (
            <div className="pi-dentist-address">{clinicAddress}</div>
          ) : null}
          {doctorPhone ? (
            <div className="pi-meta-line"><strong>Phone:</strong> {doctorPhone}</div>
          ) : null}
          <div className="pi-meta-line"><strong>Place of supply:</strong> MAHARASHTRA (27)</div>
          <div className="pi-meta-line"><strong>Place of delivery:</strong> MAHARASHTRA (27)</div>
        </div>
      </div>

      {/* ── Order & Invoice Details Bar ──────────────────────────── */}
      <div className="pi-order-info-row">
        <div className="pi-order-left">
          <div><strong>{isUnpaid ? 'Billing Period:' : 'Order Number:'}</strong> {isUnpaid ? (statement?.month || 'Current Cycle') : orderNumber}</div>
          <div><strong>{isUnpaid ? 'Statement Date:' : 'Order Date:'}</strong> {isUnpaid ? invoiceDate : orderDate}</div>
        </div>
        <div className="pi-order-right">
          <div><strong>{isUnpaid ? 'Statement Number :' : 'Invoice Number :'}</strong> {invoiceNumber}</div>
          <div><strong>Details :</strong> MH-{invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}-2627</div>
          <div><strong>Due Date :</strong> {isUnpaid ? 'Immediate / Upon Clearance' : invoiceDate}</div>
        </div>
      </div>

      {/* ── Clean Monochrome Line Items Table ─────────────────────── */}
      <div className="pi-table-wrap">
        <table className="pi-table">
          <thead>
            <tr>
              <th style={{ width: '32px' }}>Sl.<br />No</th>
              <th>Description</th>
              <th style={{ width: '68px', textAlign: 'right' }}>Unit<br />Price</th>
              <th style={{ width: '56px', textAlign: 'right' }}>Discount</th>
              <th style={{ width: '36px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '68px', textAlign: 'right' }}>Net<br />Amount</th>
              <th style={{ width: '42px', textAlign: 'center' }}>Tax<br />Rate</th>
              <th style={{ width: '48px', textAlign: 'center' }}>Tax<br />Type</th>
              <th style={{ width: '62px', textAlign: 'right' }}>Tax<br />Amount</th>
              <th style={{ width: '74px', textAlign: 'right' }}>Total<br />Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>
                  <div className="pi-item-title">
                    <strong>{item.caseId ? `${item.caseId} · ` : ''}{item.patientName ? `${item.patientName} — ` : ''}{item.description || item.service}</strong> {item.teeth ? `(${item.teeth})` : ''}
                  </div>
                  {item.specs && <div className="pi-item-desc">{item.specs}</div>}
                  <div className="pi-item-hsn">HSN:{item.hsn || '90212000'}</div>
                </td>
                <td style={{ textAlign: 'right' }}>{formatINR(item.unitPrice || item.amount || 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatINR(item.discount || 0)}</td>
                <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
                <td style={{ textAlign: 'right' }}>{formatINR(item.netAmount || item.amount || 0)}</td>
                <td style={{ textAlign: 'center' }}>{item.taxRate ?? 0}%</td>
                <td style={{ textAlign: 'center' }}>{item.taxType || 'CGST/SGST'}</td>
                <td style={{ textAlign: 'right' }}>{formatINR(item.taxAmount || 0)}</td>
                <td style={{ textAlign: 'right' }}><strong>{formatINR(item.total || item.amount || 0)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="pi-total-row">
              <td colSpan="8" style={{ textAlign: 'left', fontWeight: 'bold' }}>
                {isUnpaid ? 'TOTAL OUTSTANDING AMOUNT TO PAY:' : 'TOTAL:'}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalTax)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Amount in Words & Signatory ───────────────────────────── */}
      <div className="pi-words-and-sign">
        <div className="pi-words-col">
          <div className="pi-words-lbl"><strong>Amount in Words:</strong></div>
          <div className="pi-words-val">{formatINR(totalAmount)} {isUnpaid ? '(Total Outstanding Balance)' : '(Inclusive of all taxes)'}</div>
          <div className="pi-rc-text">Whether tax is payable under reverse charge - No</div>
        </div>

        <div className="pi-sign-col">
          <div className="pi-sign-title">For DENTZY DENTAL LABORATORY:</div>
          <div className="pi-sign-img-box">
            <img
              src="/images/founder-signature.png"
              alt="Authorized Signatory"
              className="pi-signature-img"
            />
          </div>
          <div className="pi-sign-lbl">Authorized Signatory</div>
        </div>
      </div>

      {/* ── Payment Transaction Grid ─────────────────────────────── */}
      <div className="pi-txn-grid">
        <div className="pi-txn-cell">
          <div className="pi-txn-lbl">{isUnpaid ? 'Clearance Status:' : 'Payment Transaction ID:'}</div>
          <div className="pi-txn-val">{isUnpaid ? 'Pending Lab Clearance' : txnId}</div>
        </div>
        <div className="pi-txn-cell">
          <div className="pi-txn-lbl">Date &amp; Time:</div>
          <div className="pi-txn-val">{invoiceDate}, 10:00:00 hrs</div>
        </div>
        <div className="pi-txn-cell pi-txn-val-box">
          <div className="pi-txn-lbl">{isUnpaid ? 'Amount Due:' : 'Invoice Value:'}</div>
          <div className="pi-txn-val-bold">{formatINR(totalAmount)}</div>
        </div>
        <div className="pi-txn-cell">
          <div className="pi-txn-lbl">Mode of Payment:</div>
          <div className="pi-txn-val">{isUnpaid ? 'Direct UPI / Cheque / Cash' : paymentMode}</div>
        </div>
      </div>

      {/* ── Official Fineprint / Footnote ─────────────────────────── */}
      <div className="pi-fineprint">
        <div>{isUnpaid ? 'Please clear outstanding dues promptly to maintain uninterrupted laboratory milling service.' : 'Please note that this invoice is not a demand for payment.'}</div>
        <div>Regd. Office: Dentzy Dental Laboratory, Dindayal Nagar, Vasai West, Maharashtra - 401202</div>
        <div>Telephone: +91 9503668112 | Email: support@dentzy.in | Website: dentzy-testing.pages.dev</div>
        <div>Dentzy Dental Laboratory LLP. Clinical dental prosthetics &amp; CAD/CAM milling services.</div>
        <div>Customers desirous of availing input GST credit are requested to provide clinic GSTIN at the time of placing orders.</div>
        <div className="pi-page-num">Page 1 of 1</div>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="pi-standalone-wrap">
        <div className="pi-screen-bar-standalone no-print">
          <button type="button" onClick={handlePrint} className="pi-btn-action pi-btn-primary">
            Download PDF / Print
          </button>
        </div>
        {paperContent}
      </div>
    );
  }

  return (
    <div className="pi-backdrop" onClick={onClose}>
      <div className="pi-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="pi-screen-bar no-print">
          <div className="pi-screen-title">
            <span>{isUnpaid ? 'Statement of Outstanding Dues' : 'Tax Invoice / Cash Memo'}</span>
          </div>
          <div className="pi-screen-actions">
            <button type="button" onClick={handlePrint} className="pi-btn-action pi-btn-primary">
              Print / PDF
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="pi-btn-action" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Close</span>
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
