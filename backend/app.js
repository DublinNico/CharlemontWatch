require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoSanitize = require('express-mongo-sanitize');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');

const app = express();

const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const extraOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const isAllowedOrigin = (origin) =>
  LOCALHOST_RE.test(origin) || extraOrigins.includes(origin);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isAllowedOrigin(origin)) return cb(null, true);
    cb(null, false);
  }
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) return res.status(403).send('Forbidden');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(mongoSanitize());

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Multer file limit errors → 400 (not 500)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
