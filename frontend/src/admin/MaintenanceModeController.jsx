'use client';
// ponytail: Bespoke 21st.dev Maintenance Mode Controller for Admin with safety modal and zero emojis
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BaseModal from '../components/ui/BaseModal';
import { Ico } from '../components/common/DashboardIcons';
import { MaintenanceControllerSkeleton } from '../components/SkeletonBlocks';
import { DentzyCard } from '../components/common/DentzyCard';
import ToggleSwitch from '../components/common/ToggleSwitch';

const TARGET_OPTIONS = [
  {
    id: 'dentists',
    title: 'Dentists Only',
    desc: 'Dentists see the Under Maintenance page and cannot log in or submit cases. Staff and Admins work normally.',
    renderIcon: () => Ico.user(18),
  },
  {
    id: 'staff',
    title: 'Staff Only',
    desc: 'Lab Staff see the Under Maintenance page and cannot alter stages or orders. Dentists and Admins work normally.',
    renderIcon: () => Ico.orders(18),
  },
  {
    id: 'both',
    title: 'Both (Dentists & Staff)',
    desc: 'Both Dentists and Staff are locked out. Only Admin can access the platform.',
    renderIcon: () => Ico.lock(18),
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

  const [loading, setLoading] = useState(true);
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

  const fetchConfig = fetchSettings;

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

  if (loading) {
    return <MaintenanceControllerSkeleton />;
  }

  return (
    <DentzyCard style={{
      padding: '28px',
      fontFamily: 'var(--dz-font-family)',
    }}>
      {/* ── Section Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a3028', margin: 0 }}>
            Maintenance Mode Controller
          </h3>
          <p style={{ color: '#6b8a7a', fontSize: '0.84rem', margin: '4px 0 0' }}>
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
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.enabled ? '#dc2626' : '#16a34a',
            animation: config.enabled ? 'pulse-dot 1.5s infinite ease-in-out' : 'none',
          }} />
          <span>{config.enabled ? 'Maintenance Mode Active' : 'Live (Normal Operation)'}</span>
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

        <ToggleSwitch
          checked={config.enabled}
          onChange={handleToggleClick}
          disabled={saving}
          ariaLabel="Toggle maintenance mode"
          variant="danger"
          size="lg"
        />
      </div>

      {/* ── Target Selector (3-Card Radio Group) ── */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#1a3028', marginBottom: '10px' }}>
          Target Audience (Who is locked out?)
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {TARGET_OPTIONS.map((opt) => {
            const isSelected = config.target === opt.id;
            return (
              <DentzyCard
                key={opt.id}
                interactive
                onClick={() => setConfig(prev => ({ ...prev, target: opt.id }))}
                style={{
                  background: isSelected ? '#f0f7f3' : '#ffffff',
                  border: `2px solid ${isSelected ? '#1e5038' : '#e5ebe7'}`,
                  borderRadius: '12px',
                  padding: '16px',
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
                      color: isSelected ? '#1e5038' : '#708c80',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {opt.renderIcon()}
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
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e5038' }} />
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.45 }}>
                  {opt.desc}
                </div>
              </DentzyCard>
            );
          })}
        </div>
      </div>

      {/* ── Custom Visitor Announcement ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a3028' }}>
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
        <div style={{ fontSize: '0.76rem', color: '#6b8a7a', marginTop: '4px' }}>
          This message will be prominently displayed inside the Announcement card on the Under Maintenance screen.
        </div>
      </div>

      {/* ── Estimated Restoration Time ── */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#1a3028', marginBottom: '8px' }}>
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
          <span style={{ fontSize: '0.75rem', color: '#708c80', fontWeight: 600 }}>Quick presets:</span>
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
                background: '#f4f7f5',
                border: '1px solid #dce5df',
                color: '#1e5038',
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
        background: '#f8faf9',
        border: '1px solid #e2ece6',
        borderRadius: '12px',
        marginBottom: '28px',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a3028' }}>
            Show Emergency Support & Rush Desk Contact
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6b8a7a', marginTop: '2px' }}>
            Renders one-tap buttons for the Lab Hotline (+91 95036 68112) and WhatsApp Urgent Desk on the maintenance page.
          </div>
        </div>

        <ToggleSwitch
          checked={config.showEmergencyContact}
          onChange={(checked) => setConfig(prev => ({ ...prev, showEmergencyContact: checked }))}
          ariaLabel="Toggle emergency contact"
          variant="primary"
          size="md"
        />
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
        <div style={{ fontSize: '0.78rem', color: '#708c80' }}>
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
            background: '#1e5038',
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
              <span className="dz-spinner dz-spinner--sm dz-spinner--light" />
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
        title="Activate Maintenance Mode?"
        subtitle="Clinical Access Restriction Advisory"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              disabled={saving}
              style={{
                minHeight: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                background: '#f3f4f6',
                color: '#374151',
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
              {saving ? <span className="dz-spinner dz-spinner--sm dz-spinner--light" /> : null}
              <span>Confirm & Activate</span>
            </button>
          </div>
        }
        maxWidth="max-w-md"
        id="ad-maintenance-confirm-modal"
      >
        <div style={{ padding: '4px 0' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            {Ico.warn(26)}
          </div>

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
            lineHeight: 1.45,
          }}>
            You (Administrator) will NEVER be locked out and can restore live operation at any moment.
          </div>
        </div>
      </BaseModal>
    </DentzyCard>
  );
}
