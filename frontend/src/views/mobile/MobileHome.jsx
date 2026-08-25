'use client';
/**
 * MobileHome -- Complete mobile landing page.
 * 100% parity with all 16 desktop sections.
 * Zero emojis. All SVG icons.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getContactUrl } from '../../api/client';
import MobileHeader from '../../components/mobile/MobileHeader';
import Footer from '../../components/Footer';
const dentzyLogo = '/dentzy-logo-v3.jpg';
import './MobileHome.css';

/* ============================================================
   DATA
============================================================ */
const SERVICES = [
  { key: 'denture',  title: 'Denture',  image: '/images/denture.jpg',
    desc: "Tooth loss can significantly affect a person's appearance, confidence, and ability to chew and speak properly." },
  { key: 'zirconia', title: 'Zirconia', image: '/images/zirconia.jpg',
    desc: 'A zirconia crown is a full-coverage dental restoration made from zirconium dioxide, a high-strength ceramic material.' },
  { key: 'pfm',      title: 'PFM',      image: '/images/pfm.jpg',
    desc: 'A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most trusted restorations in dentistry.' },
  { key: 'metal',    title: 'Metal',    image: '/images/metal.jpg',
    desc: 'A dental metal crown is a full-coverage restoration that protects and strengthens a damaged or heavily restored tooth.' },
];

const PRODUCTS = [
  { key: 'denture',   title: 'Complete Denture (single arch)', image: '/images/denture.jpg',
    desc: "Tooth loss can significantly affect a person's appearance, confidence, and ability to chew and speak properly. A complete denture (single arch) is a reliable and time-tested solution for patients who have lost all teeth in either the upper (maxillary) or lower (mandibular) arch." },
  { key: 'flexible',  title: 'Flexible Denture', image: '/images/flexible-denture.jpg',
    desc: 'Flexible dentures are removable dental prostheses made from advanced thermoplastic materials rather than conventional acrylic or metal frameworks. Their flexible nature allows the denture to adapt comfortably to the natural contours of the gums, offering a secure and natural fit.' },
  { key: 'rpd',       title: 'Removable Partial Denture', image: '/images/rpd.jpg',
    desc: 'Missing one or more teeth can affect chewing, speech, and overall confidence. A Removable Partial Denture (RPD) is a practical and effective tooth replacement option that restores function and aesthetics while preserving remaining natural teeth.' },
  { key: 'metal-cb',  title: 'Metal Crowns and Bridges', image: '/images/metal.jpg',
    desc: 'A dental metal crown is a full-coverage restoration that protects and strengthens a damaged or heavily restored tooth. A metal bridge replaces one or more missing teeth by anchoring artificial teeth to metal crowns placed on adjacent natural teeth.' },
  { key: 'pfm-prod',  title: 'PFM', image: '/images/pfm.jpg',
    desc: 'A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most trusted restorations in dentistry. Known for combining the strength of metal with the natural appearance of porcelain, PFM crowns offer a reliable and cost-effective solution for restoring damaged or weakened teeth.' },
  { key: 'zirconia-p', title: 'Zirconia', image: '/images/zirconia.jpg',
    desc: 'A zirconia crown is a full-coverage dental restoration made from zirconium dioxide, a high-strength ceramic material. It can be fabricated as monolithic zirconia (single solid structure) or layered zirconia (zirconia core with ceramic layering for enhanced aesthetics). Zirconia crowns are designed using advanced CAD/CAM technology, ensuring exceptional precision and consistency.' },
];

