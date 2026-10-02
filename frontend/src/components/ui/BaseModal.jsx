'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import './BaseModal.css';

/**
 * BaseModal — 21st.dev Premium Modal Architecture
 * 
 * Features:
 * - Traps browser popstate via useBackNavigation (fixes mobile back-swipe & hardware back button)
 * - Smooth Framer Motion spring physics & glassmorphism backdrop
 * - Accessible ARIA attributes & keyboard focus trap
 * - Fully responsive with bottom-sheet feel on mobile and centered card on desktop
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  className = '',
  bodyClassName = '',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventScroll = true,
  id = 'modal',
  raw = false, // When true, renders children directly inside modal wrapper without standard header
}) {
  const { requestClose } = useBackNavigation({
    isOpen,
    onClose,
    closeOnEscape,
    preventScroll,
    id,
  });

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      requestClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="dz-modal-root" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby={title ? `${id}-title` : undefined}
        >
          {/* Glassmorphic Backdrop */}
          <motion.div
            className="dz-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={handleBackdropClick}
          />

          {/* Centering / Alignment Container */}
          <div className="dz-modal-scroll-wrap" onClick={handleBackdropClick}>
            <motion.div
              className={cn('dz-modal-container', maxWidth, className)}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {raw ? (
                children
              ) : (
                <>
                  {/* Standard Premium Header */}
                  {(title || showCloseButton || badge) && (
                    <div className="dz-modal-header">
                      <div className="dz-modal-header-text">
                        <div className="dz-modal-title-row">
                          {title && <h2 id={`${id}-title`} className="dz-modal-title">{title}</h2>}
                          {badge && <div className="dz-modal-badge">{badge}</div>}
                        </div>
                        {subtitle && <p className="dz-modal-subtitle">{subtitle}</p>}
                      </div>
                      {showCloseButton && (
                        <button
                          type="button"
                          className="dz-modal-close-btn"
                          onClick={requestClose}
                          aria-label="Close dialog"
                        >
                          <X className="w-5 h-5 text-gray-500 hover:text-gray-900 transition-colors" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Modal Body */}
                  <div className={cn('dz-modal-body', bodyClassName)}>
                    {children}
                  </div>

                  {/* Optional Footer */}
                  {footer && (
                    <div className="dz-modal-footer">
                      {footer}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
