// ponytail: console.log is the logger on Workers. No winston, no filesystem.
// Cloudflare captures console output in Workers Logs / `wrangler tail`.

const logger = {
  info:  (msg, meta) => console.log(JSON.stringify({ level: 'info',  message: msg, ...meta, ts: new Date().toISOString() })),
  warn:  (msg, meta) => console.warn(JSON.stringify({ level: 'warn',  message: msg, ...meta, ts: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', message: msg, ...meta, ts: new Date().toISOString() })),
  debug: (msg, meta) => console.debug(JSON.stringify({ level: 'debug', message: msg, ...meta, ts: new Date().toISOString() })),
};

export const auditLog = (action, details = {}) =>
  logger.info(`[AUDIT] ${action}`, { audit: true, action, ...details });

export default logger;
