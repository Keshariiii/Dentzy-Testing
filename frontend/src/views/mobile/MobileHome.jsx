'use client';
/**
 * MobileHome -- Complete mobile landing page.
 * 100% parity with all 16 desktop sections.
 * Zero emojis. All SVG icons.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, Layers, Headphones, Send, Loader2, MapPin, Phone, Mail } from 'lucide-react';
import { TwentyFirstIconButton } from '../../components/ui/twentyfirst-icon-button';
import { ThankYouAnimation } from '../../components/ui/thank-you-animation';
import { useAuth } from '../../context/AuthContext';
import { getContactUrl } from '../../api/client';
import MobileHeader from '../../components/mobile/MobileHeader';
import Footer from '../../components/Footer';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileHome.css';
import { Ico } from '../../components/common/DashboardIcons';
import {
  HERO_MEDIA,
  SERVICES_DATA,
  PRODUCTS_DATA,
  PROCESS_STEPS,
  PROCESS_COPY,
  WHY_CHOOSE_DATA,
  ABOUT_DATA,
  PERFECT_SMILE_DATA,
  FUTURE_SERVICES,
} from '../../data/landingContent';

/* ============================================================
   ICON MAPPING FOR SHARED DATA
============================================================ */
const WHY_ICONS = {
  quality: ShieldCheck,
  turnaround: Clock,
  digital: Layers,
  support: Headphones,
};

