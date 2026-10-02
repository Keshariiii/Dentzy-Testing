'use client';
import { useEffect, useRef, useCallback } from 'react';

/**
 * useBackNavigation
 * 
 * Traps the browser's popstate (back button / mobile swipe back) event to close modals,
 * drawers, or sub-views instead of exiting the page/app.
 * 
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the modal/sheet is open
 * @param {Function} options.onClose - Callback triggered when back navigation occurs
 * @param {boolean} [options.closeOnEscape=true] - Whether Escape key should trigger onClose
 * @param {boolean} [options.preventScroll=true] - Whether to lock body scroll when open
 * @param {string} [options.id] - Optional identifier for debugging
 */
export function useBackNavigation({
  isOpen,
  onClose,
  closeOnEscape = true,
  preventScroll = true,
  id = 'modal',
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const instanceIdRef = useRef(`${id}_${Math.random().toString(36).slice(2, 9)}`);
  const isHistoryPushedRef = useRef(false);
  const isHandlingPopstateRef = useRef(false);

  // Close helper that unwinds the pushed history state if closed programmatically
  const requestClose = useCallback(() => {
    if (isHistoryPushedRef.current) {
      isHandlingPopstateRef.current = true;
      isHistoryPushedRef.current = false;
      try {
        window.history.back();
      } catch (err) {
        // Fallback if history.back fails
      }
    }
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  }, []);

  // History & popstate management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      // 1. Push history state so back button closes this modal instead of leaving
      const stateObj = {
        ...(window.history.state || {}),
        _dentzyModal: instanceIdRef.current,
      };
      window.history.pushState(stateObj, '');
      isHistoryPushedRef.current = true;

      // 2. Handle popstate (hardware back button, browser back, mobile swipe back)
      const handlePopState = (e) => {
        if (isHandlingPopstateRef.current) {
          // This popstate was triggered by our own requestClose() -> history.back()
          isHandlingPopstateRef.current = false;
          return;
        }

        if (isHistoryPushedRef.current) {
          isHistoryPushedRef.current = false;
          if (onCloseRef.current) {
            onCloseRef.current();
          }
        }
      };

      window.addEventListener('popstate', handlePopState);

      // 3. Handle Escape key
      const handleKeyDown = (e) => {
        if (closeOnEscape && e.key === 'Escape') {
          e.preventDefault();
          requestClose();
        }
      };

      if (closeOnEscape) {
        window.addEventListener('keydown', handleKeyDown);
      }

      // 4. Prevent body scroll while modal is active
      let previousOverflow = '';
      if (preventScroll) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (closeOnEscape) {
          window.removeEventListener('keydown', handleKeyDown);
        }
        if (preventScroll) {
          document.body.style.overflow = previousOverflow;
        }

        // Clean up history state if unmounted while still open without popstate
        if (isHistoryPushedRef.current) {
          isHandlingPopstateRef.current = true;
          isHistoryPushedRef.current = false;
          try {
            window.history.back();
          } catch {
            // Ignore
          }
        }
      };
    }
  }, [isOpen, closeOnEscape, preventScroll, requestClose]);

  return { requestClose };
}

export default useBackNavigation;
