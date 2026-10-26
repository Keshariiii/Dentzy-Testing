'use client';

// ponytail: 21st.dev error-5 Under Maintenance component in Dentzy brand styling
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, RefreshCw, MessageSquare, PhoneCall, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMaintenance } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';

export default function Error5({
  role = 'dentist',
  customMessage: propCustomMessage,
  estimatedTime: propEstimatedTime,
  showEmergencyContact: propShowEmergency,
  onRestored,
}) {
  const router = useRouter();
  const maintenanceCtx = useMaintenance();
  const maintenance = maintenanceCtx?.maintenance || {};
  const checkStatus = maintenanceCtx?.checkStatus;
  const isCheckingFromCtx = maintenanceCtx?.checking || false;

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const customMessage =
    propCustomMessage ||
    maintenance.customMessage ||
    'Dentzy is undergoing scheduled maintenance while we ship some improvements. Your patient files and lab orders are completely safe.';

  const estimatedTime =
    propEstimatedTime ||
    maintenance.estimatedTime ||
    'Expected back online: Today at 6:00 PM IST';

  const showEmergencyContact =
    propShowEmergency !== undefined
      ? propShowEmergency
      : maintenance.showEmergencyContact !== false;

  const handleRetry = useCallback(async () => {
    setFeedback(null);
    setChecking(true);
    try {
      if (typeof checkStatus === 'function') {
        const { isLive } = await checkStatus();
        if (isLive) {
          if (typeof onRestored === 'function') {
            onRestored();
          } else {
            router.refresh();
            if (typeof window !== 'undefined') window.location.reload();
          }
          return;
        }
      }
      const nowTime = new Date().toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setFeedback(`Maintenance is still in progress. Checked at ${nowTime}.`);
    } catch {
      setFeedback('Unable to reach server. Please try again shortly.');
    } finally {
      setChecking(false);
    }
  }, [checkStatus, onRestored, router]);

  return (
    <section
      className="min-h-svh w-full flex items-center justify-center px-6 py-16 relative"
      style={{
        backgroundColor: 'var(--dz-color-bg-page, #f4f7f5)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background radial accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(112, 140, 128, 0.18) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-lg w-full mx-auto flex flex-col items-center text-center">
        {/* Top Icon Box */}
        <div
          className="size-14 rounded-xl flex items-center justify-center shadow-xs mb-6 transition-transform hover:scale-105"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#eef6f2',
            border: '1px solid #c5ddd3',
            borderRadius: '14px',
          }}
        >
          <Wrench className="size-6" color="#1e5038" strokeWidth={2.2} />
        </div>

        {/* Badge */}
        <Badge
          variant="secondary"
          className="mb-4 text-xs font-semibold px-3 py-1 uppercase tracking-wider"
          style={{
            backgroundColor: '#eef6f2',
            color: '#1e5038',
            borderColor: '#c5ddd3',
          }}
        >
          {role === 'staff'
            ? 'Lab Operations Maintenance'
            : role === 'dentist'
            ? 'Clinical Portal Maintenance'
            : 'Scheduled Maintenance'}
        </Badge>

        {/* Heading */}
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3"
          style={{ color: '#1e2824', fontSize: '2rem', lineHeight: 1.25 }}
        >
          We'll be right back
        </h1>

        {/* Description */}
        <p
          className="text-sm md:text-base mb-6 leading-relaxed max-w-md"
          style={{ color: '#64748b' }}
        >
          {customMessage}
        </p>

        {/* Clinical Safe Storage Reassurance */}
        <div
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg mb-4 text-xs font-medium"
          style={{
            backgroundColor: 'rgba(30, 80, 56, 0.05)',
            color: '#1e5038',
            border: '1px solid #c5ddd3',
          }}
        >
          <ShieldCheck className="size-4 shrink-0 text-[#1e5038]" />
          <span>Rest assured, your cases, patient records, and STL files are completely safe.</span>
        </div>

        {/* Estimated Time Card */}
        <div
          className="w-full py-3 px-5 rounded-xl text-xs md:text-sm mb-6 border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e0ebe5',
            color: '#1e2824',
            boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <span className="text-[#64748b]">Scheduled completion: </span>
          <span className="font-semibold tabular-nums" style={{ color: '#1e5038' }}>
            {estimatedTime}
          </span>
        </div>

        {/* Live Feedback Message */}
        {feedback && (
          <div
            className="mb-6 text-xs font-semibold px-3 py-1.5 rounded-md animate-fade-in"
            style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
          >
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Primary Refresh / Status Button */}
          <Button
            type="button"
            onClick={handleRetry}
            disabled={checking || isCheckingFromCtx}
            className="min-h-[44px] px-6 rounded-lg font-semibold shadow-xs"
            style={{
              backgroundColor: '#1e5038',
              color: '#ffffff',
            }}
          >
            <RefreshCw
              className={cn('size-4 mr-2', (checking || isCheckingFromCtx) && 'animate-spin')}
            />
            {checking || isCheckingFromCtx ? 'Checking Status...' : 'Check Status / Refresh'}
          </Button>

          {/* Emergency WhatsApp / Hotline Desk */}
          {showEmergencyContact && (
            <a
              href="https://wa.me/919503668112"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg text-sm font-semibold transition-colors border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#708c80',
                color: '#1e5038',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eef6f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <MessageSquare className="size-4 mr-2 text-[#1e5038]" />
              WhatsApp Rush Desk
            </a>
          )}
        </div>

        {/* Secondary Contact & Back to Home */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: '#64748b' }}>
          {showEmergencyContact && (
            <>
              <a
                href="tel:+919503668112"
                className="hover:underline flex items-center gap-1 font-medium text-[#1e5038]"
              >
                <PhoneCall className="size-3.5" />
                <span>+91 95036 68112</span>
              </a>
              <span className="text-[#cbd5e1]">•</span>
            </>
          )}
          <Link href="/" className="hover:underline font-medium text-[#708c80] hover:text-[#1e5038]">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
