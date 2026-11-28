'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from './DashboardIcons';

const DEFAULT_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const fieldWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#2d3748',
};

const inputStyle = {
  width: '100%',
  minHeight: '44px',
  borderRadius: '10px',
  border: '1px solid var(--dz-color-border-strong, #c2dcd0)',
  padding: '0 44px 0 12px',
  fontSize: '0.9rem',
  outline: 'none',
  background: '#ffffff',
  color: 'var(--dz-color-text-forest, #1a3028)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

/**
 * ChangePasswordCard — Shared password change card for Dentist, Staff, and Executive settings.
 * Supports both standalone internal state and parent-controlled form/visibility state.
 */
export default function ChangePasswordCard({
  onSubmit,
  saving = false,
  msg = null,
  showPwState,
  onToggleShowPw,
  pwForm,
  onFormChange,
  title = 'Change Password',
  subtitle = 'Update your login password.',
  collapsible = false,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggleOpen,
  showForgotLink = false,
  forgotHref = '/forgot-password',
  minLength = 6,
  submitLabel = 'Update Password',
  idPrefix = 'dz-pw',
  footerSlot = null,
  className = '',
  style,
}) {
  const [internalForm, setInternalForm] = useState(DEFAULT_FORM);
  const [internalShowPw, setInternalShowPw] = useState({ current: false, new: false, confirm: false });
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [localError, setLocalError] = useState('');

  const form = pwForm || internalForm;
  const showPw = showPwState || internalShowPw;
  const isOpen = collapsible ? (controlledOpen !== undefined ? controlledOpen : internalOpen) : true;

  useEffect(() => {
    if (msg?.type === 'success' && !pwForm) {
      setInternalForm(DEFAULT_FORM);
      setLocalError('');
    }
  }, [msg, pwForm]);

  const handleField = (field, value) => {
    setLocalError('');
    if (onFormChange) onFormChange(field, value);
    else setInternalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleEye = (key) => {
    if (onToggleShowPw) onToggleShowPw(key);
    else setInternalShowPw((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleCollapse = () => {
    setLocalError('');
    if (onToggleOpen) {
      onToggleOpen(!isOpen);
    } else {
      setInternalOpen((v) => !v);
      if (!pwForm) setInternalForm(DEFAULT_FORM);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.currentPassword) {
      setLocalError('Current password is required.');
      return;
    }
    if (!form.newPassword) {
      setLocalError('New password is required.');
      return;
    }
    if (minLength > 0 && form.newPassword.length < minLength) {
      setLocalError(`New password must be at least ${minLength} characters.`);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setLocalError('New passwords do not match.');
      return;
    }
    await onSubmit?.(form, e);
  };

  const feedback = msg?.text ? msg : localError ? { type: 'error', text: localError } : null;

  const fields = [
    {
      key: 'current',
      label: 'Current Password',
      field: 'currentPassword',
      placeholder: 'Enter current password',
      autoComplete: 'current-password',
    },
    {
      key: 'new',
      label: 'New Password',
      field: 'newPassword',
      placeholder: minLength ? `At least ${minLength} characters` : 'New password',
      autoComplete: 'new-password',
    },
    {
      key: 'confirm',
      label: 'Confirm New Password',
      field: 'confirmPassword',
      placeholder: 'Repeat new password',
      autoComplete: 'new-password',
    },
  ];

  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '22px',
        border: '1px solid var(--dz-color-border-mint, #e2ece6)',
        boxShadow: 'var(--dz-shadow-sm, 0 2px 10px rgba(0,0,0,0.04))',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '0.98rem',
              fontWeight: 700,
              color: 'var(--dz-color-text-forest, #1a3028)',
            }}
          >
            {Icons.shield(16)}
            <span>{title}</span>
          </div>
          {subtitle ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--dz-color-text-muted, #64748b)', margin: '3px 0 0' }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {collapsible && (
          <button
            type="button"
            id="toggle-change-password-btn"
            onClick={handleToggleCollapse}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--dz-color-border-strong, #c2dcd0)',
              background: '#f8faf9',
              color: '#1e5038',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {isOpen ? 'Cancel' : 'Change'}
          </button>
        )}
      </div>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #f0f4f2',
          }}
        >
          {fields.map(({ key, label, field, placeholder, autoComplete }) => (
            <div key={key} style={fieldWrapStyle}>
              <label htmlFor={`${idPrefix}-${key}`} style={labelStyle}>
                {label}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id={`${idPrefix}-${key}`}
                  type={showPw[key] ? 'text' : 'password'}
                  value={form[field] || ''}
                  onChange={(e) => handleField(field, e.target.value)}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => handleToggleEye(key)}
                  aria-label={showPw[key] ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#708c80',
                    minWidth: '40px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {Icons.eye(16, Boolean(showPw[key]))}
                </button>
              </div>
            </div>
          ))}

          {feedback && (
            <div
              role="alert"
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: feedback.type === 'success' ? '#15803d' : '#b91c1c',
              }}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#1e5038',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Updating...' : submitLabel}
          </button>

          {showForgotLink && (
            <div style={{ textAlign: 'center' }}>
              <Link
                href={forgotHref}
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e5038', textDecoration: 'underline' }}
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </form>
      )}

      {footerSlot}
    </div>
  );
}
