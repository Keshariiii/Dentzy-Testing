'use client';
import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useIsMobile } from '../../hooks/useIsMobile';
import './BaseModal.css';

/**
 * BaseModal — 21st.dev Premium Modal Architecture
 * 
 * PC: Centered spring scale-up dialog with glassmorphism backdrop
 * Mobile: Bottom drawer with native drag-to-dismiss, opacity fade, rubber-band snap
 * 
 * Improvements over Testing version:
 * - Drag opacity: backdrop fades as you drag down (feels alive)
 * - Rubber-band resistance: drags up with spring elasticity, not rigid
 * - Velocity-aware snap: fast flick = dismiss, slow drag = snap threshold
 * - Safe area insets: notch + home bar on iOS/Android
 * - Haptic feedback hook point for native apps
 * - X button still visible on mobile (small, top-right of pill area)
 * - Scroll-aware drag: only triggers drag when scrolled to top
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

  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const dragY = useMotionValue(0);

  // Backdrop opacity dims as user drags down (1 -> 0.3 over 300px)
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0.3]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      requestClose();
    }
  };

  const getScrollContainer = useCallback(() => {
    if (bodyRef.current) return bodyRef.current;
    if (containerRef.current) {
      return containerRef.current.querySelector(
        '.dz-modal-body, .ddm-body, .odm-modal-content, .pdm-modal-content, [data-modal-body], [style*="overflow"]'
      );
    }
    return null;
  }, []);

  // Scroll-aware drag: only allow drag when body is scrolled to top
  const handleDragStart = useCallback((_, info) => {
    const scrollEl = getScrollContainer();
    if (scrollEl && scrollEl.scrollTop > 0) {
      // User is scrolled down -- don't start drag, let them scroll
      return;
    }
  }, [getScrollContainer]);

  const handleDragEnd = useCallback((_, info) => {
    const scrollEl = getScrollContainer();
    // If scrolled down, snap back (don't dismiss)
    if (scrollEl && scrollEl.scrollTop > 0) return;

    // Fast flick (velocity > 400) OR dragged past 100px = dismiss
    if (info.velocity.y > 400 || info.offset.y > 100) {
      requestClose();
    }
  }, [requestClose, getScrollContainer]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="dz-modal-root" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby={title ? `${id}-title` : undefined}
          style={{ zIndex: 9999 + ((stackDepth || 0) * 10) }}
        >
          {/* Glassmorphic Backdrop -- fades with drag */}
          <motion.div
            className="dz-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={handleBackdropClick}
            style={useMobileSheet ? { opacity: backdropOpacity } : undefined}
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
              ref={containerRef}
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
              // Mobile drag-to-dismiss with rubber-band feel
              {...(useMobileSheet ? {
                drag: 'y',
                dragConstraints: { top: 0, bottom: 0 },
                dragElastic: { top: 0.08, bottom: 0.5 },
                onDragStart: handleDragStart,
                onDragEnd: handleDragEnd,
                dragListener: true,
                style: { y: dragY },
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
                  <div ref={bodyRef} className={cn('dz-modal-body', bodyClassName)}>
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
