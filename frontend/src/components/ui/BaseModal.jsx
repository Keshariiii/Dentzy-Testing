'use client';
import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useIsMobile } from '../../hooks/useIsMobile';
import './BaseModal.css';

/**
 * BaseModal — Unified Admin-Style Modal Architecture
 * 
 * PC: Centered spring scale-up dialog with dark blurred glassmorphism backdrop
 * Mobile: Pinned header + scrollable body bottom sheet with isolated swipe handle
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
  const { requestClose, stackDepth } = useBackNavigation({
    isOpen,
    onClose,
    closeOnEscape,
    preventScroll,
    id,
  });

  const dragControls = useDragControls();
  const dragY = useMotionValue(0);

  useEffect(() => {
    if (isOpen) {
      dragY.set(0);
    }
  }, [isOpen, dragY]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      requestClose();
    }
  };

  const handleDragEnd = useCallback((_, info) => {
    // Fast flick (velocity > 400) OR dragged past 100px = dismiss
    if (info.velocity.y > 400 || info.offset.y > 100) {
      requestClose();
    }
  }, [requestClose]);

  const useMobileSheet = isMobile && swipeable;

  // Mobile: slide up from bottom. Desktop: scale up from center.
  const mobileVariants = {
    hidden: { y: '100%', opacity: 0.5 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 12 },
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="dz-modal-root" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby={title ? `${id}-title` : undefined}
          style={{ zIndex: 9999 + ((stackDepth || 0) * 10) }}
        >
          {/* Full-viewport glassmorphic backdrop */}
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
                  ? { type: 'spring', damping: 32, stiffness: 320, mass: 0.8 }
                  : { type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }
              }
              // Mobile drag-to-dismiss via top handle only to prevent scroll conflicts
              {...(useMobileSheet ? {
                drag: 'y',
                dragControls,
                dragListener: false,
                dragConstraints: { top: 0, bottom: 0 },
                dragElastic: { top: 0.08, bottom: 0.5 },
                onDragEnd: handleDragEnd,
                style: { y: dragY },
              } : {})}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile swipe pill handle */}
              {useMobileSheet && (
                <div 
                  className="dz-modal-swipe-handle" 
                  aria-hidden="true"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="dz-modal-swipe-pill" />
                </div>
              )}

              {raw ? (
                children
              ) : (
                <>
                  {/* Pinned Header */}
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

                  {/* Scrollable Body */}
                  <div className={cn('dz-modal-body', bodyClassName)}>
                    {children}
                  </div>

                  {/* Optional Pinned Footer */}
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
    </AnimatePresence>,
    document.body
  );
}
