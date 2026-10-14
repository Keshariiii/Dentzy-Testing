'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { ShieldCheck, Clock, Layers, Headphones, Send, Loader2, MapPin, Phone, Mail } from 'lucide-react';
import { TwentyFirstIconButton } from '../../components/ui/twentyfirst-icon-button';
import { useAuth } from '../../context/AuthContext';
import { getContactUrl } from '../../api/client';
import MobileHeader from '../../components/mobile/MobileHeader';
import Footer from '../../components/Footer';
const dentzyLogo = '/dentzy-logo-v2.png';
import './MobileHome.css';

const SERVICES = [
  { key: 'denture',  title: 'Complete Dentures', image: '/images/denture.webp', desc: 'Precision-crafted single and full arch dentures optimized for retention, bite stability, and natural aesthetics.' },
  { key: 'zirconia', title: 'Zirconia Crowns', image: '/images/zirconia.webp', desc: 'Monolithic and layered CAD/CAM zirconia restorations offering exceptional flexural strength and natural translucency.' },
  { key: 'pfm',      title: 'PFM Restorations', image: '/images/pfm.webp', desc: 'Porcelain-fused-to-metal crowns combining high-tensile metal substructures with layered aesthetic ceramics.' },
  { key: 'metal',    title: 'Metal Castings', image: '/images/metal.webp', desc: 'Full-contour base metal alloys designed with tight marginal integrity for posterior load-bearing zones.' },
];

const PRODUCTS = [
  { key: 'denture',   title: 'Complete Denture (Arch)', image: '/images/denture.webp', desc: 'Reliable tooth replacement solution ensuring correct vertical dimension and phonetic harmony.' },
  { key: 'flexible',  title: 'Flexible Denture', image: '/images/flexible-denture.webp', desc: 'Thermoplastic biocompatible framework adapting smoothly to gingival contours without visible clasps.' },
  { key: 'rpd',       title: 'Removable Partial Denture', image: '/images/rpd.webp', desc: 'Functional partial replacement preserving remaining natural dentition while restoring chewing efficacy.' },
  { key: 'metal-cb',  title: 'Metal Crowns & Bridges', image: '/images/metal.webp', desc: 'Durable multi-unit bridgework engineered for longevity and predictable load distribution.' },
  { key: 'pfm-prod',  title: 'PFM Crown', image: '/images/pfm.webp', desc: 'Tried-and-tested restoration balancing structural resilience with lifelike porcelain shading.' },
  { key: 'zirconia-p', title: 'Monolithic Zirconia', image: '/images/zirconia.webp', desc: 'High-translucency digital zirconia milled via 5-axis machines for exact marginal fit.' },
];

const WHY_ITEMS = [
  { title: 'Quality Guarantee', desc: '1-year warranty on all restorations', Icon: ShieldCheck },
  { title: 'Fast Turnaround', desc: '5-7 days standard, 2-3 days rush', Icon: Clock },
  { title: 'Digital Workflow', desc: 'STL uploads for digital impressions', Icon: Layers },
  { title: 'Dedicated Support', desc: 'Mon-Sat, 9 AM - 6 PM IST', Icon: Headphones },
];

