// ponytail: D1-backed rate limiter. In-memory is useless on Workers (stateless isolates).
// One row per attempt, count rows in window to check. Prune old rows on each check.

/**
 * Resolve client IP from Cloudflare/proxy headers.
 */
export function getClientIP(c) {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit against D1.
 * @param {object} db - D1 database binding (c.env.DB)
 * @param {string} key - Rate limit key (e.g. 'login:user@example.com')
 * @param {object} opts
 * @param {number} opts.windowMs - Window in milliseconds
 * @param {number} opts.max - Max attempts in window
 * @returns {{ allowed: boolean, remaining: number, retryAfterSecs: number }}
 */
export async function checkRateLimit(db, key, { windowMs, max }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Batch: prune old rows + count current + insert new row
  // ponytail: single batch call to D1 instead of 3 round trips
  const [, countResult] = await db.batch([
    db.prepare('DELETE FROM rate_limits WHERE key = ? AND ts < ?').bind(key, windowStart),
    db.prepare('SELECT COUNT(*) as cnt FROM rate_limits WHERE key = ? AND ts >= ?').bind(key, windowStart),
  ]);

  const count = countResult.results[0]?.cnt || 0;

  if (count >= max) {
    // Find oldest entry in window to calculate retry-after
    const oldest = await db.prepare(
      'SELECT MIN(ts) as oldest FROM rate_limits WHERE key = ? AND ts >= ?'
    ).bind(key, windowStart).first();

    const retryAfterMs = oldest?.oldest ? (oldest.oldest + windowMs) - now : windowMs;
    const retryAfterSecs = Math.ceil(Math.max(retryAfterMs, 1000) / 1000);

    return { allowed: false, remaining: 0, retryAfterSecs };
  }

  // Record this attempt
  await db.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(key, now).run();

  return { allowed: true, remaining: max - count - 1, retryAfterSecs: 0 };
}
