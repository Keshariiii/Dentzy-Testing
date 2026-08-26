import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import contactRoutes from './routes/contactRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// Validate required environment variables — crash early if anything is missing
// ═══════════════════════════════════════════════════════════════════════════════
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
];

const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  logger.error(
    `FATAL: Missing required environment variables: ${missingVars.join(', ')}. ` +
    `Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Track DB state
let dbConnected = false;

// ═══════════════════════════════════════════════════════════════════════════════
// Security Middleware
// ═══════════════════════════════════════════════════════════════════════════════

// Helmet — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// ── Strict CORS — only allow origins listed in ALLOWED_ORIGINS ──────────────
const rawOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const exactOrigins    = rawOrigins.filter((o) => !o.includes('*'));
const wildcardPatterns = rawOrigins
  .filter((o) => o.includes('*'))
  .map((o) => new RegExp('^' + o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (exactOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check wildcard patterns
    if (wildcardPatterns.some((re) => re.test(origin))) {
      return callback(null, true);
    }

    // Allow local network IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x, localhost)
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid URL
    }

    return callback(new Error(`CORS: Origin ${origin} is not allowed.`));
  },
  credentials: true,
}));

// ── Trust Render/Cloudflare proxy so rate limiter sees real client IPs ────────
app.set('trust proxy', 1);

// ── Global rate limiter — skips SSE events & health check, 100 req/15min in prod ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  skip: (req) => req.path.endsWith('/events') || req.path === '/api/health',
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// ── Shared rate limiter defaults ──────────────────────────────────────────────
const limiterDefaults = { windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false };

const authLimiter = rateLimit({
  ...limiterDefaults,
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

const contactLimiter = rateLimit({
  ...limiterDefaults,
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  message: { message: 'Too many contact form submissions. Please try again later.' },
});

// Body parser — limit payload size to 100kb to prevent DoS (Issue #14)
app.use(express.json({ limit: '100kb' }));

// Cookie parser — reads HttpOnly cookies for JWT auth
app.use(cookieParser());

// ─── Health endpoint ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// ─── Guard: return 503 if DB not connected (for auth/user routes) ─────────────
const requireDB = (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      message: 'Database is not connected. Please check the MongoDB connection and try again.',
    });
  }
  next();
};

// Routes
app.use('/api/contact',   contactLimiter, contactRoutes);
app.use('/api/auth',      authLimiter, requireDB, authRoutes);
app.use('/api/admin',     requireDB, adminRoutes);
app.use('/api/dashboard', requireDB, dashboardRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Dentzy Backend is Running');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Global Error Handler — MUST be registered AFTER all routes
// ═══════════════════════════════════════════════════════════════════════════════
app.use(errorHandler);

// Database Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    logger.info('Successfully connected to MongoDB');
  } catch (error) {
    dbConnected = false;
    logger.error(`MongoDB connection failed: ${error.message}. Retrying in 5 seconds...`);
    setTimeout(connectDB, 5000);
  }
};

// Start Server after connecting to DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on http://localhost:${PORT} and network http://0.0.0.0:${PORT}`);
  });
};

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  dbConnected = true;
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  dbConnected = false;
  logger.error(`MongoDB connection error: ${err.message}`);
});

startServer();