const MobileHome = () => {
  const [formData, setFormData] = useState({ user_name: '', user_email: '', contact_number: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_name || !formData.user_email || !formData.message) {
      setStatusMessage({ type: 'error', text: 'Please fill in Name, Email, and Message.' });
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
      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Inquiry sent successfully!' });
        setFormData({ user_name: '', user_email: '', contact_number: '', subject: '', message: '' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to send message. Please try again.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error. Please check your connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="m-landing-shell">
      <MobileHeader title={null} showLogin={true} />

      <main className="m-home-content">
        <section className="m-hero" id="m-home">
          <video className="m-hero__video" autoPlay loop muted playsInline>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="m-hero__overlay" />
          <div className="m-hero__text">
            <h1>
              <span className="m-hero__line1" style={{ textTransform: 'none', letterSpacing: '-0.02em' }}>Precision Dental Laboratory</span>
              <span className="m-hero__line2" style={{ letterSpacing: '0.1em' }}>Digital Workflow & CAD/CAM Milling</span>
            </h1>
            <Link href="/login" className="m-hero__cta" style={{ textDecoration: 'none' }}>Dentist Portal Login</Link>
          </div>
        </section>

        <section className="m-intro-section" style={{ background: '#ffffff', padding: '32px 16px' }}>
          <h2 className="m-section-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111C17' }}>
            Clinical Partnership for Modern Practices
          </h2>
          <p className="m-intro-text">
            Dentzy integrates direct digital STL file processing with master ceramicist craftsmanship. We support clinics across Maharashtra with predictable margins, consistent shading, and reliable turnaround times.
          </p>
        </section>

        <section className="m-services-section" style={{ background: '#F8FAF9', padding: '32px 0 20px 16px' }}>
          <h2 className="m-section-title">Core Restorations</h2>
          <div className="m-services-scroll">
            {SERVICES.map((s) => (
              <div key={s.key} className="m-service-card" style={{ border: '1px solid #E2ECE6' }}>
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

        <section className="m-process-section" style={{ background: '#ffffff' }}>
          <h2 className="m-section-title" style={{ color: '#111C17' }}>The Dentzy Workflow</h2>
          <div className="m-process-steps">
            {['Impression / STL', 'CAD Design & QC', 'Milling & Dispatch'].map((step, i) => (
              <React.Fragment key={step}>
                <div className="m-process-step">
                  <div className="m-process-step__num" style={{ background: '#163E2B' }}>{i + 1}</div>
                  <span className="m-process-step__label">{step}</span>
                </div>
                {i < 2 && <div className="m-process-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="m-why-section" style={{ background: '#F8FAF9', padding: '32px 16px' }}>
          <h2 className="m-section-title">Why Partner With Us</h2>
          <div className="m-why-cards">
            {WHY_ITEMS.map((w, i) => (
              <div key={i} className="m-why-card" style={{ background: '#fff', border: '1px solid #E2ECE6' }}>
                <span className="m-why-icon" style={{ background: '#E8F2EC', color: '#163E2B' }}>
                  <w.Icon size={20} />
                </span>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="m-contact-form-section" id="m-contact-form" style={{ background: '#ffffff', padding: '32px 16px' }}>
          <h2 className="m-section-title">Clinic Inquiry</h2>
          <form className="m-contact-form" onSubmit={handleSubmit} noValidate>
            <input type="text" name="user_name" placeholder="Doctor Name *" className="m-cf-input" value={formData.user_name} onChange={handleChange} />
            <input type="email" name="user_email" placeholder="Clinic Email *" className="m-cf-input" value={formData.user_email} onChange={handleChange} />
            <input type="tel" name="contact_number" placeholder="Phone Number" className="m-cf-input" value={formData.contact_number} onChange={handleChange} />
            <input type="text" name="subject" placeholder="Subject / Query" className="m-cf-input" value={formData.subject} onChange={handleChange} />
            <textarea name="message" placeholder="Case requirements or message *" className="m-cf-input m-cf-textarea" rows="4" value={formData.message} onChange={handleChange} />
            
            <div style={{ marginTop: '12px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', minHeight: '46px', background: '#163E2B', color: '#fff',
                  border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Send Inquiry</span>
              </button>
            </div>

            {statusMessage.text && (
              <div className={`m-cf-msg m-cf-msg--${statusMessage.type}`} style={{ marginTop: '10px' }}>{statusMessage.text}</div>
            )}
          </form>

          <div className="m-contact-info-grid" style={{ marginTop: '20px' }}>
            <div className="m-ci-item">
              <h4 style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Location</h4>
              <p>Vasai-Virar, MH 401202</p>
            </div>
            <div className="m-ci-item">
              <h4 style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Direct</h4>
              <p><a href="tel:+919503668112">+91-95036 68112</a></p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default MobileHome;
