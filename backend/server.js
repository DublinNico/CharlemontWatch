require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');

const app = express();

const ALLOWED_ORIGIN = /^http:\/\/localhost(:\d+)?$/;

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGIN.test(origin)) return cb(null, true);
    cb(null, false);
  }
}));

// Block requests from disallowed origins with 403 instead of letting them fall
// through to the global error handler as a 500
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) {
    return res.status(403).send('Forbidden');
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});