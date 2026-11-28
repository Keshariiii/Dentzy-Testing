'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import TwentyFirstNavCard from '../../components/ui/twentyfirst-nav-card';
import { DentzyCard, DentzyStatusPill } from '../../components/common/DentzyCard';
import SubViewHeader from '../../components/common/SubViewHeader';
import ChangePasswordCard from '../../components/common/ChangePasswordCard';
import { safeShowPicker } from '../../utils/appleCompat';
import '../StaffDashboard.css';

/**
 * StaffSettingsView — Unified Profile Details + nested Settings screen for all 8 non-executive staff roles.
 *
 * Landing (subView === null): Identity + Locked & Editable Contact Details + Settings card + Logout.
 * Sub-view 'settings': Security & Password form (zero self-deletion).
 */
export default function StaffSettingsView({ resetTick = 0 }) {
  const router = useRouter();
  const { staff, staffLogout, updateStaffState, authFetch, STAFF_API } = useStaffAuth();
  const { showToast } = useToast();

  const apiBase = STAFF_API || '/api/staff';

  // Sub-view navigation: null (Profile Details + Settings) | 'settings'
  const [subView, setSubView] = useState(null);
  useEffect(() => {
    setSubView(null);
  }, [resetTick]);

  // ── Profile State ─────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    dob: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setProfileForm({
        displayName: staff.displayName || '',
        email: staff.email || '',
        phone: staff.phone || '',
        dob: staff.dob ? (staff.dob.length >= 10 ? staff.dob.slice(0, 10) : staff.dob) : '',
      });
    }
  }, [staff]);

  // ── Password State ────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ── Logout State ──────────────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Initials ──────────────────────────────────────────────────────────────
  const initials = ((staff?.displayName || staff?.username || 'S').match(/\b\w/g) || ['S'])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Profile Save Handler ──────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.displayName.trim()) {
      showToast('Full Name is required.', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await authFetch(`${apiBase}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: profileForm.displayName.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          dob: profileForm.dob || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.staff) {
          updateStaffState?.(data.staff);
        }
        showToast(data.message || 'Profile updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update profile.', 'error');
      }
    } catch {
      showToast('Network error while saving profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password Change Handler ───────────────────────────────────────────────
  const handlePasswordChange = async (submittedForm, e) => {
    e?.preventDefault?.();
    const targetForm =
      submittedForm && typeof submittedForm === 'object' && 'currentPassword' in submittedForm
        ? submittedForm
        : pwForm;

    if (!targetForm.currentPassword) {
      showToast('Current password is required.', 'error');
      return;
    }
    if (!targetForm.newPassword) {
      showToast('New password is required.', 'error');
      return;
    }
    if (targetForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (targetForm.newPassword !== targetForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPwSaving(true);
    try {
      const res = await authFetch(`${apiBase}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: targetForm.currentPassword,
          newPassword: targetForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password updated successfully.', 'success');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to update password.', 'error');
      }
    } catch {
      showToast('Network error while updating password.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Logout Handler ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await staffLogout();
    } catch {
      // ignore
    } finally {
      router.push('/login?role=staff');
    }
  };

  return (
    <div className="sd-settings-wrapper" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

      {/* ── LANDING: Staff Profile Details + Settings + Logout ───────────── */}
      {subView === null && (
        <>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3028', margin: 0 }}>My Profile</h2>
          <DentzyCard className="sd-settings-card">
        
        {/* Header with Avatar & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #f0f5f2' }}>
          <div className="dz-avatar dz-avatar--lg">
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a3028', margin: 0, lineHeight: 1.3 }}>
              {staff?.displayName || staff?.username || 'Staff Member'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
              {staff?.email || staff?.username ? `@${staff.username}` : 'Dentzy Staff Portal'}
            </p>
          </div>
        </div>

        {/* Read-only Locked Fields */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a7060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Administrative Identity (Locked)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
              background: '#f8faf9',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #e6f0eb',
            }}
          >
            {/* Employee ID */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: '#708c80' }}>
                <span style={{ color: '#1e5038', display: 'inline-flex' }}>{Ico.lock(12)}</span>
                <span>Employee ID</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1a3028', marginTop: '4px', fontFamily: 'monospace' }}>
                #{staff?.employeeId || '—'}
              </div>
            </div>

            {/* Username */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: '#708c80' }}>
                <span style={{ color: '#1e5038', display: 'inline-flex' }}>{Ico.lock(12)}</span>
                <span>Username</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1a3028', marginTop: '4px' }}>
                @{staff?.username || '—'}
              </div>
            </div>

            {/* Designation */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: '#708c80' }}>
                <span style={{ color: '#1e5038', display: 'inline-flex' }}>{Ico.lock(12)}</span>
                <span>Designation</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <DentzyStatusPill type="orders" label={staff?.designation || '—'} />
              </div>
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleProfileSave} style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a7060', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Editable Contact & Personal Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* Display Name */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Full Name</label>
              <input
                type="text"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Full Name"
                maxLength={80}
                required
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d2ded7',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fff',
                }}
              />
            </div>

            {/* Email */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="staff@dentzy.in"
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d2ded7',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fff',
                }}
              />
            </div>

            {/* Phone */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                maxLength={20}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d2ded7',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fff',
                }}
              />
            </div>

            {/* DOB */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Date of Birth</label>
              <input
                type="date"
                value={profileForm.dob}
                onChange={(e) => setProfileForm((p) => ({ ...p, dob: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                onClick={safeShowPicker}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d2ded7',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={profileSaving}
              style={{
                background: '#1e5038',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: profileSaving ? 'not-allowed' : 'pointer',
                opacity: profileSaving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
            >
              {profileSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DentzyCard>

          <TwentyFirstNavCard
            label="Settings"
            desc="Change your staff portal password and account security"
            icon={Ico.settings(20)}
            onClick={() => setSubView('settings')}
          />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              marginTop: '4px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '12px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '46px',
              width: '100%',
            }}
          >
            {Ico.logout(16)}
            <span>{loggingOut ? 'Logging out...' : 'Log Out of Staff Portal'}</span>
          </button>
        </>
      )}

      {/* ── SUB-VIEW 2: Settings (Security & Password) ───────────────────── */}
      {subView === 'settings' && (
        <>
          <SubViewHeader
            title="Settings"
            subtitle="My Profile / Security & Password"
            onBack={() => setSubView(null)}
            backLabel="Back to Profile"
            style={{ marginBottom: 0 }}
          />
          <ChangePasswordCard
            className="sd-settings-card"
            title="Security & Password"
            subtitle="Update your account password. Must be at least 6 characters."
            pwForm={pwForm}
            onFormChange={(field, value) => setPwForm((p) => ({ ...p, [field]: value }))}
            showPwState={showPw}
            onToggleShowPw={(key) => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
            onSubmit={handlePasswordChange}
            saving={pwSaving}
            minLength={6}
            submitLabel="Update Password"
            idPrefix="staff-pw"
          />
        </>
      )}

    </div>
  );
}
