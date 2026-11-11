'use client';

/**
 * Triggers a lightweight full-screen canvas confetti celebration once per session
 * on the authenticated user's birthday.
 *
 * @param {string} userId - Unique user or staff ID
 * @param {string} birthdayDate - YYYY-MM-DD date string in IST
 */
export function triggerBirthdayConfettiOnce(userId, birthdayDate) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !birthdayDate) return;

  // Respect reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const storageKey = `dentzy_bday_confetti_${userId || 'user'}_${birthdayDate}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // Ignore storage errors in private browsing
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ['#1e5038', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7', '#eab308'];
  const particleCount = 95;
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * (canvas.height * 0.35),
    w: 7 + Math.random() * 6,
    h: 5 + Math.random() * 5,
    vx: (Math.random() - 0.5) * 4.5,
    vy: 2.5 + Math.random() * 4.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 9,
    opacity: 1,
  }));

  const startTime = performance.now();
  const duration = 3800;

  function frame(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.045; // gentle gravity
      p.rotation += p.rotationSpeed;
      if (elapsed > duration * 0.65) {
        p.opacity = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35));
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < duration) {
      window.requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  window.requestAnimationFrame(frame);
}
