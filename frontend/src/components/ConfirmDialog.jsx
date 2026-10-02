'use client';
import React, { useEffect } from 'react';
import BaseModal from './ui/BaseModal';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'primary', 'warning', 'danger'
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, loading]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
      className="cd-panel-modal"
      raw={true}
      id="confirm-dialog"
    >
      <div className="cd-panel-content">
        <div className={`cd-icon-container cd-icon-${type}`}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {type === 'primary' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            )}
          </svg>
        </div>

        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>

        <div className="cd-actions">
          <button className="cd-cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            className={`cd-confirm-btn cd-btn-${type}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="cd-spinner"></span> : confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
