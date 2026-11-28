'use client';

// ponytail: Single shared Profile Hub + nested Settings view for both Dentist PC and Mobile portals
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../api/client';
import { Icons } from '../common/DashboardIcons';
import { DentzyCard, DentzyStatusPill } from '../common/DentzyCard';
import SubViewHeader from '../common/SubViewHeader';
import ChangePasswordCard from '../common/ChangePasswordCard';
import TwentyFirstNavCard from '../ui/twentyfirst-nav-card';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import BaseModal from '../ui/BaseModal';
import { safeShowPicker } from '../../utils/appleCompat';
import { formatDoctorName } from '../../utils/format';

const formatDob = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const msgBoxStyle = (type) => ({
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '0.82rem',
  fontWeight: 600,
  background: type === 'success' ? '#eef7f2' : '#fef2f2',
  color: type === 'success' ? '#166534' : '#dc2626',
});

const inputStyle = {
  width: '100%',
  height: '44px',
  borderRadius: '10px',
  border: '1px solid #d2ded7',
  padding: '0 12px',
  fontSize: '0.9rem',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
};

export default function DentistProfileView({
  initialSubView = null,
  resetTick = 0,
  onLogout,
  isMobile = false,
}) {
  const { user, updateUserState, API_URL } = useAuth();
  const { showToast } = useToast();

  // Sub-view navigation: null (Profile Details + Settings) | 'settings'
  const [subView, setSubView] = useState(initialSubView);
  useEffect(() => {
    setSubView(initialSubView);
    if (!initialSubView) setIsEditingProfile(false);
  }, [initialSubView, resetTick]);

  // ── Profile Form State ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: '',
    dob: '',
    phone: '',
    clinicName: '',
    address: '',
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // ── Password Form State ───────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [showChangePassword, setShowChangePassword] = useState(false);

  // ── Delete Account Modal State ────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        phone: user.phone || '',
        clinicName: user.clinicName || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const userName = user?.name || 'Doctor';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (profileForm.name.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }
    if (profileForm.phone && profileForm.phone.trim().length > 0 && profileForm.phone.trim().length < 7) {
      setProfileMsg({ type: 'error', text: 'Phone number is too short.' });
      return;
    }

    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const data = await apiFetch(`${API_URL}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          dob: profileForm.dob || null,
          phone: profileForm.phone,
          clinicName: profileForm.clinicName,
          address: profileForm.address,
        }),
      });
      updateUserState(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      showToast('Profile updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (err) {
      const msg = err.message || 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: msg });
      showToast(msg, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (submittedForm = pwForm, e) => {
    e?.preventDefault?.();
    const activeForm = submittedForm && typeof submittedForm.preventDefault !== 'function' ? submittedForm : pwForm;
    setPwMsg({ type: '', text: '' });
    if (activeForm.newPassword !== activeForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const data = await apiFetch(`${API_URL}/change-password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: activeForm.currentPassword,
          newPassword: activeForm.newPassword,
        }),
      });
      const msg = data.message || 'Password changed successfully!';
      setPwMsg({ type: 'success', text: msg });
      showToast(msg, 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPwMsg({ type: '', text: '' });
      }, 1800);
    } catch (err) {
      const msg = err.message || 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
      showToast(msg, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg({ type: '', text: '' });
    setDeleting(true);
    try {
      await apiFetch(`${API_URL}/profile`, {
        method: 'DELETE',
        body: JSON.stringify({ password: deleteConfirm }),
      });
      onLogout?.();
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message || 'Failed to delete account.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: isMobile ? '90px' : '32px',
      }}
    >
      {/* ── LANDING: Profile Details + Settings + Logout ──────────────────── */}
      {subView === null && (
        <>
          <h2 style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 800, color: '#1a3028', margin: 0 }}>
            Profile
          </h2>

          <DentzyCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #f0f4f2', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1a3028' }}>{formatDoctorName(userName)}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{user?.email}</div>
              </div>
              {!isEditingProfile && (
                <TwentyFirstIconButton
                  id="edit-profile-btn"
                  icon={Icons.pencil(15)}
                  title="Edit Profile"
                  ariaLabel="Edit Profile"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setProfileMsg({ type: '', text: '' });
                  }}
                  size="md"
                  variant="soft"
                />
              )}
            </div>

            {!isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: 'Full Name', value: formatDoctorName(user?.name, '—'), icon: Icons.user(12) },
                  { label: 'Date of Birth', value: formatDob(user?.dob), icon: Icons.calendar(12) },
                  { label: 'Email', value: user?.email || '—', icon: Icons.mail(12), verified: true },
                  { label: 'Phone', value: user?.phone || '—', icon: Icons.phone(12) },
                  { label: 'Clinic Name', value: user?.clinicName || '—', icon: Icons.clinic(12) },
                  { label: 'Address', value: user?.address || '—', icon: Icons.map(12) },
                ].map((row, idx, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f0f4f2',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#708c80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {row.icon} {row.label}
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1a3028', textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {row.value}
                      {row.verified && (
                        <DentzyStatusPill type="account" status="approved" label="Verified" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleProfileSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <div>
                  <label htmlFor="settings-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    maxLength={60}
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="settings-dob" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', marginBottom: '5px' }}>
                    Date of Birth
                  </label>
                  <input
                    id="settings-dob"
                    type="date"
                    value={profileForm.dob}
                    data-empty={!profileForm.dob}
                    onClick={safeShowPicker}
                    onChange={(e) => setProfileForm((p) => ({ ...p, dob: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label htmlFor="settings-phone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', marginBottom: '5px' }}>
                    Phone
                  </label>
                  <input
                    id="settings-phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Your phone number"
                    maxLength={20}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="settings-clinic" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', marginBottom: '5px' }}>
                    Clinic Name
                  </label>
                  <input
                    id="settings-clinic"
                    type="text"
                    value={profileForm.clinicName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, clinicName: e.target.value }))}
                    placeholder="Your clinic or practice name"
                    maxLength={100}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="settings-address" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', marginBottom: '5px' }}>
                    Address
                  </label>
                  <textarea
                    id="settings-address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Clinic address"
                    maxLength={300}
                    rows={2}
                    style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                  />
                </div>
                {profileMsg.text && (
                  <div style={msgBoxStyle(profileMsg.type)}>
                    {profileMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileMsg({ type: '', text: '' });
                    }}
                    disabled={profileSaving}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #d2ded7', background: '#fff', color: '#4a5c54', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#1e5038', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px', opacity: profileSaving ? 0.7 : 1 }}
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </DentzyCard>

          <TwentyFirstNavCard
            label="Settings"
            desc="Change password, account security, and delete account"
            icon={Icons.settings(20)}
            onClick={() => setSubView('settings')}
          />

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                marginTop: '4px',
                minHeight: '46px',
                width: '100%',
                borderRadius: '14px',
                border: '1px solid #fecaca',
                background: '#fff5f5',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              {Icons.logout(16)}
              <span>Log Out</span>
            </button>
          )}
        </>
      )}

      {/* ── SUB-VIEW 2: Settings (Password & Delete Account) ──────────────── */}
      {subView === 'settings' && (
        <>
          <SubViewHeader
            title="Settings"
            subtitle="Profile / Security & Account"
            backLabel="Back to Profile"
            style={{ marginBottom: '4px' }}
            onBack={() => {
              setSubView(null);
              setIsEditingProfile(false);
              setShowChangePassword(false);
              setProfileMsg({ type: '', text: '' });
              setPwMsg({ type: '', text: '' });
            }}
          />

          <ChangePasswordCard
            onSubmit={handlePasswordChange}
            saving={pwSaving}
            msg={pwMsg}
            showPwState={showPw}
            onToggleShowPw={(key) => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
            pwForm={pwForm}
            onFormChange={(field, value) => {
              setPwForm((p) => ({ ...p, [field]: value }));
              if (pwMsg.text) setPwMsg({ type: '', text: '' });
            }}
            collapsible={true}
            isOpen={showChangePassword}
            onToggleOpen={(nextOpen) => {
              setShowChangePassword(nextOpen);
              setPwMsg({ type: '', text: '' });
              setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            showForgotLink={true}
            forgotHref="/forgot-password"
            idPrefix="pw"
            style={{ padding: '20px' }}
            footerSlot={
              <>
                <div style={{ height: '1px', background: '#f0f4f2', margin: '16px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 700, color: '#dc2626' }}>
                      {Icons.trash(14)} Delete Account
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Permanently remove your account and data.</div>
                  </div>
                  <button
                    id="delete-account-btn"
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteMsg({ type: '', text: '' });
                      setDeleteConfirm('');
                    }}
                    style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', minHeight: isMobile ? '44px' : '38px' }}
                  >
                    Delete
                  </button>
                </div>
              </>
            }
          />

          <BaseModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Account?"
            subtitle="Permanent Action Advisory"
            maxWidth="max-w-md"
            id="ud-delete-modal"
            footer={
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #d2ded7', background: '#fff', color: '#4a5c54', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deleteConfirm}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', minHeight: '44px', opacity: deleting || !deleteConfirm ? 0.6 : 1 }}
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            }
          >
            <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Icons.warn(26)}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#4a5c54', lineHeight: 1.5 }}>
                This will permanently delete your account and all associated data. Enter your password to confirm.
              </p>
              <input
                id="delete-confirm-password"
                type="password"
                style={inputStyle}
                placeholder="Enter your password"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                autoFocus
              />
              {deleteMsg.text && (
                <div style={msgBoxStyle(deleteMsg.type)}>
                  {deleteMsg.text}
                </div>
              )}
            </div>
          </BaseModal>
        </>
      )}
    </div>
  );
}
