'use client';
/**
 * Footer — 4-column dark theme footer for Dentzy.
 *
 * Columns: Brand & Quick Links | Contact Us | WhatsApp QR (Custom Styled) | Disclaimer
 * Bottom bar with copyright & legal links.
 */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCode } from 'react-qrcode-logo';
import { MapPin, Phone, Mail, Clock, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

import './Footer.css';

const dentzyLogo = '/dentzy-logo-v2.png';

const QUICK_LINKS = [
  { label: 'Home',            href: '/#home' },
  { label: 'About Us',        href: '/#about' },
  { label: 'Products',        href: '/#products' },
  { label: 'Services',        href: '/#services' },
  { label: 'Contact Us',      href: '/#contact' },
  { label: 'Login',           href: '/login' },
  { label: 'Register',        href: '/register' },
  { label: 'Forgot Password', href: '/forgot-password' },
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

  const handleLinkClick = (e, href) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      if (id === 'home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const headerEl = document.querySelector('.m-header') || document.querySelector('.header');
        const headerH = headerEl ? headerEl.offsetHeight : 64;
        const top = el.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top, behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <footer className="dz-footer">
      <div className="dz-footer__inner">
        {/* ═══ Column 1: Brand & Quick Links ═══ */}
        <div className="dz-footer__col dz-footer__brand">
          <div className="dz-footer__logo-wrap">
            <div className="dz-footer__logo-box">
              <img src={dentzyLogo} alt="Dentzy" className="dz-footer__logo-img" />
            </div>
          </div>

          <h3 className="dz-footer__heading">
            <span>QUICK LINKS</span>
            <span className="dz-footer__heading-line" />
          </h3>

          <ul className="dz-footer__links-list">
            {QUICK_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="dz-footer__link" onClick={(e) => handleLinkClick(e, href)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
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
              <a href="mailto:support@dentzy.in" className="dz-footer__contact-primary dz-footer__contact-link">support@dentzy.in</a>
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