/* ============================================================
   COMPONENT
============================================================ */
const MobileHome = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Contact form state
  const [formData, setFormData] = useState({
    user_name: '', user_email: '', contact_number: '', subject: '', message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [hpWebsite, setHpWebsite] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmedName = formData.user_name.trim();
    const trimmedEmail = formData.user_email.trim();
    const trimmedMessage = formData.message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields (Name, Email, Message).' });
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address (e.g. doctor@clinic.com).' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch(getContactUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName, email: trimmedEmail,
          phone: formData.contact_number.trim(), subject: formData.subject.trim(),
          message: trimmedMessage, hp_website: hpWebsite,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setIsSubmitted(true);
        setStatusMessage({ type: '', text: '' });
        setFormData({ user_name: '', user_email: '', contact_number: '', subject: '', message: '' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Unable to submit your message. Please try again.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to connect to the server. Please try again later.' });
    } finally { setIsSubmitting(false); }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStatusMessage({ type: '', text: '' });
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="m-landing-shell">
      <MobileHeader title={null} showLogin={true} />

      <main className="m-home-content">

        {/* 1. Hero Banner */}
        <section className="m-hero" id="home">
          <video className="m-hero__video" autoPlay loop muted playsInline>
            <source src={HERO_MEDIA.videoSrc} type="video/mp4" />
          </video>
          <div className="m-hero__overlay" />
          <div className="m-hero__text">
            <h1>
              <span className="m-hero__line1">CRAF<span className="dentzy-t">T</span>ED WITH CARE</span>
              <span className="m-hero__line2">{HERO_MEDIA.line2}</span>
            </h1>
          </div>
        </section>

        {/* 3. Intro / Mission */}
        <section className="m-intro-section">
          <h2 className="m-section-title">
            <span className="m-intro-highlight">Your Partner In Modern Dentistry</span>
          </h2>
          <p className="m-intro-text">
            At <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>, we don&apos;t just take orders; we provide solutions. Our dedicated technical support team
            is available for real-time case consultations, ensuring every restoration fits perfectly the first time.
          </p>
        </section>

        {/* 4. Services Horizontal Scroll */}
        <section className="m-services-section" id="services">
          <h2 className="m-section-title">Our Signature Services</h2>
          <div className="m-services-scroll">
            {SERVICES_DATA.map((s) => (
              <div key={s.key} className="m-service-card">
                <div className="m-service-card__img">
                  <img src={s.image} alt={s.title} loading="lazy" />
                </div>
                <div className="m-service-card__body">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Process */}
        <section className="m-process-section">
          <h2 className="m-section-title" style={{ color: 'var(--dz-color-text-primary, #333)' }}>
            The <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span> Process
          </h2>
          <div className="m-process-steps">
            {PROCESS_STEPS.map((item, i) => (
              <React.Fragment key={item.key}>
                <div className="m-process-step">
                  <div className="m-process-step__num">{item.step}</div>
                  <span className="m-process-step__label">{item.label}</span>
                </div>
                {i < PROCESS_STEPS.length - 1 && <div className="m-process-arrow">
                  {Ico.arrowRight(16, 2.5)}
                </div>}
              </React.Fragment>
            ))}
          </div>
          <div className="m-cuz-card">
            <div className="m-cuz-content">
              <h3>BE A <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span> CUZ...</h3>
              <p>{PROCESS_COPY.cuzSubtitle}</p>
            </div>
            <div className="m-cuz-image">
              <img src={PROCESS_COPY.cuzImage} alt={PROCESS_COPY.cuzAlt} loading="lazy" />
            </div>
          </div>
        </section>

        {/* 6. CTA Banner */}
        <section className="m-cta-banner">
          <div className="m-cta-inner">
            <h2>ARE YOU A DENTIST?</h2>
            <Link href="/login" className="m-cta-btn">Get Started</Link>
          </div>
        </section>

        {/* 7. About Dentzy */}
        <section className="m-about-section" id="about">
          <video className="m-about-video" autoPlay loop muted playsInline preload="none">
            <source src={HERO_MEDIA.aboutVideoSrc} type="video/mp4" />
          </video>
          <div className="m-about-overlay" />
          <div className="m-about-content">
            <h2>About <span className="dentzy-brand--light">DEN<span className="dentzy-t">T</span>ZY</span></h2>
            <p>{ABOUT_DATA.bannerSubtitle}</p>
          </div>
        </section>

        {/* 8. About Details */}
        <section className="m-details-section">
          <h2 className="m-section-title">{ABOUT_DATA.detailsTitle}</h2>
          <div className="m-details-intro">
            <p>
              At <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>, we are dedicated to delivering the restorations that meet the needs of today&apos;s dentistry.
              We ensure consistent quality, accuracy, and aesthetics in every case we handle.
              Our focus is simple - to support dentists with reliable solutions that help create
              confident, natural-looking smiles.
            </p>
          </div>
          <div className="m-details-cards">
            <div className="m-details-card">
              <p>
                Dentzy is a leading Indian dental brand founded by Tanish Dinesh Poojari, a
                Certified Dental Technician (CDT). Built on a legacy of excellence, Dentzy is
                backed by its parent company, Namrata Dental Solutions, which has been a
                trusted leader in the dental laboratory industry mainly in Maharashtra for more than 30
                years.
              </p>
            </div>
            <div className="m-details-card">
              <p>
                After observing the frequent friction between dental laboratories and clinicians -- often caused by
                poor customer service and a lack of mutual understanding -- we recognized a significant gap in the
                industry. To bridge this divide, we envisioned a fully digital dental laboratory ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Perfect Smile */}
        <section className="m-smile-section">
          <div className="m-smile-content">
            <h2>{PERFECT_SMILE_DATA.headlineLines.join(' ')}</h2>
            <p className="m-smile-sub">{PERFECT_SMILE_DATA.subtitle}</p>
            <div className="m-smile-brand">
              <span>DEN<span className="m-accent">T</span>ZY</span>
            </div>
            <p className="m-smile-footer">{PERFECT_SMILE_DATA.footerLines.join(' ')}</p>
          </div>
          <div className="m-smile-img">
            <img src={PERFECT_SMILE_DATA.image} alt={PERFECT_SMILE_DATA.imageAlt} loading="lazy" />
          </div>
        </section>

        {/* 10. Partner Section */}
        <section className="m-partner-section">
          <div className="m-partner-overlay" />
          <div className="m-partner-content">
            <h2>Your Partner In Modern Dentistry</h2>
            <p>
              At <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>, we are not just a dental laboratory -- we are a collaborative partner committed to improving
              workflows, strengthening professional relationships, and supporting the future of modern dentistry.
            </p>
          </div>
        </section>

        {/* 11. Products Intro */}
        <section className="m-products-intro" id="products">
          <video className="m-products-video" autoPlay loop muted playsInline preload="none">
            <source src={HERO_MEDIA.productsVideoSrc} type="video/mp4" />
          </video>
          <div className="m-products-overlay" />
          <div className="m-products-content">
            <h2>Our PRODUC<span className="m-accent">T</span>S</h2>
            <p>Precision You Can Rely On</p>
          </div>
        </section>

        {/* 12. Products Catalog (DentzyMakesUs) */}
        <section className="m-catalog-section">
          <h2 className="m-section-title">This Is What Makes Us <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span></h2>
          <div className="m-catalog-list">
            {PRODUCTS_DATA.map((p) => (
              <div key={p.key} className="m-catalog-card">
                <div className="m-catalog-img">
                  <img src={p.image} alt={p.title} loading="lazy" />
                </div>
                <div className="m-catalog-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 13. Why Dentzy */}
        <section className="m-why-section" id="why-choose">
          <h2 className="m-section-title">Why Choose <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>?</h2>
          <div className="m-why-cards">
            {WHY_CHOOSE_DATA.map((w) => {
              const Icon = WHY_ICONS[w.key];
              return (
                <div key={w.key} className="m-why-card">
                  <span className="m-why-icon">
                    {Icon && <Icon size={18} />}
                  </span>
                  <div className="m-why-text">
                    <h4>{w.title}</h4>
                    <p>{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 14. Future Services */}
        <section className="m-future-section">
          <p className="m-future-text">
            {FUTURE_SERVICES.text}
          </p>
        </section>

        {/* 15. Connect With Us */}
        <section className="m-connect-section" id="contact">
          <h2 className="m-connect-title">CONNEC<span className="m-accent">T</span></h2>
          <p className="m-connect-sub">WITH US</p>
        </section>

        {/* 16. Contact Form */}
        <section className="m-contact-form-section" id="contact-form">
          <div className="m-contact-card">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <form className="m-contact-form" onSubmit={handleSubmit} noValidate key="form">
                  <div className="m-cf-field">
                    <label className="m-cf-label">Name *</label>
                    <input type="text" name="user_name" placeholder="Dr. Rajesh Sharma"
                      className="m-cf-input" value={formData.user_name} onChange={handleChange}
                      maxLength={100} required />
                  </div>

                  <div className="m-cf-row">
                    <div className="m-cf-field">
                      <label className="m-cf-label">Email *</label>
                      <input type="email" name="user_email" placeholder="doctor@clinic.com"
                        className="m-cf-input" value={formData.user_email} onChange={handleChange}
                        maxLength={100} required />
                    </div>
                    <div className="m-cf-field">
                      <label className="m-cf-label">Phone</label>
                      <input type="tel" name="contact_number" placeholder="+91 98765 43210"
                        className="m-cf-input" value={formData.contact_number} onChange={handleChange}
                        maxLength={20} />
                    </div>
                  </div>

                  <div className="m-cf-field">
                    <label className="m-cf-label">Subject</label>
                    <input type="text" name="subject" placeholder="Zirconia Case Inquiry"
                      className="m-cf-input" value={formData.subject} onChange={handleChange}
                      maxLength={200} />
                  </div>

                  <div className="m-cf-field">
                    <label className="m-cf-label">Message *</label>
                    <textarea name="message" placeholder="Please describe your clinical case or inquiry..."
                      className="m-cf-input m-cf-textarea" rows={4}
                      value={formData.message} onChange={handleChange}
                      maxLength={15000} required />
                  </div>

                  {/* Honeypot */}
                  <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}
                    aria-hidden="true">
                    <input type="text" name="hp_website" tabIndex={-1} autoComplete="off"
                      value={hpWebsite} onChange={(e) => setHpWebsite(e.target.value)} />
                  </div>

                  {statusMessage.text && (
                    <div className={`m-cf-msg m-cf-msg--${statusMessage.type}`}>{statusMessage.text}</div>
                  )}

                  <TwentyFirstIconButton
                    type="submit"
                    icon={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    title={isSubmitting ? 'Sending...' : 'Send Message'}
                    ariaLabel="Send Message"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </form>
              ) : (
                <ThankYouAnimation key="thanks" onReset={handleReset} />
              )}
            </AnimatePresence>
          </div>
        </section>
        {/* 17. Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default MobileHome;
