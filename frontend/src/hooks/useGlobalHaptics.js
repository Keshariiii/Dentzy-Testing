import { useEffect } from 'react';

/**
 * useGlobalHaptics — Global Event Delegation Hook for Mobile Haptic Feedback.
 *
 * Automatically triggers a subtle haptic vibration when tapping interactive
 * elements (button, a, svg, input[type="button"|"submit"], [role="button"])
 * on touch-capable devices.
 *
 * Features:
 *  - Touch device detection (skips setup entirely on desktop)
 *  - Global event delegation via `pointerdown` on `window`
 *  - 100ms throttle to prevent rapid-fire vibrations
 *  - Respects `localStorage.isHapticsEnabled` user preference (default: enabled)
 *  - Graceful fallback: web-haptics → navigator.vibrate → silent no-op
 */
export function useGlobalHaptics(options = {}) {
  const { duration = 7, throttleMs = 100 } = options;

  useEffect(() => {
    // 1. Touch / mobile capability check — bail out entirely on non-touch devices
    const isTouchDevice =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    if (!isTouchDevice) return;

    // Lazy-load web-haptics to keep the main bundle lean
    let triggerHaptic = null;
    import('web-haptics')
      .then((mod) => {
        triggerHaptic = mod.triggerHaptic || mod.default?.triggerHaptic || null;
      })
      .catch(() => {
        // web-haptics unavailable — navigator.vibrate fallback is still active
      });

    let lastTriggerTime = 0;

    const INTERACTIVE_SELECTOR =
      'button, a, svg, input[type="button"], input[type="submit"], [role="button"]';

    const handleInteraction = (event) => {
      // 2. Respect user preference (default to enabled)
      if (localStorage.getItem('isHapticsEnabled') === 'false') return;

      // 3. Throttle rapid taps
      const now = Date.now();
      if (now - lastTriggerTime < throttleMs) return;

      // 4. Event delegation — walk up from target to find interactive ancestor
      const target = event.target;
      if (!target || !(target instanceof Element)) return;

      const interactiveElement = target.closest(INTERACTIVE_SELECTOR);
      if (!interactiveElement) return;

      lastTriggerTime = now;

      // 5. Fire haptic feedback with cascading fallback
      try {
        if (typeof triggerHaptic === 'function') {
          triggerHaptic('selection');
        } else if (navigator.vibrate) {
          navigator.vibrate(duration);
        }
      } catch (_) {
        // Silently swallow browser security / permission errors
      }
    };

    window.addEventListener('pointerdown', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
    };
  }, [duration, throttleMs]);
}
