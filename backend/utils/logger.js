import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '..', 'logs');

// ═══════════════════════════════════════════════════════════════════════════════
// Winston Logger Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dentzy-api' },
  transports: [
    // ── Error log — only errors ──────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // ── Combined log — all levels ────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// ── Console transport for development ────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 // 'service' is always present
            ? ` ${JSON.stringify(meta, null, 0)}`
            : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Audit Logger — for critical business actions
// Sanitizes PII: logs entity IDs but never raw emails, passwords, names, etc.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log a critical business action for the audit trail.
 * @param {string} action  — e.g. 'USER_REGISTERED', 'ORDER_STAGE_UPDATED'
 * @param {object} details — metadata (IDs, status changes). NEVER include raw PII.
 */
export const auditLog = (action, details = {}) => {
  logger.info(`[AUDIT] ${action}`, {
    audit: true,
    action,
    ...details,
  });
};

export default logger;
