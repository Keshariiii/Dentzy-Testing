'use client';
// ponytail: Bespoke 21st.dev Maintenance Mode Controller for Admin with safety modal and zero emojis
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BaseModal from '../components/ui/BaseModal';
import { Ico } from '../components/common/DashboardIcons';

const DentistRoleIcon = ({ size = 20, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const StaffRoleIcon = ({ size = 20, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="9" y1="14" x2="13" y2="14" />
  </svg>
);

const BothRoleIcon = ({ size = 20, color = '#1e5038' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const AlertTriangleIcon = ({ size = 24, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SpinnerIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'dzSpin 0.9s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const TARGET_OPTIONS = [
  {
    id: 'dentists',
    title: 'Dentists Only',
    desc: 'Dentists see the Under Maintenance page and cannot log in or submit cases. Staff and Admins work normally.',
    icon: DentistRoleIcon,
  },
  {
    id: 'staff',
    title: 'Staff Only',
    desc: 'Lab Staff see the Under Maintenance page and cannot alter stages or orders. Dentists and Admins work normally.',
    icon: StaffRoleIcon,
  },
  {
    id: 'both',
    title: 'Both (Dentists & Staff)',
    desc: 'Both Dentists and Staff are locked out. Only Admin can access the platform.',
    icon: BothRoleIcon,
  },
];

export default function MaintenanceModeController({
  ADMIN_API,
  authFetch,
  showToast,
  onConfigChanged,
}) {
  const [config, setConfig] = useState({
    enabled: false,
    target: 'both',
    customMessage: '',
    estimatedTime: '',
    showEmergencyContact: true,
    updated_at: null,
    updated_by: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const onConfigChangedRef = useRef(onConfigChanged);
  useEffect(() => {
    onConfigChangedRef.current = onConfigChanged;
  }, [onConfigChanged]);

  const authFetchRef = useRef(authFetch);
  useEffect(() => {
    authFetchRef.current = authFetch;
  }, [authFetch]);

  // Fetch current maintenance settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const fetchFn = authFetchRef.current || authFetch;
      const res = await fetchFn(`${ADMIN_API}/settings/maintenance`);
      if (res && res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          enabled: Boolean(data?.enabled),
          target: ['dentists', 'staff', 'both'].includes(data?.target) ? data.target : 'both',
          customMessage: typeof data?.customMessage === 'string' ? data.customMessage : prev.customMessage,
          estimatedTime: typeof data?.estimatedTime === 'string' ? data.estimatedTime : prev.estimatedTime,
          showEmergencyContact: data?.showEmergencyContact !== false,
          updated_at: data?.updated_at || data?.updatedAt || null,
          updated_by: data?.updated_by || data?.updatedBy || null,
        }));
        if (typeof onConfigChangedRef.current === 'function') {
          onConfigChangedRef.current(data);
        }
      }
    } catch {
      if (typeof showToast === 'function') showToast('Failed to load maintenance settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [ADMIN_API, authFetch, showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save config to server
  const handleSave = useCallback(async (overrides = {}) => {
    setSaving(true);
    const payload = {
      enabled: overrides.enabled !== undefined ? overrides.enabled : config.enabled,
      target: overrides.target || config.target,
      customMessage: overrides.customMessage !== undefined ? overrides.customMessage : config.customMessage,
      estimatedTime: overrides.estimatedTime !== undefined ? overrides.estimatedTime : config.estimatedTime,
      showEmergencyContact: overrides.showEmergencyContact !== undefined ? overrides.showEmergencyContact : config.showEmergencyContact,
    };

    try {
      const fetchFn = authFetchRef.current || authFetch;
      const res = await fetchFn(`${ADMIN_API}/settings/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res && res.ok) {
        const data = await res.json();
        const updated = {
          ...config,
          ...payload,
          updated_at: data.updated_at || data.updatedAt,
          updated_by: data.updated_by || data.updatedBy,
        };
        setConfig(updated);
        if (typeof onConfigChangedRef.current === 'function') onConfigChangedRef.current(updated);
        if (typeof showToast === 'function') showToast('Maintenance settings saved successfully.', 'success');
      } else {
        const err = await res?.json?.().catch(() => ({})) || {};
        if (typeof showToast === 'function') showToast(err.message || 'Failed to save maintenance settings.', 'error');
      }
    } catch {
      if (typeof showToast === 'function') showToast('Network error saving maintenance settings.', 'error');
    } finally {
      setSaving(false);
      setConfirmModalOpen(false);
    }
  }, [ADMIN_API, authFetch, config, showToast]);

  // Master power toggle click handler
  const handleToggleClick = () => {
    if (!config.enabled) {
      // Activating requires confirmation safety modal
      setConfirmModalOpen(true);
    } else {
      // Disabling applies immediately
      handleSave({ enabled: false });
    }
  };

  // Quick fill time helper
  const handleQuickFill = (type) => {
    const now = new Date();
    if (type === '30m') {
      const target = new Date(now.getTime() + 30 * 60 * 1000);
      const timeStr = target.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      setConfig(prev => ({ ...prev, estimatedTime: `Expected back online: Today at ${timeStr} IST` }));
    } else if (type === '1h') {
      const target = new Date(now.getTime() + 60 * 60 * 1000);
      const timeStr = target.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      setConfig(prev => ({ ...prev, estimatedTime: `Expected back online: Today at ${timeStr} IST` }));
    } else if (type === '2h') {
      const target = new Date(now.getTime() + 120 * 60 * 1000);
      const timeStr = target.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      setConfig(prev => ({ ...prev, estimatedTime: `Expected back online: Today at ${timeStr} IST` }));
    } else if (type === '6pm') {
      setConfig(prev => ({ ...prev, estimatedTime: 'Expected back online: Today at 6:00 PM IST' }));
    }
  };

  const getTargetLabel = (tgt) => {
    if (tgt === 'dentists') return 'Dentists Only';
    if (tgt === 'staff') return 'Staff Only';
    return 'Both Dentists & Staff';
  };

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '16px',
      border: '1px solid var(--border)',
      padding: '28px',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes dzSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dzPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
      `}</style>

      {/* ── Section Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            Maintenance Mode Controller
          </h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.84rem', margin: '4px 0 0' }}>
            Control portal access during system upgrades, server maintenance, or milling machine calibrations.
          </p>
        </div>

        {/* Live Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: config.enabled ? '#fee2e2' : '#dcfce7',
          color: config.enabled ? '#991b1b' : '#166534',
          fontSize: '0.82rem',
          fontWeight: 700,
        }}>
          {loading ? (
            <SpinnerIcon size={12} />
          ) : (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: config.enabled ? '#dc2626' : '#16a34a',
              animation: config.enabled ? 'dzPulseDot 1.5s infinite ease-in-out' : 'none',
            }} />
          )}
          <span>{loading ? 'Syncing...' : config.enabled ? 'Maintenance Mode Active' : 'Live (Normal Operation)'}</span>
        </div>
      </div>

      {/* ── Master Power Toggle Card ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: config.enabled ? '#fff5f5' : '#f8faf9',
        border: `1px solid ${config.enabled ? '#fecaca' : '#e2ece6'}`,
        borderRadius: '14px',
        marginBottom: '28px',
        transition: 'all 0.2s',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: config.enabled ? '#991b1b' : '#1a3028' }}>
            Master Maintenance Switch
          </div>
          <div style={{ fontSize: '0.82rem', color: config.enabled ? '#b91c1c' : '#6b8a7a', marginTop: '3px' }}>
            {config.enabled
              ? 'Access is currently restricted for targeted users. Click toggle to immediately restore normal operation.'
              : 'Turn on to temporarily block targeted portal access with reassuring clinical messages.'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleClick}
          disabled={saving}
          aria-label="Toggle maintenance mode"
          style={{
            width: '56px',
            height: '30px',
            borderRadius: '15px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            position: 'relative',
            background: config.enabled ? '#dc2626' : '#d1d5db',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: config.enabled ? '29px' : '3px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--card)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* ── Target Selector (3-Card Radio Group) ── */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)', marginBottom: '10px' }}>
          Target Audience (Who is locked out?)
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {TARGET_OPTIONS.map((opt) => {
            const isSelected = config.target === opt.id;
            const IconComponent = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => setConfig(prev => ({ ...prev, target: opt.id }))}
                style={{
                  background: isSelected ? '#f0f7f3' : '#ffffff',
                  border: `2px solid ${isSelected ? '#1e5038' : '#e5ebe7'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? '#e8f5ee' : '#f4f6f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconComponent size={18} color={isSelected ? '#1e5038' : '#708c80'} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#1e5038' : '#111827' }}>
                      {opt.title}
                    </span>
                  </div>

                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#1e5038' : '#cbd5e1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.45 }}>
                  {opt.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Custom Visitor Announcement ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)' }}>
            Custom Announcement Message
          </label>
          <span style={{ fontSize: '0.75rem', color: (config?.customMessage || '').length > 450 ? '#dc2626' : '#708c80', fontWeight: 600 }}>
            {(config?.customMessage || '').length}/500
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={500}
          value={config?.customMessage || ''}
          onChange={(e) => setConfig({ ...config, customMessage: e.target.value })}
          placeholder="e.g., We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #d1dbd5',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            color: '#1f2937',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
          onFocus={(e) => e.target.style.borderColor = '#1e5038'}
          onBlur={(e) => e.target.style.borderColor = '#d1dbd5'}
        />
        <div style={{ fontSize: '0.76rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
          This message will be prominently displayed inside the Announcement card on the Under Maintenance screen.
        </div>
      </div>

      {/* ── Estimated Restoration Time ── */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)', marginBottom: '8px' }}>
          Estimated Restoration Time
        </label>
        <input
          type="text"
          maxLength={150}
          value={config?.estimatedTime || ''}
          onChange={(e) => setConfig({ ...config, estimatedTime: e.target.value })}
          placeholder="Expected back online: Today at 6:00 PM IST"
          style={{
            width: '100%',
            height: '44px',
            padding: '0 14px',
            borderRadius: '10px',
            border: '1px solid #d1dbd5',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            color: '#1f2937',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = '#1e5038'}
          onBlur={(e) => e.target.style.borderColor = '#d1dbd5'}
        />

        {/* Quick Fill Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Quick presets:</span>
          {[
            { id: '30m', label: '+30 mins' },
            { id: '1h', label: '+1 hour' },
            { id: '2h', label: '+2 hours' },
            { id: '6pm', label: 'Today at 6:00 PM IST' },
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleQuickFill(chip.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'var(--muted)',
                border: '1px solid #dce5df',
                color: 'var(--primary)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e8f5ee'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f4f7f5'}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Emergency Contact Toggle ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        marginBottom: '28px',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--foreground)' }}>
            Show Emergency Support & Rush Desk Contact
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
            Renders one-tap buttons for the Lab Hotline (+91 95036 68112) and WhatsApp Urgent Desk on the maintenance page.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfig(prev => ({ ...prev, showEmergencyContact: !prev.showEmergencyContact }))}
          aria-label="Toggle emergency contact"
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            background: config.showEmergencyContact ? '#1e5038' : '#d1d5db',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: config.showEmergencyContact ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'var(--card)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* ── Audit Metadata Footer & Save Action ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #eef3f0',
        paddingTop: '20px',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
          {config.updated_at ? (
            <>Last updated by <strong>{config.updated_by || 'admin'}</strong> on {new Date(config.updated_at).toLocaleString('en-IN')}</>
          ) : (
            <>Settings not yet modified</>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          style={{
            minHeight: '44px',
            padding: '0 24px',
            borderRadius: '10px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(30, 80, 56, 0.2)',
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => { if (!saving) e.currentTarget.style.background = '#174230'; }}
          onMouseOut={(e) => { if (!saving) e.currentTarget.style.background = '#1e5038'; }}
        >
          {saving ? (
            <>
              <SpinnerIcon size={16} />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              {Ico.check ? Ico.check(16) : null}
              <span>Save Maintenance Settings</span>
            </>
          )}
        </button>
      </div>

      {/* ── Safety Confirmation Modal ── */}
      <BaseModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="max-w-md"
        raw={true}
        id="ad-maintenance-confirm-modal"
      >
        <div style={{
          background: 'var(--card)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          fontFamily: 'Inter, -apple-system, sans-serif',
          maxWidth: '460px',
          width: '100%',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <AlertTriangleIcon size={26} color="#dc2626" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 8px 0' }}>
            Activate Maintenance Mode?
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            This will immediately restrict access for <strong>{getTargetLabel(config.target)}</strong>.
            Users will be presented with the clinical maintenance screen.
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '0.82rem',
            color: '#166534',
            fontWeight: 600,
            marginBottom: '24px',
            lineHeight: 1.45,
          }}>
            You (Administrator) will NEVER be locked out and can restore live operation at any moment.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              disabled={saving}
              style={{
                minHeight: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                background: '#f3f4f6',
                color: 'var(--foreground)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave({ enabled: true })}
              disabled={saving}
              style={{
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '10px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
              }}
            >
              {saving ? <SpinnerIcon size={16} /> : null}
              <span>Confirm & Activate</span>
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
