'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';
import BaseModal from './ui/BaseModal';
import './ConfirmDialog.css';

const ICON_MAP = {
  primary: { Icon: Info, bgClass: 'cd-icon-primary', color: '#1e5038' },
  warning: { Icon: AlertTriangle, bgClass: 'cd-icon-warning', color: '#d97706' },
  danger: { Icon: Trash2, bgClass: 'cd-icon-danger', color: '#dc2626' },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary',
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

  const config = ICON_MAP[type] || ICON_MAP.primary;
  const { Icon } = config;

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
        {/* Animated icon */}
        <motion.div
          className={`cd-icon-container ${config.bgClass}`}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        >
          <Icon className="w-6 h-6" style={{ color: config.color }} />
        </motion.div>

        <motion.h3
          className="cd-title"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          {title}
        </motion.h3>

        <motion.p
          className="cd-message"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          {message}
        </motion.p>

        <motion.div
          className="cd-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.2 }}
        >
          <button className="cd-cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            className={`cd-confirm-btn cd-btn-${type}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </button>
        </motion.div>
      </div>
    </BaseModal>
  );
}
