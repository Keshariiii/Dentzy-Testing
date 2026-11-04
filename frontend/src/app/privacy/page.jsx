'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, ExternalLink, AlertTriangle, CheckCircle2, UserCheck, Database, Server, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPage() {
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
            <Link
              href="/terms"
              style={{
                color: '#a3bfb1',
                textDecoration: 'underline',
                textUnderlineOffset: '3px'
              }}
            >
              ← Terms &amp; Conditions
            </Link>
            <span style={{ color: '#a3b8ae', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} color="#708c80" />
              <span>Privacy Policy</span>
            </span>
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
              <Lock size={13} /> Data Protection &amp; Privacy
            </span>
            <span style={{
              backgroundColor: '#a3bfb1',
              color: '#1e2824',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              DPDP Act 2023 Compliant
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.25 }}>
            Privacy Policy
          </h1>
          <p style={{ margin: 0, fontSize: '0.98rem', color: '#e2ece6', lineHeight: 1.5, maxWidth: '780px' }}>
            How Dentzy by Namrata Dental Solutions / Dentzy Dental Laboratory LLP collects, protects, processes, and respects clinical and personal data in compliance with India&apos;s <strong>Digital Personal Data Protection Act, 2023</strong> and the <strong>Information Technology Rules, 2011</strong>.
          </p>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.82rem', color: '#c5ddd2' }}>
            <div><strong>Last Updated:</strong> November 3, 2026</div>
            <div><strong>Effective For:</strong> Testing (<code>dentzy-testing.pages.dev</code>) &amp; Official (<code>dentzy.in</code>)</div>
            <div><strong>Statutory Law:</strong> India DPDP Act 2023 &amp; IT Act 2000</div>
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
              1. Introduction &amp; Regulatory Roles
            </h2>
            <p>
              <strong>Dentzy by Namrata Dental Solutions / Dentzy Dental Laboratory LLP</strong> (&quot;<strong>Dentzy</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, or &quot;<strong>our</strong>&quot;) respects your privacy and is committed to protecting personal and clinical data in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong> (including the IT Rules, 2011).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '16px 0' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, marginBottom: '6px' }}>
                  <UserCheck size={18} />
                  <span>Dentzy as Data Fiduciary</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#14532d' }}>
                  For personal and practice registration data of registered <strong>Dentists</strong>, <strong>Website Visitors</strong>, and <strong>Laboratory Staff</strong>, Dentzy acts as the <strong>Data Fiduciary</strong> determining the purpose and means of data processing.
                </p>
              </div>

              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 700, marginBottom: '6px' }}>
                  <Database size={18} />
                  <span>Dentzy as Data Processor (Patient Data)</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e3a8a' }}>
                  When a Dentist submits patient names, tooth quadrant numbers, and clinical restoration notes for custom appliance manufacturing, the <strong>Dentist / Clinic is the Data Fiduciary</strong> and <strong>Dentzy acts strictly as the Data Processor</strong> fabricating the prescription.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              2. Exact Categories of Data We Collect
            </h2>
            <p style={{ marginBottom: '14px' }}>
              Based on your interaction with the Platform, we collect and securely process the following categories of data in our Cloudflare D1 relational database:
            </p>

            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '14px' }}>
                <strong>Dentist &amp; Clinic Account Data (<code>users</code> table):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><strong>Registration &amp; Identity:</strong> Full Name (<code>name</code>), Email Address (<code>email</code>), and Google Account profile info (when using <em>Continue with Google</em>).</li>
                  <li><strong>Authentication Credentials:</strong> Passwords are never stored in plain text; they are cryptographically hashed using <strong>bcrypt (10 rounds)</strong> before storage.</li>
                  <li><strong>Clinic &amp; Profile Details:</strong> Date of Birth (<code>dob</code>), Mobile/Clinic Phone Number (<code>phone</code>), Dental Clinic Name (<code>clinicName</code>), Clinic Street Address (<code>address</code>), account approval status (<code>pending</code>, <code>approved</code>, <code>rejected</code>), and internal administrative review notes (<code>adminNote</code>).</li>
                </ul>
              </li>

              <li style={{ marginBottom: '14px' }}>
                <strong>Patient Case &amp; Prescription Data (<code>lab_orders</code> &amp; <code>delivery_tasks</code> tables):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Patient Full Name or Identifier (<code>patientName</code>), system-generated Case ID (<code>DZ-YYYYMMDD-XXXX</code>), selected teeth array in Palmer notation (<code>teeth_data</code>), restoration/service type (<code>Crown</code>, <code>Bridge</code>, <code>Denture</code>, <code>Implant</code>, <code>Veneer</code>, <code>Retainer</code>, <code>Other</code>), material category, priority level, target due date, clinical instructions/shade notes (<code>notes</code>), production stage timestamps (<code>qc_completed_at</code>, <code>dispatched_at</code>, <code>delivered_at</code>), and clinic delivery address/contact phone.</li>
                </ul>
              </li>

              <li style={{ marginBottom: '14px' }}>
                <strong>Billing, Ledger &amp; Payment Data (<code>payments</code> table):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Invoice numbers (<code>INV-...</code>), consolidated batch settlement IDs (<code>BATCH-...</code>), billed amounts in INR (<code>amount</code>), payment status (<code>Paid</code>, <code>Pending</code>, <code>Overdue</code>, <code>Cancelled</code>), payment mode (<code>Cash</code>, <code>Cheque</code>, <code>UPI</code>, <code>Bank Transfer</code>), payment timestamps (<code>paidAt</code>), and transaction reference numbers (<code>referenceNumber</code> such as UPI UTR or Cheque numbers).</li>
                  <li><em>Note: Dentzy does not collect or store credit/debit card numbers, CVVs, or UPI PINs.</em></li>
                </ul>
              </li>

              <li style={{ marginBottom: '14px' }}>
                <strong>Staff &amp; HR Operations Data (<code>staff</code>, <code>staff_attendance</code>, <code>inventory</code> tables):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Staff username, display name, sequential employee ID (<code>employeeId</code>), department designation, email, phone, date of birth, bcrypt-hashed password, daily attendance status (<code>Present</code>, <code>Absent</code>, <code>Half-day</code>), cases-processed counts, and inventory stock updates (<code>updated_by</code>).</li>
                </ul>
              </li>

              <li>
                <strong>Contact Inquiries &amp; Technical Security Logs (<code>contacts</code> &amp; <code>rate_limits</code> tables):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li>Contact form submissions (<code>name</code>, <code>email</code>, <code>phone</code>, <code>subject</code>, <code>message</code>).</li>
                  <li><strong>Client IP Address (<code>cf-connecting-ip</code>)</strong> and request timestamps (<code>ts</code>) used strictly for brute-force login protection, OTP rate-limiting, and spam prevention.</li>
                  <li>Server-side operational audit logs (<code>[AUDIT]</code> events recording action type, timestamp, and actor ID/username).</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              3. How &amp; Why We Use Your Data
            </h2>
            <p style={{ marginBottom: '10px' }}>We process collected data solely for the following lawful and legitimate purposes:</p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}><strong>Account Verification &amp; Security:</strong> Sending 6-digit registration and password-reset OTPs, verifying Google OAuth tokens, enforcing rate limits (3 OTPs / 10 mins; 5 login attempts / 15 mins), and preventing unauthorized platform access.</li>
              <li style={{ marginBottom: '8px' }}><strong>Prosthetic Manufacturing &amp; Logistics:</strong> Routing dental cases to the appropriate production department (<code>Ceramic</code>, <code>Acrylic</code>, <code>CAD/CAM</code>, <code>Milling</code>, <code>Sintering</code>, <code>3D Printing</code>), tracking QC completion, and dispatching completed cases to your clinic via our <code>Delivery</code> personnel.</li>
              <li style={{ marginBottom: '8px' }}><strong>Billing, Accounting &amp; Tax Compliance:</strong> Generating single invoices, consolidated batch statements, and unpaid balance statements; enforcing the ₹2,00,000 clinic credit limit; and sending administrative payment reminders.</li>
              <li><strong>Operational Communications:</strong> Displaying in-portal announcement tickers (<code>dentist_notice_bar</code> / <code>staff_notice_bar</code>), maintenance status updates, and sending transactional emails (registration status, OTPs, payment reminders, contact confirmations).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              4. Cookies, Local Storage &amp; Device Permissions
            </h2>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Strictly Necessary Authentication Cookies (<code>HttpOnly</code>):</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><code>dentzy_jwt</code>: Authenticates approved Dentist sessions (30-day sliding expiry).</li>
                  <li><code>dentzy_admin_jwt</code>: Authenticates Administrator sessions (8-hour expiry).</li>
                  <li><code>dentzy_staff_jwt</code>: Authenticates Staff and Executive sessions (8-hour expiry).</li>
                </ul>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Browser <code>localStorage</code> &amp; <code>sessionStorage</code>:</strong>
                <p style={{ margin: '4px 0' }}>Used to cache non-sensitive UI session state (<code>dentzy_user</code>, <code>dentzy_admin_info</code>, <code>dentzy_staff_info</code>), remembered login email (<code>dentzy_remember_email</code>), offline mutation queue (<code>dentzy_offline_queue</code>), and haptic feedback preference (<code>isHapticsEnabled</code>).</p>
                <div style={{ backgroundColor: '#f8faf9', borderLeft: '3px solid #708c80', padding: '8px 14px', fontSize: '0.88rem', color: '#4a6a5a', marginTop: '6px' }}>
                  <strong>Zero Ad-Tech Tracking:</strong> Dentzy does not use third-party advertising trackers or sell your browsing data. Furthermore, our testing portal sets <code>noindex, nofollow, noarchive, nosnippet</code> robot directives so search engines never index portal pages.
                </div>
              </li>
              <li>
                <strong>Mobile Haptic Feedback:</strong> On touch devices, the Platform uses the browser&apos;s <code>navigator.vibrate</code> API (7ms micro-vibration on button taps) to enhance tactile usability, which can be disabled via <code>localStorage.isHapticsEnabled = &apos;false&apos;</code>.
              </li>
            </ol>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              5. Third-Party Sub-Processors &amp; Data Sharing
            </h2>
            <p style={{ marginBottom: '10px' }}>
              We do not sell, rent, or trade Dentist or Patient data. We share data only with essential infrastructure sub-processors bound by strict security and confidentiality obligations:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Cloudflare, Inc.:</strong> Hosts our frontend (<code>Cloudflare Pages</code>), serverless edge API (<code>Cloudflare Workers</code>), and relational database (<code>Cloudflare D1</code>) with encryption in transit (TLS 1.3 / HSTS) and at rest.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Google LLC:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  <li><strong>Google Identity Services (OAuth 2.0):</strong> Used when you click <em>Continue with Google</em> (<code>accounts.google.com/gsi/client</code>).</li>
                  <li><strong>Google reCAPTCHA v3:</strong> Protects registration endpoints against automated bot abuse.</li>
                  <li><strong>Google Gmail SMTP (<code>smtp.gmail.com:465</code> TLS):</strong> Primary transactional email relay for OTPs and account notifications.</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Brevo (Sendinblue):</strong> Secondary transactional email API (<code>api.brevo.com</code>) used as a high-availability fallback if primary SMTP delivery is interrupted.
              </li>
              <li>
                <strong>Legal &amp; Tax Authorities:</strong> Where required under Indian law (such as GST audit compliance under GSTIN <code>27AAICA3918J1ZE</code>).
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              6. Data Security Measures
            </h2>
            <p style={{ marginBottom: '10px' }}>
              We implement industry-standard technical and organizational safeguards built directly into our application architecture:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}><strong>Cryptographic Password &amp; OTP Security:</strong> Passwords are hashed with <code>bcryptjs</code> (salt rounds = 10); OTPs are generated via rejection-sampled Web Crypto CSPRNG (<code>crypto.getRandomValues</code>) and verified using HMAC-SHA256 tokens that expire in 5 minutes; admin credentials use timing-safe SHA-256 digest comparisons (<code>safeCompare</code>).</li>
              <li style={{ marginBottom: '8px' }}><strong>Strict Tenant Isolation:</strong> Every database query for orders, payments, batch statements, and unpaid bills verifies <code>ownerId = user.id</code> so a Dentist can never view or access another clinic&apos;s cases or invoices.</li>
              <li><strong>Transport &amp; Header Hardening:</strong> Enforces <code>Strict-Transport-Security</code> (HSTS preload), <code>X-Frame-Options: DENY</code> (clickjacking protection), <code>X-Content-Type-Options: nosniff</code>, and HTML escaping (<code>escapeHtml</code>) on all email templates.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              7. Data Retention &amp; Self-Service Account Deletion
            </h2>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Active Retention:</strong> We retain your account, order history, and payment ledger for as long as your Dentist account remains active.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Instant Self-Service Account Deletion:</strong> You can permanently delete your Dentist account at any time by navigating to <strong>Dashboard → Settings → Delete Account</strong> and entering your password (<code>DELETE /api/auth/profile</code>). This immediately executes a cascading deletion removing your user profile, lab orders, and portal payment records from our active database.
              </li>
              <li>
                <strong>Statutory &amp; Financial Exceptions:</strong> Printed or archived tax invoices and accounting ledger entries required under the Central Goods and Services Tax (CGST) Act, 2017 and Income Tax Act, 1961 may be retained in offline accounting archives for the statutory period mandated by Indian law (up to 8 years). Rate-limit IP logs in <code>rate_limits</code> are automatically pruned once their 10-to-15-minute window expires.
              </li>
            </ol>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              8. Your Rights Under the DPDP Act, 2023
            </h2>
            <p style={{ marginBottom: '10px' }}>
              As a Data Principal under the Digital Personal Data Protection Act, 2023, you are entitled to the following statutory rights:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', backgroundColor: '#f8faf9' }}>
                <div style={{ fontWeight: 700, color: '#1e5038', fontSize: '0.9rem', marginBottom: '4px' }}>Access &amp; Review</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>View your profile, order history, and payment statements in your dashboard.</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', backgroundColor: '#f8faf9' }}>
                <div style={{ fontWeight: 700, color: '#1e5038', fontSize: '0.9rem', marginBottom: '4px' }}>Correction &amp; Updating</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Edit your name, DOB, phone, clinic name, and address via Dashboard → Settings.</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', backgroundColor: '#f8faf9' }}>
                <div style={{ fontWeight: 700, color: '#1e5038', fontSize: '0.9rem', marginBottom: '4px' }}>Erasure</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Permanently delete your account via self-service Delete Account control or support request.</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', backgroundColor: '#f8faf9' }}>
                <div style={{ fontWeight: 700, color: '#1e5038', fontSize: '0.9rem', marginBottom: '4px' }}>Grievance Redressal</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Lodge a complaint regarding data processing with our Grievance Officer below.</div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section style={{ marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e2824', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>
              9. Grievance Officer &amp; Contact Details
            </h2>
            <p style={{ marginBottom: '16px' }}>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the contact details of the official Grievance Officer are provided below:
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
                  Grievance &amp; Data Protection Officer
                </div>
                <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '4px' }}>
                  Dentzy by Namrata Dental Solutions / Dentzy Dental Laboratory LLP
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: '#334155', marginTop: '8px' }}>
                  <MapPin size={16} color="#708c80" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Dindayal Nagar, Vasai West, Vasai-Virar, Maharashtra – 401202, India</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#334155', marginBottom: '8px' }}>
                  <Mail size={16} color="#708c80" />
                  <span><strong>Email:</strong> <a href="mailto:support@dentzy.in" style={{ color: '#1e5038', textDecoration: 'underline' }}>support@dentzy.in</a></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#334155', marginBottom: '8px' }}>
                  <Phone size={16} color="#708c80" />
                  <span><strong>Phone / WhatsApp:</strong> +91 95036 68112</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Office Hours: Mon–Sat, 9:00 AM – 6:00 PM IST
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
