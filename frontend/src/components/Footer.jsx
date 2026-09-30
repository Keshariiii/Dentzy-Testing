'use client';
/**
 * Footer — 4-column dark theme footer for Dentzy.
 *
 * Columns: Brand & Socials | Contact Us | WhatsApp QR (Custom Styled) | Disclaimer
 * Bottom bar with copyright.
 */
import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

/* ── Inline SVG icons (replaces lucide-react) ───────────────── */
const SvgIcon = ({ children, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
const MapPin = ({ size, className }) => <SvgIcon size={size} className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>;
const Phone = ({ size, className }) => <SvgIcon size={size} className={className}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.12 12.71a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></SvgIcon>;
const Mail = ({ size, className }) => <SvgIcon size={size} className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></SvgIcon>;
const Clock = ({ size, className }) => <SvgIcon size={size} className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const AlertTriangle = ({ size, className }) => <SvgIcon size={size} className={className}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgIcon>;
const Info = ({ size, className }) => <SvgIcon size={size} className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></SvgIcon>;
const ShieldAlert = ({ size, className }) => <SvgIcon size={size} className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></SvgIcon>;

import './Footer.css';

/* ── Social icon SVGs (inline for zero-dep) ─────────────────────── */
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
);
const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/></svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
);

const dentzyLogo = '/dentzy-logo-v2.png';

const SOCIALS = [
  { Icon: WhatsAppIcon,  href: 'https://wa.me/919503668112', label: 'WhatsApp' },
  { Icon: YouTubeIcon,   href: '#', label: 'YouTube' },
  { Icon: XIcon,         href: '#', label: 'X' },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: LinkedInIcon,  href: '#', label: 'LinkedIn' },
  { Icon: FacebookIcon,  href: '#', label: 'Facebook' },
];

const DISCLAIMERS = [
  {
    icon: AlertTriangle,
    text: 'In case of any unforeseen circumstances beyond control, expected delivery times may be adjusted without prior notice.',
  },
  {
    icon: Info,
    text: 'Registration on Dentzy does not guarantee exclusive partnership. Order processing is subject to the individual laboratory\'s operational capacity.',
  },
  {
    icon: ShieldAlert,
    text: 'Dentzy is a B2B practice management application. No responsibility is assumed by the platform for the clinical outcome of the dental products manufactured.',
  },
];

const WHATSAPP_LINK = 'https://wa.me/919503668112';

/* ── Component ───────────────────────────────────────────────── */
const Footer = ({ whatsappLink = WHATSAPP_LINK }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="dz-footer">
      {/* ── Top Accent Line ──────────────────────── */}
      <div className="dz-footer__accent" />

      <div className="dz-footer__inner">
        {/* ═══ Column 1: Brand & Socials ═══ */}
        <div className="dz-footer__col dz-footer__brand">
          <div className="dz-footer__logo-wrap">
            <div className="dz-footer__logo-box">
              <img src={dentzyLogo} alt="Dentzy" className="dz-footer__logo-img" />
            </div>
          </div>

          <p className="dz-footer__mission">
            Streamlining order management for modern dental laboratories — the
            gateway to premier dental solutions and seamless clinic-lab collaboration.
          </p>

          <div className="dz-footer__socials">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="dz-footer__social-badge"
                aria-label={label}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* ═══ Column 2: Contact Us ═══ */}
        <div className="dz-footer__col dz-footer__contact">
          <h3 className="dz-footer__heading">
            <span>CONTACT US</span>
            <span className="dz-footer__heading-line" />
          </h3>

          <ul className="dz-footer__contact-list">
            <li>
              <MapPin size={16} className="dz-footer__contact-icon" />
              <div>
                <span className="dz-footer__contact-primary">Namrata Dental Solutions</span>
                <span className="dz-footer__contact-secondary">Vasai-Virar, Maharashtra</span>
              </div>
            </li>
            <li>
              <Phone size={16} className="dz-footer__contact-icon" />
              <a href="tel:+919503668112" className="dz-footer__contact-primary dz-footer__contact-link">+91 95036 68112</a>
            </li>
            <li>
              <Mail size={16} className="dz-footer__contact-icon" />
              <a href="mailto:dentzyemail@gmail.com" className="dz-footer__contact-primary dz-footer__contact-link">dentzyemail@gmail.com</a>
            </li>
            <li>
              <Clock size={16} className="dz-footer__contact-icon" />
              <div>
                <span className="dz-footer__contact-primary">Mon – Sat | 9:00 AM – 7:00 PM</span>
                <span className="dz-footer__contact-secondary">(Order related query)</span>
              </div>
            </li>
          </ul>
        </div>

        {/* ═══ Column 3: WhatsApp QR (Advanced Styled) ═══ */}
        <div className="dz-footer__col dz-footer__qr">
          <h3 className="dz-footer__heading">
            <span>WHATSAPP</span>
            <span className="dz-footer__heading-line" />
          </h3>

          <div className="dz-footer__qr-container">
            <div className="dz-footer__qr-box">
              {mounted ? (
                <QRCode
                  value={whatsappLink}
                  size={136}
                  bgColor="#ffffff"
                  fgColor="#3A5A40"
                  qrStyle="dots"
                  eyeRadius={[
                    [8, 8, 0, 8],
                    [8, 8, 8, 0],
                    [8, 0, 8, 8],
                  ]}
                  eyeColor={[
                    { outer: '#2d4a34', inner: '#588157' },
                    { outer: '#2d4a34', inner: '#588157' },
                    { outer: '#2d4a34', inner: '#588157' },
                  ]}
                  logoImage="/dentzy-icon.png"
                  logoWidth={32}
                  logoHeight={32}
                  logoOpacity={1}
                  removeQrCodeBehindLogo={true}
                  logoPadding={3}
                  logoPaddingStyle="circle"
                  ecLevel="H"
                />
              ) : (
                <div style={{ width: 136, height: 136, background: '#ffffff', borderRadius: 8 }} />
              )}
            </div>
            <div className="dz-footer__qr-label">
              Scan for Quick Access
            </div>
          </div>
        </div>

        {/* ═══ Column 4: Disclaimer ═══ */}
        <div className="dz-footer__col dz-footer__disclaimer">
          <h3 className="dz-footer__heading">
            <span>DISCLAIMER</span>
            <span className="dz-footer__heading-line" />
          </h3>

          <ul className="dz-footer__disclaimer-list">
            {DISCLAIMERS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="dz-footer__disclaimer-item">
                <Icon size={15} className="dz-footer__disclaimer-icon" />
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══ Bottom Bar ═══ */}
      <div className="dz-footer__bottom">
        <p className="dz-footer__copyright">
          © 2026{' '}
          <span className="dz-footer__copyright-highlight">
            Dentzy by Namrata Dental Solutions
          </span>
          . All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
