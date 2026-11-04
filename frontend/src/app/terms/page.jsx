'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, ExternalLink, AlertTriangle, CheckCircle2, Scale, Mail, Phone, MapPin } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f5f2', color: '#1e2824', fontFamily: 'var(--font-dm-sans), sans-serif', paddingBottom: '60px' }}>
      {/* ── Top Navigation Bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#1e2824',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '14px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transition: 'background-color 0.2s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>← Back to Dentzy</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
            <span style={{ color: '#a3b8ae', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#708c80" />
              <span>Terms &amp; Conditions</span>
            </span>
            <Link
              href="/privacy"
              style={{
                color: '#a3bfb1',
                textDecoration: 'underline',
                textUnderlineOffset: '3px'
              }}
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main style={{ maxWidth: '960px', margin: '36px auto 0', padding: '0 20px' }}>
        {/* Header Hero Banner */}
        <div style={{
          backgroundColor: '#1e5038',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '36px 32px',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(30, 80, 56, 0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.18)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              <Scale size={13} /> Legal Documentation
            </span>
            <span style={{
              backgroundColor: '#a3bfb1',
              color: '#1e2824',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              B2B Clinical Platform
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.25 }}>
            Terms and Conditions of Use
          </h1>
          <p style={{ margin: 0, fontSize: '0.98rem', color: '#e2ece6', lineHeight: 1.5, maxWidth: '780px' }}>
            Governing access and clinical prosthetic laboratory orders for the <strong>Dentzy Clinical Lab Portal</strong>, operated by Namrata Dental Solutions / Dentzy Dental Laboratory LLP.
          </p>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.82rem', color: '#c5ddd2' }}>
            <div><strong>Last Updated:</strong> November 3, 2026</div>
            <div><strong>Effective For:</strong> Testing (<code>dentzy-testing.pages.dev</code>) &amp; Official (<code>dentzy.in</code>)</div>
            <div><strong>Jurisdiction:</strong> Maharashtra, India</div>
          </div>
        </div>

        {/* Content Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          lineHeight: 1.7,
          fontSize: '0.95rem',
          color: '#334155'
        }}>

          {/* Section 1 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              1. Entity Information &amp; Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>Dentzy</strong> (&quot;<strong>Dentzy</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, or &quot;<strong>our</strong>&quot;), a digital clinical dental laboratory ecosystem operated by <strong>Namrata Dental Solutions / Dentzy Dental Laboratory LLP</strong>, having its registered office at <strong>Dindayal Nagar, Vasai West, Vasai-Virar, Maharashtra – 401202, India</strong> (PAN: <code>AAICA3918J</code> | GSTIN: <code>27AAICA3918J1ZE</code>).
            </p>
            <p style={{ marginTop: '10px' }}>
              By accessing, registering on, or using the Dentzy website, clinical dentist dashboard, staff operations portal, or administrative portal (collectively, the &quot;<strong>Platform</strong>&quot;), you agree to be bound by these Terms and Conditions (&quot;<strong>Terms</strong>&quot;). If you do not agree to these Terms, please do not access or use the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              2. Testing / Beta Environment Notice
            </h2>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={18} />
                <span>Pre-Release Environment Disclaimer</span>
              </div>
              <p style={{ margin: 0, color: '#78350f', fontSize: '0.92rem' }}>
                You acknowledge that the Platform version hosted at <code>https://dentzy-testing.pages.dev</code> is a <strong>Testing / Staging Environment</strong> designed for workflow evaluation, quality assurance, and clinical pilot testing.
              </p>
            </div>
            <p>
              Automated emails and statements generated from the testing portal include a <code>[Sent from testing website]</code> notice. While we apply production-grade security controls (including encrypted transport, hashed passwords, and role-based access), data, test orders, or rate-card configurations in the testing environment may be modified, recalibrated, or reset during system upgrades without liability.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              3. Eligibility, Account Registration &amp; Admin Approval Gate
            </h2>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <strong>B2B Clinical Platform for Qualified Dentists:</strong> The Dentist Portal is intended exclusively for licensed dental practitioners, dental surgeons, prosthodontists, and authorized dental clinics (&quot;<strong>Dentists</strong>&quot;). By registering, you represent and warrant that you are a qualified dental professional authorized to practice dentistry and prescribe dental prosthetics under the Dentists Act, 1948 and applicable regulations.
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Verification &amp; Approval Gate:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                  <li>Dentist registration requires email verification via a 6-digit One-Time Password (OTP) or verified Google OAuth 2.0 authentication. Disposable or temporary email addresses are strictly prohibited.</li>
                  <li>All new Dentist registrations are placed in a <strong>Pending Approval (<code>pending</code>)</strong> state. Access to the clinical dashboard is granted only after review and approval by Dentzy Lab Administration.</li>
                  <li><strong>No Guarantee of Partnership or Capacity:</strong> Registration on Dentzy does not guarantee automatic approval or an exclusive partnership. Dentzy reserves the right to approve, reject, suspend, or terminate any account at its sole discretion based on verification or laboratory operational capacity.</li>
                </ul>
              </li>
              <li>
                <strong>Staff &amp; Executive Accounts:</strong> Laboratory staff accounts (<code>CEO</code>, <code>CTO</code>, <code>Receptionist</code>, <code>Ceramic</code>, <code>Acrylic</code>, <code>CAD/CAM</code>, <code>Milling</code>, <code>Sintering</code>, <code>3D Printing</code>, and <code>Delivery</code>) are provisioned exclusively by Dentzy Administration. Staff members must not share login credentials and may only access data and perform stage or billing actions authorized for their assigned designation.
              </li>
            </ol>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              4. Clinical Prescriptions, Orders &amp; Medical Disclaimer
            </h2>
            <p>
              <strong>Order Placement &amp; Intake:</strong> In the current Platform configuration, new laboratory orders (<code>Case ID: DZ-YYYYMMDD-XXXX</code>) are logged into the system by Dentzy Lab Administration or Reception Desk personnel based on physical impressions, digital STL scans, or prescriptions submitted by the Dentist.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #1e5038', padding: '14px 18px', margin: '14px 0', borderRadius: '0 8px 8px 0' }}>
              <div style={{ fontWeight: 700, color: '#1e2824', marginBottom: '6px' }}>Dentist&apos;s Sole Clinical Responsibility</div>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>
                Dentzy functions strictly as a custom dental laboratory manufacturer fabricating dental restorations (crowns, bridges, dentures, veneers, implants, retainers, orthodontic appliances) according to your clinical specifications.
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '0.92rem' }}>
                <li><strong>You (the Dentist) are solely and exclusively responsible for:</strong> (a) patient examination and diagnosis; (b) tooth preparation and margin integrity; (c) physical impression or digital STL scan accuracy; (d) Palmer quadrant tooth numbering (<code>UR1–8</code>, <code>UL1–8</code>, <code>LR1–8</code>, <code>LL1–8</code>), arch selection, clasp count, and shade specification; and (e) clinical try-in, occlusal adjustment, cementation, and post-operative care.</li>
                <li><strong>No Clinical Liability:</strong> Dentzy assumes no medical or clinical responsibility for treatment planning or the clinical outcome of the dental products inside the patient&apos;s oral cavity.</li>
              </ul>
            </div>
            <p>
              <strong>Patient Consent:</strong> Before providing a patient&apos;s name, tooth chart, or clinical notes to Dentzy, you confirm that you have obtained all necessary informed consents from your patient to share such case identifiers with our laboratory for prosthetic fabrication and delivery.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              5. Production Pipeline, Turnaround Times &amp; Delivery
            </h2>
            <p>
              <strong>Production Stages:</strong> Active cases are tracked through five standard laboratory stages: <code>Order Received</code> → <code>CAD Design</code> → <code>Milling / Production</code> → <code>Quality Check (QC)</code> → <code>Dispatched</code> → <code>Completed (Delivered)</code>.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Estimated Turnaround Windows:</strong>
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li><strong>Standard Cases:</strong> Typically 5 to 7 working days from physical impression or STL digital scan receipt.</li>
              <li><strong>Rush / Urgent Cases:</strong> Typically 2 to 3 working days (subject to prior laboratory confirmation).</li>
              <li><strong>Force Majeure &amp; Adjustments:</strong> In case of unforeseen circumstances, power or network outages, CAD/CAM milling calibration, or raw material delays beyond our reasonable control, expected delivery dates and times may be adjusted without prior notice.</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              <strong>Order Modifications &amp; Cancellations:</strong> Once a case has advanced beyond <code>Order Received</code> into <code>CAD Design</code> or <code>Milling / Production</code>, custom materials have been consumed and the order cannot be cancelled without incurring charges for work completed. Paid orders are locked from deletion in the portal (<code>PAID_ORDER_DELETION_BLOCKED</code>) unless first reviewed and reverted by Lab Administration.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              6. Pricing, ₹2,00,000 Credit Limit, Billing &amp; Direct Payments
            </h2>
            <p>
              <strong>Rate Card &amp; Custom Pricing:</strong> Unless a custom quote or administrative price override is applied, orders are billed in Indian Rupees (INR / ₹) according to the official Dentzy Rate Card based on material category, restoration type, and unit/arch/clasp count (including PFM, Ceramobond, White Metal, Zircon Zahn Metal Free, Heat-Cure Acrylic, Fibre/Lucitone Full Sets, RPD, Denture Repair, Teeth Addition, Orthoplate, Bleaching Trays, and Night Guards).
            </p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', margin: '14px 0' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>₹2,00,000 Clinic Credit Limit</div>
              <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.92rem' }}>
                Each approved Dentist account is subject to a maximum outstanding unpaid balance limit of <strong>₹2,00,000 (Rupees Two Lakhs Only)</strong> across all <code>Pending</code> and <code>Overdue</code> invoices. When your unpaid balance reaches or exceeds ₹2,00,000, new order intake is automatically paused (<code>CREDIT_LIMIT_EXCEEDED</code>) until outstanding dues are cleared, unless an explicit executive/administrative credit override is granted.
              </p>
            </div>
            <p>
              <strong>Accepted Payment Modes &amp; Verification:</strong>
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>Dentzy does not charge payment-gateway convenience fees on the Platform. Payments are accepted via <strong>Direct UPI transfer</strong> (to our official lab UPI ID/mobile), <strong>Cash</strong> (at the lab or via authorized collection), <strong>Cheque</strong> (drawn in favour of <em>Dentzy Dental Solutions</em> / <em>Dentzy Dental Laboratory</em>), or <strong>Bank Transfer (NEFT/IMPS)</strong>.</li>
              <li>For UPI, Bank Transfer, and Cheque settlements, a valid <strong>UTR / Transaction Reference Number</strong> (minimum 4 characters) or <strong>Cheque Number</strong> (minimum 3 characters) must be provided for verification before an order or consolidated monthly batch (<code>BATCH-...</code>) is marked as <code>Paid</code>.</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              <strong>Invoices &amp; GST:</strong> Official single-case invoices (<code>INV-...</code>), consolidated batch receipts (<code>BATCH-...</code>), and statements of outstanding dues (<code>BILL-...</code>) are generated under <strong>HSN Code 90212000</strong>. Clinics wishing to record their GSTIN on billing statements should notify Lab Administration at the time of onboarding or order placement.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              7. Limited Quality Guarantee
            </h2>
            <p>
              <strong>Warranty Coverage:</strong> Eligible dental restorations fabricated by Dentzy are backed by the <strong>Dentzy Quality Guarantee</strong> (as specified on your invoice and product tier, up to 5–10 years for qualifying monolithic zirconia/prosthetic restorations and 1 year for standard acrylic/auxiliary appliances) against manufacturing defects in laboratory materials or workmanship.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Exclusions:</strong> The warranty covers laboratory remake or repair of the prosthetic appliance only and does not cover:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>(a) Clinical chairside fees or consequential costs;</li>
              <li>(b) Failure due to improper tooth preparation, inadequate occlusal clearance, or faulty cementation;</li>
              <li>(c) Patient trauma, bruxism without a prescribed night guard, accidental dropping of removable dentures, or poor oral hygiene; or</li>
              <li>(d) Cases where the Dentist requested design modifications against laboratory technical advice.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              8. Scheduled Maintenance &amp; Platform Availability
            </h2>
            <p>
              Dentzy may temporarily restrict access to the Dentist Portal, Staff Portal, or both (<code>HTTP 503 Maintenance Mode</code>) to perform CAD/CAM server upgrades, database migrations, or security maintenance. During scheduled maintenance, your clinical records and orders remain completely safe, and urgent case inquiries can be directed to our Emergency Lab Hotline at <strong>+91 95036 68112</strong> or WhatsApp.
            </p>
          </section>

          {/* Section 9 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              9. Acceptable Use &amp; Security
            </h2>
            <p>
              You agree not to: (a) attempt to bypass rate limits, authentication cookies, or role restrictions; (b) submit false clinic credentials or use disposable email addresses; (c) scrape, reverse-engineer, or interfere with the Cloudflare Workers API or D1 database; or (d) upload unlawful, defamatory, or malicious content through the contact or clinical notes fields.
            </p>
          </section>

          {/* Section 10 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              10. Account Termination &amp; Self-Deletion
            </h2>
            <p>
              You may permanently delete your Dentist account at any time via <strong>Dashboard → Settings → Delete Account</strong> by confirming your password, subject to settlement of any outstanding laboratory dues. Dentzy may suspend or terminate accounts that violate these Terms or remain delinquent on outstanding bills.
            </p>
          </section>

          {/* Section 11 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              11. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising out of or relating to these Terms or laboratory services shall be subject to the exclusive jurisdiction of the competent courts in <strong>Vasai-Virar / Palghar District, Maharashtra, India</strong>.
            </p>
          </section>

          {/* Section 12 */}
          <section style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              12. Contact &amp; Grievance Support
            </h2>
            <p style={{ marginBottom: '16px' }}>
              For order inquiries, billing support, or legal notices, please reach out to our official administrative desk:
            </p>

            <div style={{
              backgroundColor: '#f8faf9',
              border: '1px solid #d1ded7',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e5038', fontSize: '1rem', marginBottom: '6px' }}>
                  Dentzy by Namrata Dental Solutions
                </div>
                <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '4px' }}>
                  Dentzy Dental Laboratory LLP
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: '#334155', marginTop: '8px' }}>
                  <MapPin size={16} color="#708c80" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Dindayal Nagar, Vasai West, Vasai-Virar, Maharashtra – 401202, India</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#334155', marginBottom: '8px' }}>
                  <Phone size={16} color="#708c80" />
                  <span><strong>Hotline / WhatsApp:</strong> +91 95036 68112</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#334155', marginBottom: '8px' }}>
                  <Mail size={16} color="#708c80" />
                  <span><strong>Email:</strong> <a href="mailto:support@dentzy.in" style={{ color: '#1e5038', textDecoration: 'underline' }}>support@dentzy.in</a></span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Support Hours: Mon–Sat, 9:00 AM – 6:00 PM IST
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Back Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#1e5038',
              fontWeight: 600,
              fontSize: '0.92rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} /> Return to Dentzy Home
          </Link>
        </div>
      </main>
    </div>
  );
}
