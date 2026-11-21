export function isAppleTouchDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOSPlatform = /iPhone|iPad|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIOSPlatform || isIPadOS;
}

export function safeShowPicker(e) {
  if (!e || !e.currentTarget) return;
  if (isAppleTouchDevice()) return; // Native iOS opens on tap
  if (typeof e.currentTarget.showPicker === 'function') {
    try {
      e.currentTarget.showPicker();
    } catch {
      e.currentTarget.focus();
    }
  } else {
    e.currentTarget.focus();
  }
}

export function openInvoiceWindow(url) {
  if (typeof window === 'undefined') return;
  const w = window.open(url, '_blank');
  if (w) {
    try { w.opener = null; } catch {}
    return;
  }
  window.location.assign(url);
}

let audioCtxSingleton = null;
let unlockListenersAttached = false;

function unlockAudioContext(ctx) {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtxSingleton) {
    audioCtxSingleton = new AudioContextClass();
  }
  if (!unlockListenersAttached && typeof window !== 'undefined') {
    unlockListenersAttached = true;
    const unlock = () => {
      unlockAudioContext(audioCtxSingleton);
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchend', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('touchend', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }
  if (audioCtxSingleton.state === 'suspended') {
    unlockAudioContext(audioCtxSingleton);
  }
  return audioCtxSingleton;
}
