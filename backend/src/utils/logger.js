// ponytail: console.log + non-blocking D1 audit_logs persistence for CERT-In 180-day compliance
let _activeDb = null;
let _activeCtx = null;

export const bindAuditContext = (db, executionCtx) => {
  _activeDb = db || null;
  _activeCtx = executionCtx || null;
};

const logger = {
  info:  (msg, meta) => console.log(JSON.stringify({ level: 'info',  message: msg, ...meta, ts: new Date().toISOString() })),
  warn:  (msg, meta) => console.warn(JSON.stringify({ level: 'warn',  message: msg, ...meta, ts: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', message: msg, ...meta, ts: new Date().toISOString() })),
  debug: (msg, meta) => console.debug(JSON.stringify({ level: 'debug', message: msg, ...meta, ts: new Date().toISOString() })),
};

export const auditLog = (action, details = {}) => {
  const ts = new Date().toISOString();
  logger.info(`[AUDIT] ${action}`, { audit: true, action, ...details });

  if (_activeDb && typeof _activeDb.batch === 'function') {
    try {
      const id = crypto.randomUUID();
      const cutoff180d = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const work = _activeDb.batch([
        _activeDb.prepare(
          `CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            details TEXT DEFAULT '{}',
            created_at TEXT NOT NULL
          )`
        ),
        _activeDb.prepare('INSERT INTO audit_logs (id, action, details, created_at) VALUES (?, ?, ?, ?)')
          .bind(id, action, JSON.stringify(details), ts),
        _activeDb.prepare('DELETE FROM audit_logs WHERE created_at < ?').bind(cutoff180d),
      ]).catch(() => {});

      if (_activeCtx?.waitUntil) _activeCtx.waitUntil(work);
    } catch {}
  }
};

export default logger;
