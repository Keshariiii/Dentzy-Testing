'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useIsMobile } from '../../hooks/useIsMobile';
import './BaseModal.css';

/**
 * BaseModal — 21st.dev Premium Modal Architecture
 * 
 * Features:
 * - PC: Centered spring scale-up dialog with glassmorphism backdrop
 * - Mobile: Bottom drawer with native drag-to-dismiss swipe gesture
 * - Traps browser popstate via useBackNavigation
 * - Accessible ARIA attributes & keyboard handling
 * - Tactile swipe pill handle on mobile
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
  swipeable = true,
  id = 'modal',
  raw = false,
}) {
  const isMobile = useIsMobile();
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

  const handleDragEnd = (_, info) => {
    // Dismiss if dragged down > 120px or with velocity > 500
    if (info.offset.y > 120 || info.velocity.y > 500) {
      requestClose();
    }
  };

  // Mobile bottom-sheet variants
  const mobileVariants = {
    hidden: { y: '100%', opacity: 0.5 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  // Desktop centered scale variants
  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 12 },
  };

  const useMobileSheet = isMobile && swipeable;

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
          <div
            className={cn(
              'dz-modal-scroll-wrap',
              useMobileSheet && 'dz-modal-mobile-wrap',
            )}
            onClick={handleBackdropClick}
          >
            <motion.div
              className={cn(
                'dz-modal-container',
                maxWidth,
                useMobileSheet && 'dz-modal-mobile-sheet',
                className,
              )}
              variants={useMobileSheet ? mobileVariants : desktopVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={
                useMobileSheet
                  ? { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
                  : { type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }
              }
              // Mobile drag-to-dismiss
              {...(useMobileSheet ? {
                drag: 'y',
                dragConstraints: { top: 0, bottom: 0 },
                dragElastic: { top: 0, bottom: 0.6 },
                onDragEnd: handleDragEnd,
                dragListener: true,
              } : {})}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile swipe pill handle */}
              {useMobileSheet && (
                <div className="dz-modal-swipe-handle" aria-hidden="true">
                  <div className="dz-modal-swipe-pill" />
                </div>
              )}

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
                      {showCloseButton && !useMobileSheet && (
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
