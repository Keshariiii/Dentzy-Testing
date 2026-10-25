// ponytail: D1-backed rate limiter. In-memory is useless on Workers (stateless isolates).
// One row per attempt, count rows in window to check. Prune old rows on each check.

/**
 * Resolve client IP safely from Cloudflare edge headers.
 * Never trusts spoofable x-forwarded-for headers in production.
 */
export function getClientIP(c) {
  const cfIP = c.req.header('cf-connecting-ip');
  if (cfIP) return cfIP;

  if (c.env?.NODE_ENV !== 'production' && c.env?.TRUST_PROXY === 'true') {
    return (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'local-dev-ip'
    );
  }

  return c.env?.NODE_ENV !== 'production' ? 'local-dev-ip' : 'unknown-ip';
}

/**
 * Check rate limit against D1.
 * @param {object} db - D1 database binding (c.env.DB)
 * @param {string} key - Rate limit key (e.g. 'login:user@example.com')
 * @param {object} opts
 * @param {number} opts.windowMs - Window in milliseconds
 * @param {number} opts.max - Max attempts in window
 * @param {boolean} [opts.recordOnCheck=true] - Whether to insert attempt row now
 * @returns {{ allowed: boolean, remaining: number, retryAfterSecs: number }}
 */
export async function checkRateLimit(db, key, { windowMs, max, recordOnCheck = true }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Batch: prune old rows + count current
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

  // Record this attempt only if requested
  if (recordOnCheck) {
    await db.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(key, now).run();
  }

  return { allowed: true, remaining: max - count - (recordOnCheck ? 1 : 0), retryAfterSecs: 0 };
}

/**
 * Record a single rate limit attempt on failure.
 */
export async function recordRateLimitAttempt(db, key) {
  await db.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(key, Date.now()).run();
}

/**
 * Clear rate limit records for key on successful authentication.
 */
export async function clearRateLimit(db, key) {
  await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
}
