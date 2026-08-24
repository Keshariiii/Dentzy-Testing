import logger from '../utils/logger.js';

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes: app.use(errorHandler)
 *
 * - Logs the full error (stack trace, context) server-side via Winston
 * - Returns a safe, generic message to the client — never leaks stack traces
 * - Handles known error types (Mongoose, JWT, Zod) with appropriate status codes
 */
const errorHandler = (err, req, res, _next) => {
  // Log the full error server-side
  logger.error(`${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // ── Mongoose validation error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: messages[0] || 'Validation failed.',
      errors: messages,
    });
  }

  // ── Mongoose duplicate key error ───────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      message: `Duplicate value for ${field}. This ${field} is already in use.`,
    });
  }

  // ── Mongoose CastError (invalid ObjectId, etc.) ────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired. Please log in again.' });
  }

  // ── CORS errors ────────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: 'Not allowed by CORS.' });
  }

  // ── Default: Internal server error ─────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: statusCode === 500
      ? 'Internal server error.'
      : err.message || 'Something went wrong.',
  });
};

export default errorHandler;
