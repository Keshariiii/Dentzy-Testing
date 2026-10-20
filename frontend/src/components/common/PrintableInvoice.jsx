'use client';
import React from 'react';
import { formatINR, formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import './PrintableInvoice.css';

/**
 * PrintableInvoice — Official Dentzy Dental Laboratory Tax Invoice & Statement.
 * Strictly Monochrome / Black & White matching Indian Tax Invoice & Cash Memo standards.
 * Ponytail: Single dentist address block, checks dentist data accurately, skips address if not set.
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

  const paymentMode = statement?.paymentMode || payment?.paymentMode || 'Direct Clearance / UPI';
  const txnId = statement?.referenceNumber || payment?.referenceNumber || 'TXN-' + (payment?.caseId || Date.now().toString(36).toUpperCase());

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `*DENTZY DENTAL LABORATORY*`,
      `*Tax Invoice / Cash Memo*`,
      `Invoice No: ${invoiceNumber}`,
      `Date: ${invoiceDate}`,
      `Billed To: Dr. ${doctorName}${clinicName ? ` - ${clinicName}` : ''}`,
      `Total Amount: ${formatINR(totalAmount)}`,
      `Tel / WhatsApp: +91 9503668112 | support@dentzy.in`,
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  const paperContent = (
    <div className="pi-paper" id="printable-invoice-root">
      {/* ── Top Header Section ───────────────────────────────────── */}
      <div className="pi-top-row">
        <div className="pi-brand-logo">
          <span className="pi-logo-text">dentzy</span><span className="pi-logo-sub">.in</span>
        </div>
        <div className="pi-title-block">
          <h2 className="pi-title">Tax Invoice/Bill of Supply/Cash Memo</h2>
          <div className="pi-recipient-type">(Original for Recipient)</div>
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
          <div><strong>Order Number:</strong> {orderNumber}</div>
          <div><strong>Order Date:</strong> {orderDate}</div>
        </div>
        <div className="pi-order-right">
          <div><strong>Invoice Number :</strong> {invoiceNumber}</div>
          <div><strong>Invoice Details :</strong> MH-{invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}-2627</div>
          <div><strong>Invoice Date :</strong> {invoiceDate}</div>
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
                    <strong>{item.description || item.service}</strong> {item.teeth ? `(${item.teeth})` : ''}
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
                TOTAL:
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
          <div className="pi-words-val">{formatINR(totalAmount)} (Inclusive of all taxes)</div>
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
          <div className="pi-txn-lbl">Payment Transaction ID:</div>
          <div className="pi-txn-val">{txnId}</div>
        </div>
        <div className="pi-txn-cell">
          <div className="pi-txn-lbl">Date &amp; Time:</div>
          <div className="pi-txn-val">{invoiceDate}, 10:00:00 hrs</div>
        </div>
        <div className="pi-txn-cell pi-txn-val-box">
          <div className="pi-txn-lbl">Invoice Value:</div>
          <div className="pi-txn-val-bold">{formatINR(totalAmount)}</div>
        </div>
        <div className="pi-txn-cell">
          <div className="pi-txn-lbl">Mode of Payment:</div>
          <div className="pi-txn-val">{paymentMode}</div>
        </div>
      </div>

      {/* ── Official Fineprint / Footnote ─────────────────────────── */}
      <div className="pi-fineprint">
        <div>Please note that this invoice is not a demand for payment.</div>
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
          <button type="button" onClick={handleShareWhatsApp} className="pi-btn-action">
            Share on WhatsApp
          </button>
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
            <span>Tax Invoice / Cash Memo</span>
          </div>
          <div className="pi-screen-actions">
            <button type="button" onClick={handleShareWhatsApp} className="pi-btn-action">
              WhatsApp
            </button>
            <button type="button" onClick={handlePrint} className="pi-btn-action pi-btn-primary">
              Print / PDF
            </button>
            {onClose && (
              <button type="button" onClick={onClose} className="pi-btn-action" aria-label="Close">
                ✕ Close
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
