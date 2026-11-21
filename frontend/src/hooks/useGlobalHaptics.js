import { useEffect } from 'react';
import { isAppleTouchDevice } from '../utils/appleCompat';

/**
 * useGlobalHaptics — Global Event Delegation Hook for Mobile Haptic Feedback.
 *
 * Automatically triggers a subtle haptic vibration when tapping interactive
 * elements (button, a, input[type="button"|"submit"], [role="button"])
 * on touch-capable devices.
 *
 * Features:
 *  - Touch device detection (skips setup entirely on desktop)
 *  - Global event delegation via `pointerdown` on `window` (or `click` on iOS WebKit)
 *  - 100ms throttle to prevent rapid-fire vibrations
 *  - Respects `localStorage.isHapticsEnabled` user preference (default: enabled)
 *  - Graceful fallback: web-haptics → navigator.vibrate → iOS switch haptic → silent no-op
 */
export function useGlobalHaptics(options = {}) {
  const { duration = 7, throttleMs = 100 } = options;

  useEffect(() => {
    // 1. Touch / mobile capability check — bail out entirely on non-touch devices
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const isTouchDevice =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    if (!isTouchDevice) return;

    let lastTriggerTime = 0;
    let switchLabel = null;

    const INTERACTIVE_SELECTOR =
      'button, a, input[type="button"], input[type="submit"], [role="button"]';

    const isAppleTouch = typeof navigator !== 'undefined' && !navigator.vibrate && isAppleTouchDevice();

    const getOrCreateSwitchLabel = () => {
      if (!switchLabel && typeof document !== 'undefined' && document.body) {
        const label = document.createElement('label');
        label.style.display = 'none';
        label.setAttribute('aria-hidden', 'true');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        label.appendChild(input);
        document.body.appendChild(label);
        switchLabel = label;
      }
      return switchLabel;
    };

    // Standard haptics handler for devices supporting navigator.vibrate
    const handleInteraction = (event) => {
      // 2. Respect user preference (default to enabled)
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('isHapticsEnabled') === 'false') return;
      } catch (_) {}

      // 3. Throttle rapid taps
      const now = Date.now();
      if (now - lastTriggerTime < throttleMs) return;

      // 4. Event delegation — walk up from target to find interactive ancestor
      const target = event.target;
      if (!target || !(target instanceof Element)) return;

      const interactiveElement = target.closest(INTERACTIVE_SELECTOR);
      if (!interactiveElement) return;

      lastTriggerTime = now;

      // 5. Fire native haptic feedback
      try {
        if (navigator.vibrate) navigator.vibrate(duration);
      } catch (_) {
        // Silently swallow browser security / permission errors
      }
    };

    // iOS WebKit haptics handler using switch element trick
    const handleAppleClick = (event) => {
      // 2. Respect user preference (default to enabled)
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('isHapticsEnabled') === 'false') return;
      } catch (_) {}

      // 3. Throttle rapid taps
      const now = Date.now();
      if (now - lastTriggerTime < throttleMs) return;

      // 4. Event delegation — walk up from target to find interactive ancestor
      const target = event.target;
      if (!target || !(target instanceof Element)) return;

      // Ignore click if it came from our hidden switch label
      if (switchLabel && (target === switchLabel || switchLabel.contains(target))) return;

      const interactiveElement = target.closest(INTERACTIVE_SELECTOR);
      if (!interactiveElement) return;

      lastTriggerTime = now;

      try {
        const label = getOrCreateSwitchLabel();
        if (label) {
          label.click();
        }
      } catch (_) {
        // Silently swallow errors
      }
    };

    if (isAppleTouch) {
      window.addEventListener('click', handleAppleClick, { capture: true, passive: true });
    } else {
      window.addEventListener('pointerdown', handleInteraction, { passive: true });
    }

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('click', handleAppleClick, { capture: true });
      if (switchLabel && switchLabel.parentNode) {
        switchLabel.parentNode.removeChild(switchLabel);
        switchLabel = null;
      }
    };
  }, [duration, throttleMs]);
}
