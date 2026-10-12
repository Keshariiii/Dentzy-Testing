'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useBackNavigation — Dentzy Global Modal Stack & History Management
 * 
 * Traps hardware back / browser popstate / mobile swipe back to dismiss ONLY the topmost
 * modal in the stack. Programmatic closes (X button, Cancel button, ESC) unwind history
 * safely without leaking popstate events to parent modals.
 */

// Module-level singleton stack tracking active modals
const modalStack = [];
let pendingProgrammaticPops = 0;
let prevBodyOverflow = '';
let isGlobalListenerAttached = false;

function teardownGlobalListeners() {
  if (typeof window === 'undefined') return;
  window.removeEventListener('popstate', handleGlobalPopstate);
  window.removeEventListener('keydown', handleGlobalKeydown);
  isGlobalListenerAttached = false;
}

function setupGlobalListeners() {
  if (typeof window === 'undefined' || isGlobalListenerAttached) return;
  window.addEventListener('popstate', handleGlobalPopstate);
  window.addEventListener('keydown', handleGlobalKeydown);
  isGlobalListenerAttached = true;
}

function handleGlobalPopstate() {
  if (pendingProgrammaticPops > 0) {
    pendingProgrammaticPops--;
    return;
  }

  // Real user back navigation (browser back, mobile back gesture): dismiss ONLY topmost modal
  if (modalStack.length > 0) {
    const topEntry = modalStack.pop();
    if (topEntry) {
      topEntry.historyConsumed = true;
      if (topEntry.onClose) {
        topEntry.onClose();
      }
    }
    if (modalStack.length === 0) {
      if (prevBodyOverflow !== undefined) {
        document.body.style.overflow = prevBodyOverflow;
      }
      teardownGlobalListeners();
    }
  }
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && modalStack.length > 0) {
    const topEntry = modalStack[modalStack.length - 1];
    if (topEntry && topEntry.closeOnEscape !== false) {
      e.preventDefault();
      e.stopPropagation();
      topEntry.requestClose();
    }
  }
}

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
  const [stackDepth, setStackDepth] = useState(0);

  const requestClose = useCallback(() => {
    const idx = modalStack.findIndex(m => m.id === instanceIdRef.current);
    if (idx !== -1) {
      const [entry] = modalStack.splice(idx, 1);
      if (entry && !entry.historyConsumed && isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        pendingProgrammaticPops++;
        try {
          window.history.back();
        } catch {}
        setTimeout(() => {
          if (pendingProgrammaticPops > 0) pendingProgrammaticPops--;
        }, 400);
      }
    }
    if (modalStack.length === 0) {
      if (prevBodyOverflow !== undefined) {
        document.body.style.overflow = prevBodyOverflow;
      }
      teardownGlobalListeners();
    }
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      if (modalStack.length === 0) {
        prevBodyOverflow = document.body.style.overflow;
        setupGlobalListeners();
      }
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Push history state so hardware back button closes this modal instead of leaving
      const stateObj = {
        ...(window.history.state || {}),
        _dentzyModal: instanceIdRef.current,
      };
      window.history.pushState(stateObj, '');
      isHistoryPushedRef.current = true;

      const stackEntry = {
        id: instanceIdRef.current,
        onClose: () => {
          if (onCloseRef.current) onCloseRef.current();
        },
        requestClose,
        closeOnEscape,
        historyConsumed: false,
      };

      modalStack.push(stackEntry);
      setStackDepth(modalStack.length - 1);

      return () => {
        const curIdx = modalStack.findIndex(m => m.id === instanceIdRef.current);
        if (curIdx !== -1) {
          const [entry] = modalStack.splice(curIdx, 1);
          if (entry && !entry.historyConsumed && isHistoryPushedRef.current) {
            isHistoryPushedRef.current = false;
            pendingProgrammaticPops++;
            try {
              window.history.back();
            } catch {}
            setTimeout(() => {
              if (pendingProgrammaticPops > 0) pendingProgrammaticPops--;
            }, 400);
          }
        }
        if (modalStack.length === 0) {
          if (prevBodyOverflow !== undefined) {
            document.body.style.overflow = prevBodyOverflow;
          }
          teardownGlobalListeners();
        }
      };
    }
  }, [isOpen, closeOnEscape, preventScroll, requestClose]);

  return { requestClose, stackDepth };
}

export default useBackNavigation;
