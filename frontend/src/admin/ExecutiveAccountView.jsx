'use client';
import React, { useState, useEffect } from 'react';
import { getStaffUrl } from '../api/client';
import { Icons as Ico } from '../components/common/DashboardIcons';

export default function ExecutiveAccountView({
  admin,
  staff,
  authFetch,
  staffLogout,
  adminLogout,
  router,
  showToast,
  updateStaffState,
  setAdmin,
}) {
  const currentStaff = staff || admin;
  const [form, setForm] = useState({
    displayName: currentStaff?.displayName || currentStaff?.name || '',
    email: currentStaff?.email || '',
    phone: currentStaff?.phone || '',
    dob: currentStaff?.dob ? (currentStaff.dob.length >= 10 ? currentStaff.dob.slice(0, 10) : currentStaff.dob) : '',
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const s = staff || admin;
    if (s) {
      setForm({
        displayName: s.displayName || s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        dob: s.dob ? (s.dob.length >= 10 ? s.dob.slice(0, 10) : s.dob) : '',
      });
    }
  }, [staff, admin]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.displayName.trim().length < 2) {
      showToast?.('Display Name must be at least 2 characters.', 'error');
      return;
    }
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await authFetch(`${getStaffUrl()}/profile`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (updateStaffState && data.staff) updateStaffState(data.staff);
        if (setAdmin && data.staff) {
          setAdmin(prev => ({
            ...prev,
            ...data.staff,
            displayName: data.staff.displayName,
            email: data.staff.email,
            phone: data.staff.phone,
            dob: data.staff.dob,
            isExecutiveStaff: true,
          }));
        }
        showToast?.('Profile updated successfully!', 'success');
        setSavedSuccess(true);
      } else {
        showToast?.(data.message || 'Failed to update profile.', 'error');
      }
    } catch {
      showToast?.('Network error while updating profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecutiveLogout = async () => {
    try {
      if (staffLogout) await staffLogout();
    } catch {}
    try {
      if (adminLogout) await adminLogout();
    } catch {}
    router.push('/login?role=staff');
  };

  const employeeId = admin?.employeeId || staff?.employeeId || staff?.employee_id || '—';
  const username = admin?.username || staff?.username || 'admin';
  const designation = admin?.designation || staff?.designation || 'CEO';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Profile Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eef3f0', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1a3028' }}>Executive Profile</h3>
              <span style={{
                background: '#1e5038',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {designation}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b8a7a' }}>
              Staff member credentials and personal account details.
            </p>
          </div>
        </div>

        {/* Read-Only Locked Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Employee ID (Locked)
            </span>
            <span style={{ display: 'block', marginTop: '4px', fontSize: '1rem', fontWeight: 700, color: '#1e5038', fontFamily: 'monospace' }}>
              #{employeeId}
            </span>
          </div>

          <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '10px', padding: '12px 16px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b8a7a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Username (Locked)
            </span>
            <span style={{ display: 'block', marginTop: '4px', fontSize: '1rem', fontWeight: 700, color: '#1e5038', fontFamily: 'monospace' }}>
              @{username}
            </span>
          </div>
        </div>

        {/* Editable Fields Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2d3748', marginBottom: '6px' }}>
                Display Name *
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Your Full Name"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #c5ddd3',
                  fontSize: '0.88rem',
                  color: '#1a3028',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2d3748', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #c5ddd3',
                  fontSize: '0.88rem',
                  color: '#1a3028',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2d3748', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Mobile number"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #c5ddd3',
                  fontSize: '0.88rem',
                  color: '#1a3028',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2d3748', marginBottom: '6px' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #c5ddd3',
                  fontSize: '0.88rem',
                  color: '#1a3028',
                  background: '#fff',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '6px', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#1e5038',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(30,80,56,0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            {savedSuccess && (
              <span style={{ fontSize: '0.84rem', color: '#16a34a', fontWeight: 600 }}>
                ✓ Profile saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account Session Card */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '24px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a3028' }}>Account Session</div>
          <div style={{ fontSize: '0.85rem', color: '#6b8a7a', marginTop: '4px' }}>
            Active Executive Session: <strong style={{ color: '#1e5038' }}>{designation}</strong> (@{username})
          </div>
        </div>
        <button
          type="button"
          onClick={handleExecutiveLogout}
          style={{
            background: '#fff5f5',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '9px 18px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.86rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.color = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff5f5';
            e.currentTarget.style.borderColor = '#fecaca';
            e.currentTarget.style.color = '#dc2626';
          }}
        >
          {Ico.logout(16)} Logout
        </button>
      </div>
    </div>
  );
}
