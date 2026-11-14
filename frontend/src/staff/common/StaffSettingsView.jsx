'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '../StaffAuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons as Ico } from '../../components/common/DashboardIcons';
import '../StaffDashboard.css';

/**
 * StaffSettingsView — Unified, isolated settings screen for all staff roles.
 *
 * Requirements:
 * 1. Profile Information Card:
 *    - Read-only locked fields with Ico.lock(12): Employee ID, Username, Designation.
 *    - Editable fields: Full Name (displayName), Email (email), Phone (phone), Date of Birth (dob).
 *    - Save Changes button calling PUT /api/staff/profile.
 * 2. Security & Password Card:
 *    - Change Password form calling PUT /api/staff/change-password.
 *    - Current password, new password (min 6), confirm password, and eye visibility toggles.
 * 3. Zero delete button anywhere (no self-deletion).
 * 4. Account Session Card:
 *    - Clear Logout button (Ico.logout(16) + "Log Out of Staff Portal") calling staffLogout() and router.push('/login?role=staff').
 */
export default function StaffSettingsView() {
  const router = useRouter();
  const { staff, staffLogout, updateStaffState, authFetch, STAFF_API } = useStaffAuth();
  const { showToast } = useToast();

  const apiBase = STAFF_API || '/api/staff';

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
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!pwForm.currentPassword) {
      showToast('Current password is required.', 'error');
      return;
    }
    if (!pwForm.newPassword) {
      showToast('New password is required.', 'error');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPwSaving(true);
    try {
      const res = await authFetch(`${apiBase}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
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
    <div className="sd-settings-wrapper" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      
      {/* ── CARD 1: Profile Information ──────────────────────────────────── */}
      <div className="sd-settings-card" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #eef2f0' }}>
        
        {/* Header with Avatar & Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #f0f5f2' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e5038 0%, #2a7b55 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.15rem',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
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
                <span
                  style={{
                    display: 'inline-block',
                    background: '#eef6f2',
                    color: '#1e5038',
                    padding: '2px 9px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  {staff?.designation || '—'}
                </span>
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
                onClick={(e) => e.currentTarget.showPicker?.()}
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
      </div>

      {/* ── CARD 2: Security & Password ──────────────────────────────────── */}
      <div className="sd-settings-card" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #eef2f0' }}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
            Security & Password
          </h3>
          <p style={{ fontSize: '0.83rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Update your account password. Must be at least 6 characters.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Current Password */}
          <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Current Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPw.current ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #d2ded7',
                  padding: '0 42px 0 12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#fff',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}
                aria-label={showPw.current ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#708c80',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {Ico.eye(16, showPw.current)}
              </button>
            </div>
          </div>

          {/* New Password & Confirm Password Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {/* New Password */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #d2ded7',
                    padding: '0 42px 0 12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                  aria-label={showPw.new ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#708c80',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {Ico.eye(16, showPw.new)}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="sd-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2d3748' }}>Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #d2ded7',
                    padding: '0 42px 0 12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                  aria-label={showPw.confirm ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#708c80',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {Ico.eye(16, showPw.confirm)}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={pwSaving}
              style={{
                background: '#1e5038',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 22px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: pwSaving ? 'not-allowed' : 'pointer',
                opacity: pwSaving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
            >
              {pwSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* ── CARD 3: Account Session ──────────────────────────────────────── */}
      <div className="sd-settings-card" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #eef2f0' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3028', margin: 0 }}>
              Account Session
            </h3>
            <p style={{ fontSize: '0.83rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Securely sign out of your active staff portal session on this device.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              minWidth: '200px',
            }}
          >
            {Ico.logout(16)}
            <span>{loggingOut ? 'Logging out...' : 'Log Out of Staff Portal'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