const WHY_ITEMS = [
  { title: 'Quality Guarantee', desc: '1-year warranty on all restorations',
    d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { title: 'Fast Turnaround', desc: '5-7 days standard, 2-3 days rush',
    d: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2', isComplex: true,
    svg: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
  { title: 'Digital Workflow', desc: 'STL uploads for digital impressions',
    d: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
  { title: 'Dedicated Support', desc: 'Mon-Sat, 9 AM - 6 PM IST',
    d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
];

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
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_name || !formData.user_email || !formData.message) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields (Name, Email, Message)' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch(getContactUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.user_name, email: formData.user_email,
          phone: formData.contact_number, subject: formData.subject, message: formData.message,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Message Sent Successfully!' });
        setFormData({ user_name: '', user_email: '', contact_number: '', subject: '', message: '' });
      } else {
        setStatusMessage({ type: 'error', text: `Failed to send: ${data.error || 'Server error'}` });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to connect to the server. Please try again later.' });
    } finally { setIsSubmitting(false); }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="m-landing-shell">
      <MobileHeader title={null} showLogin={true} />

      <main className="m-home-content">

        {/* 1. Hero Banner */}
        <section className="m-hero" id="m-home">
          <video className="m-hero__video" autoPlay loop muted playsInline>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="m-hero__overlay" />
          <div className="m-hero__text">
            <h1>
              <span className="m-hero__line1">CRAF<span className="m-hero__accent">T</span>ED WITH CARE</span>
              <span className="m-hero__line2">FOR PATIENTS WELFARE</span>
            </h1>
            {!user && (
              <button className="m-hero__cta" onClick={() => router.push('/login')}>
                Get Started
              </button>
            )}
          </div>
        </section>

        {/* 3. Intro / Mission */}
        <section className="m-intro-section">
          <h2 className="m-section-title">
            <span className="m-intro-highlight">Your Partner In Modern Dentistry</span>
          </h2>
          <p className="m-intro-text">
            At Dentzy, we don't just take orders; we provide solutions. Our dedicated technical support team
            is available for real-time case consultations, ensuring every restoration fits perfectly the first time.
          </p>
        </section>

        {/* 4. Services Horizontal Scroll */}
        <section className="m-services-section" id="m-services">
          <h2 className="m-section-title">Our Signature Services</h2>
          <div className="m-services-scroll">
            {SERVICES.map((s) => (
              <div key={s.key} className="m-service-card">
                <div className="m-service-card__img">
                  <img src={s.image} alt={s.title} loading="lazy" />
                </div>
                <div className="m-service-card__body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Process */}
        <section className="m-process-section">
          <h2 className="m-section-title">
            The DEN<span className="m-accent">T</span>ZY Process
          </h2>
          <div className="m-process-steps">
            {['Receive', 'Revive', 'Restore'].map((step, i) => (
              <React.Fragment key={step}>
                <div className="m-process-step">
                  <div className="m-process-step__num">{i + 1}</div>
                  <span className="m-process-step__label">{step}</span>
                </div>
                {i < 2 && <div className="m-process-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>}
              </React.Fragment>
            ))}
          </div>
          <div className="m-cuz-card">
            <div className="m-cuz-content">
              <h3>BE A DEN<span className="m-accent">T</span>ZY CUZ...</h3>
              <p>If "Dentzy" were a person, they would be a tech-savvy craftsman.</p>
            </div>
            <div className="m-cuz-image">
              <img src="/images/dentzy-cuz.jpg" alt="Tech-savvy craftsman" loading="lazy" />
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
        <section className="m-about-section" id="m-about">
          <video className="m-about-video" autoPlay loop muted playsInline>
            <source src="/images/about-bg.mp4" type="video/mp4" />
          </video>
          <div className="m-about-overlay" />
          <div className="m-about-content">
            <h2>About DEN<span className="m-accent">T</span>ZY</h2>
            <p>WE ARE HERE TO WIN YOUR HEART AND EARN YOUR SMILE.</p>
          </div>
        </section>

        {/* 8. About Details */}
        <section className="m-details-section">
          <h2 className="m-section-title">Excellence Behind Every Smile</h2>
          <div className="m-details-intro">
            <p>
              At DENTZY, we are dedicated to delivering the restorations that meet the needs of today's dentistry.
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
            <h2>EVERYONE DESERVES A PERFECT SMILE,</h2>
            <p className="m-smile-sub">and we're here to help you achieve yours</p>
            <div className="m-smile-brand">
              <span>DEN<span className="m-accent">T</span>ZY</span>
            </div>
            <p className="m-smile-footer">Crafted With Care, For Patients Welfare.</p>
          </div>
          <div className="m-smile-img">
            <img src="/images/perfect-smile.jpg" alt="Hands holding dental mold" loading="lazy" />
          </div>
        </section>

        {/* 10. Partner Section */}
        <section className="m-partner-section">
          <div className="m-partner-overlay" />
          <div className="m-partner-content">
            <h2>Your Partner In Modern Dentistry</h2>
            <p>
              At DENTZY, we are not just a dental laboratory -- we are a collaborative partner committed to improving
              workflows, strengthening professional relationships, and supporting the future of modern dentistry.
            </p>
          </div>
        </section>

        {/* 11. Products Intro */}
        <section className="m-products-intro" id="m-products">
          <video className="m-products-video" autoPlay loop muted playsInline>
            <source src="/products-bg.mp4" type="video/mp4" />
          </video>
          <div className="m-products-overlay" />
          <div className="m-products-content">
            <h2>Our PRODUC<span className="m-accent">T</span>S</h2>
            <p>Precision You Can Rely On</p>
          </div>
        </section>

        {/* 12. Products Catalog (DentzyMakesUs) */}
        <section className="m-catalog-section">
          <h2 className="m-section-title">This Is What Makes Us <span className="m-accent-inline">DENTZY</span></h2>
          <div className="m-catalog-list">
            {PRODUCTS.map((p) => (
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
        <section className="m-why-section">
          <h2 className="m-section-title">Why Choose Dentzy?</h2>
          <div className="m-why-cards">
            {WHY_ITEMS.map((w, i) => (
              <div key={i} className="m-why-card">
                <span className="m-why-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {w.svg || <path d={w.d} />}
                  </svg>
                </span>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 14. Future Services */}
        <section className="m-future-section">
          <p className="m-future-text">
            We will continue to expand our offerings with new services in the future.
          </p>
        </section>

        {/* 15. Connect With Us */}
        <section className="m-connect-section" id="m-contact">
          <h2 className="m-connect-title">CONNEC<span className="m-accent">T</span></h2>
          <p className="m-connect-sub">WITH US</p>
        </section>

        {/* 16. Contact Form */}
        <section className="m-contact-form-section" id="m-contact-form">
          <h2 className="m-section-title">We Are Here To Help You</h2>
          <form className="m-contact-form" onSubmit={handleSubmit} noValidate>
            <input type="text" name="user_name" placeholder="Name *" className="m-cf-input"
              value={formData.user_name} onChange={handleChange} />
            <input type="email" name="user_email" placeholder="Email *" className="m-cf-input"
              value={formData.user_email} onChange={handleChange} />
            <input type="tel" name="contact_number" placeholder="Phone Number" className="m-cf-input"
              value={formData.contact_number} onChange={handleChange} />
            <input type="text" name="subject" placeholder="Subject" className="m-cf-input"
              value={formData.subject} onChange={handleChange} />
            <textarea name="message" placeholder="Message *" className="m-cf-input m-cf-textarea" rows="4"
              value={formData.message} onChange={handleChange} />
            <button type="submit" className="m-cf-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
            {statusMessage.text && (
              <div className={`m-cf-msg m-cf-msg--${statusMessage.type}`}>{statusMessage.text}</div>
            )}
          </form>

          <div className="m-contact-info-grid">
            <div className="m-ci-item">
              <h4>Address</h4>
              <p>Vasai - Palghar 401202</p>
            </div>
            <div className="m-ci-item">
              <h4>Phone</h4>
              <p><a href="tel:+919503668112">+91-9503668112</a></p>
            </div>
            <div className="m-ci-item">
              <h4>Email</h4>
              <p><a href="mailto:dentzyemail@gmail.com">dentzyemail@gmail.com</a></p>
            </div>
            <div className="m-ci-item">
              <h4>Working Hours</h4>
              <p>Mon-Sat, 9 AM - 6 PM</p>
            </div>
          </div>
        </section>

        {/* 17. Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default MobileHome;
