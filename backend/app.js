require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const mongoSanitize = require('express-mongo-sanitize');

// Error monitoring — only active when SENTRY_DSN is configured (no-op otherwise)
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const satisfactionRoutes = require('./routes/satisfaction');
const contactRoutes = require('./routes/contact');
const webhookRoutes = require('./routes/webhooks');

const app = express();

// Allow any localhost port (dev) plus explicitly configured production origins
const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const extraOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const isAllowedOrigin = (origin) =>
  LOCALHOST_RE.test(origin) || extraOrigins.includes(origin);

// Secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());
// Request logging — skipped in tests to keep test output clean
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));
// CORS: reject any request from an origin not in the allow-list
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    cb(null, false);
  }
}));

// Belt-and-braces origin check in case a request slips past the cors() middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) return res.status(403).send('Forbidden');
  next();
});
// Mounted before express.json() below — its own route uses express.raw()
// since Svix webhook signature verification needs the raw request body,
// not JSON already parsed into an object
app.use('/api/webhooks', webhookRoutes);

// Parse JSON and URL-encoded bodies (multipart/form-data is handled per-route by multer)
app.use(express.json());
app.use(express.urlencoded({ limit: '1mb', extended: true }));
// Strip any $-prefixed or dot-containing keys from body/query/params to block NoSQL injection
app.use(mongoSanitize());

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/satisfaction', satisfactionRoutes);
app.use('/api/contact', contactRoutes);

// Simple liveness check for uptime monitoring
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Multer file limit errors → 400 (not 500)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Catch-all error handler — reports to Sentry (if configured) and never leaks
// internal error details to the client
app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
