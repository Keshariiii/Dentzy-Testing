'use client';

// ponytail: Minimal Cloudflare-style Maintenance view preserving retry, ETA, and WhatsApp rush desk
import React, { useState, useCallback } from 'react';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import PortalStatusPage, {
  statusBtnPrimaryStyle,
  statusBtnSecondaryStyle,
} from '@/components/common/PortalStatusPage';

export default function Error5({
  role = 'dentist',
  customMessage: propCustomMessage,
  estimatedTime: propEstimatedTime,
  showEmergencyContact: propShowEmergency,
  onRestored,
}) {
  const maintenanceCtx = useMaintenance();
  const maintenance = maintenanceCtx?.maintenance || {};
  const checkStatus = maintenanceCtx?.checkStatus;
  const isCheckingFromCtx = maintenanceCtx?.checking || false;

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const customMessage =
    propCustomMessage ||
    maintenance.customMessage ||
    'Dentzy is undergoing scheduled maintenance while we ship improvements. Your patient files and lab orders are completely safe.';

  const estimatedTime =
    propEstimatedTime ||
    maintenance.estimatedTime ||
    'Expected back online: Today at 6:00 PM IST';

  const showEmergencyContact =
    propShowEmergency !== undefined
      ? propShowEmergency
      : maintenance.showEmergencyContact !== false;

  const portalBadge =
    role === 'staff'
      ? 'Staff Portal'
      : role === 'dentist'
      ? 'Clinical Portal'
      : 'Scheduled Maintenance';

  const handleRetry = useCallback(async () => {
    setFeedback(null);
    setChecking(true);
    try {
      if (typeof checkStatus === 'function') {
        const { isLive } = await checkStatus();
        if (isLive) {
          if (typeof onRestored === 'function') {
            onRestored();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
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
  }, [checkStatus, onRestored]);

  return (
    <PortalStatusPage
      pov={role === 'staff' ? 'lab' : role === 'dentist' ? 'dentist' : null}
      backHref="/"
      backLabel="Back to Home"
      portalBadge={portalBadge}
      eyebrow={`Scheduled Maintenance · ${estimatedTime}`}
      title="We'll be right back"
      paragraphs={[
        customMessage,
        'Rest assured, your cases, patient records, and STL files are completely safe.',
      ]}
      showSupportLine={showEmergencyContact}
      extra={
        feedback ? (
          <p
            style={{
              margin: 'var(--dz-space-4, 16px) 0 0',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--dz-color-warning-text, #92400e)',
            }}
          >
            {feedback}
          </p>
        ) : null
      }
      actions={
        <>
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking || isCheckingFromCtx}
            style={{
              ...statusBtnPrimaryStyle,
              opacity: checking || isCheckingFromCtx ? 0.75 : 1,
            }}
          >
            <RefreshCw size={15} className={(checking || isCheckingFromCtx) ? 'animate-spin' : ''} />
            <span>{checking || isCheckingFromCtx ? 'Checking Status...' : 'Check Status / Refresh'}</span>
          </button>

          {showEmergencyContact && (
            <a
              href="https://wa.me/919503668112"
              target="_blank"
              rel="noopener noreferrer"
              style={statusBtnSecondaryStyle}
            >
              <MessageSquare size={15} />
              <span>WhatsApp Rush Desk</span>
            </a>
          )}
        </>
      }
    />
  );
}
