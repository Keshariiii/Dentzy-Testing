'use client';
import React, { useEffect, useState } from 'react';
import './StaffNoticeBar.css';

const STAFF_API = '/api/staff';
const SESSION_KEY = 'dz_notice_dismissed';

export default function StaffNoticeBar({ authFetch }) {
  const [notice, setNotice] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!authFetch) return;
    authFetch(`${STAFF_API}/notice`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.enabled && data?.message) {
          const key = `${SESSION_KEY}_${data.message.slice(0, 20)}`;
          if (!sessionStorage.getItem(key)) {
            setNotice(data);
          }
        }
      })
      .catch(() => {});
  }, [authFetch]);

  const handleDismiss = () => {
    if (notice) {
      const key = `${SESSION_KEY}_${notice.message.slice(0, 20)}`;
      sessionStorage.setItem(key, '1');
    }
    setDismissed(true);
  };

  if (!notice || dismissed) return null;

  return (
    <div className="dz-notice-bar" role="alert" aria-live="polite">
      <div className="dz-notice-bar__content">
        <svg className="dz-notice-bar__icon" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="dz-notice-bar__text">{notice.message}</span>
      </div>
      <button
        className="dz-notice-bar__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notice"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}