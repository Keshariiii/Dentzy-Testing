'use client';
// ponytail: Bespoke 21st.dev clinical under-maintenance screen with zero-bloat state recovery and zero emojis
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMaintenance } from '../context/MaintenanceContext';
import { Ico } from './common/DashboardIcons';

const ShieldCheckIcon = ({ size = 20, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ClockIcon = ({ size = 18, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const WhatsAppIcon = ({ size = 18, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const PhoneCallIcon = ({ size = 18, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SpinnerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'dzSpin 0.9s linear infinite', flexShrink: 0 }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/**
 * MaintenanceScreen — Bespoke Under Maintenance Portal View
 *
 * @param {'dentist'|'staff'|'both'} [props.role='dentist']
 * @param {Function} [props.onRestored]
 */
export default function MaintenanceScreen({ role = 'dentist', onRestored }) {
  const router = useRouter();
  const { maintenance, checkStatus, checking } = useMaintenance();
  const [feedback, setFeedback] = useState(null);

  // Role pill label calculation
  const getRoleBadge = () => {
    const target = maintenance?.target || role;
    if (target === 'staff' || role === 'staff') {
      return 'Lab Operations Portal Maintenance';
    }
    if (target === 'dentists' || role === 'dentist') {
      return 'Scheduled Clinical Portal Maintenance';
    }
    return 'Scheduled Platform Maintenance';
  };

  const handleLiveCheck = useCallback(async () => {
    setFeedback(null);
    const { isLive } = await checkStatus();
    if (isLive) {
      if (typeof onRestored === 'function') {
        onRestored();
      } else {
        router.refresh();
      }
    } else {
      const nowTime = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      setFeedback(`Maintenance is still in progress. Checked at ${nowTime}.`);
    }
  }, [checkStatus, onRestored, router]);

  const customMsg = maintenance?.customMessage || 'We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.';
  const estTime = maintenance?.estimatedTime || 'Expected back online: Today at 6:00 PM IST';
  const showEmergency = maintenance?.showEmergencyContact !== false;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f4f7f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px 96px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e2824',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes dzSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dzPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '620px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        border: '1px solid #e5ebe7',
        padding: '36px 32px',
        boxSizing: 'border-box',
      }}>
        {/* Header Pill & Logo Mark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#e8f5ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheckIcon size={22} color="#1e5038" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e5038', letterSpacing: '-0.02em' }}>DENTZY</div>
              <div style={{ fontSize: '0.72rem', color: '#708c80', fontWeight: 600, letterSpacing: '0.04em' }}>NAMRATA DENTAL SOLUTIONS</div>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: '#e8f5ee',
            color: '#1e5038',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#d97706',
              animation: 'dzPulseDot 2s infinite ease-in-out',
            }} />
            {getRoleBadge()}
          </div>
        </div>

        {/* Primary Headline & Safe Data Guarantee */}
        <h1 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: '#111827',
          lineHeight: 1.35,
          margin: '0 0 10px 0',
          letterSpacing: '-0.02em',
        }}>
          Dentzy is undergoing scheduled maintenance
        </h1>

        <p style={{
          fontSize: '0.95rem',
          color: '#374151',
          lineHeight: 1.55,
          margin: '0 0 20px 0',
        }}>
          We are upgrading our clinical infrastructure to serve your cases faster and with greater precision.
        </p>

        {/* Data Safety Assurance Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f0f7f3',
          border: '1px solid #d8e6df',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '20px',
        }}>
          <ShieldCheckIcon size={20} color="#1e5038" />
          <div style={{ fontSize: '0.86rem', color: '#1a3028', fontWeight: 600, lineHeight: 1.4 }}>
            Your patient files, 3D scans, and active orders are completely safe and encrypted.
          </div>
        </div>

        {/* Dynamic Admin Announcement Card */}
        {customMsg && (
          <div style={{
            background: '#fbfdfc',
            border: '1px solid #e2ece6',
            borderRadius: '14px',
            padding: '18px 20px',
            marginBottom: '20px',
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#708c80',
              marginBottom: '6px',
            }}>
              Lab Announcement
            </div>
            <div style={{
              fontSize: '0.92rem',
              color: '#1f2937',
              lineHeight: 1.5,
              fontWeight: 500,
            }}>
              {customMsg}
            </div>
          </div>
        )}

        {/* Estimated Restoration Time Badge */}
        {estTime && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#e8f5ee',
            border: '1px solid #cce5d6',
            borderRadius: '9999px',
            padding: '8px 16px',
            fontSize: '0.84rem',
            color: '#1e5038',
            fontWeight: 700,
            marginBottom: '24px',
          }}>
            <ClockIcon size={16} color="#1e5038" />
            <span>{estTime}</span>
          </div>
        )}

        {/* Interactive "Check If Portal Is Live" Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleLiveCheck}
            disabled={checking}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '12px',
              background: '#1e5038',
              color: '#ffffff',
              border: 'none',
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s, transform 0.1s',
              boxShadow: '0 2px 8px rgba(30, 80, 56, 0.2)',
            }}
            onMouseOver={(e) => { if (!checking) e.currentTarget.style.background = '#174230'; }}
            onMouseOut={(e) => { if (!checking) e.currentTarget.style.background = '#1e5038'; }}
          >
            {checking ? (
              <>
                <SpinnerIcon size={18} />
                <span>Checking Portal Status...</span>
              </>
            ) : (
              <>
                <Ico.refresh size={16} />
                <span>Check If Portal Is Live</span>
              </>
            )}
          </button>

          {feedback && (
            <div style={{
              fontSize: '0.82rem',
              color: '#4a7060',
              fontWeight: 600,
              textAlign: 'center',
              marginTop: '10px',
            }}>
              {feedback}
            </div>
          )}
        </div>

        {/* Emergency Contact Section */}
        {showEmergency && (
          <div style={{
            borderTop: '1px solid #e5ebe7',
            paddingTop: '20px',
            marginTop: '8px',
          }}>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#1a3028',
              marginBottom: '12px',
            }}>
              Urgent Clinical Support & Rush Case Desk
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              <a
                href="tel:+919503668112"
                style={{
                  minHeight: '46px',
                  borderRadius: '10px',
                  background: '#f4f7f5',
                  color: '#1e5038',
                  border: '1px solid #dce5df',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e8f5ee'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f4f7f5'}
              >
                <PhoneCallIcon size={16} color="#1e5038" />
                <span>Call Lab (+91 95036 68112)</span>
              </a>

              <a
                href="https://wa.me/919503668112"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minHeight: '46px',
                  borderRadius: '10px',
                  background: '#1e5038',
                  color: '#ffffff',
                  border: 'none',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#174230'}
                onMouseOut={(e) => e.currentTarget.style.background = '#1e5038'}
              >
                <WhatsAppIcon size={16} color="#ffffff" />
                <span>WhatsApp Urgent Desk</span>
              </a>
            </div>

            <div style={{
              fontSize: '0.74rem',
              color: '#708c80',
              marginTop: '12px',
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              Dentzy by Namrata Dental Solutions, Dindayal Nagar, Vasai West - 401202, Maharashtra
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '24px',
          borderTop: '1px solid #f0f4f2',
          paddingTop: '16px',
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#4a7060',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Ico.arrowLeft size={14} />
            <span>Return to Homepage</span>
          </Link>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#1e5038',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span>Switch Role / Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
