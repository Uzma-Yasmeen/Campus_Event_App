require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const connectDB = require('./config/db');
const { buildCorsOptions } = require('./config/cors');
const { apiLimiter } = require('./middleware/rateLimit');
const ensureQr = require('./middleware/ensureQr');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const institutionRoutes = require('./routes/institutionRoutes');

const app = express();

// Behind a platform proxy (Render, Railway, Heroku, nginx) the client IP
// arrives in X-Forwarded-For. Without this, rate limiting would see every
// request as coming from the proxy and throttle all users together.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

app.disable('x-powered-by');

// Security headers. crossOriginResourcePolicy is relaxed so that uploaded
// images and QR codes can be displayed by the web and mobile clients, which
// are served from a different origin than the API.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(compression());
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '1mb' }));

// Uploaded images and generated QR codes. ensureQr runs first so a code lost
// to an ephemeral filesystem is rebuilt before the static handler looks for it.
app.use('/uploads', ensureQr, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  fallthrough: true
}));

// Health check - used by hosting platforms to tell if the service is alive.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/institutions', institutionRoutes);

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Centralised error handler (multer, CORS rejections and thrown errors).
app.use((err, req, res, next) => {
  if (err && /not allowed by CORS/.test(err.message)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File is too large. The limit is 5 MB.' });
  }

  console.error('Unhandled error:', err.message || err);
  const status = err.status || 500;

  // Never leak internal error text to clients in production.
  const message = status < 500 || process.env.NODE_ENV !== 'production'
    ? (err.message || 'Server error')
    : 'Server error';

  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

// Exported without listening so tests can drive the app directly.
if (require.main === module) {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('JWT_SECRET must be set in production.');
    process.exit(1);
  }

  connectDB(process.env.MONGO_URI).then(() => {
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Let in-flight requests finish when the platform sends SIGTERM.
    for (const signal of ['SIGTERM', 'SIGINT']) {
      process.on(signal, () => {
        console.log(`${signal} received, shutting down`);
        server.close(() => process.exit(0));
      });
    }
  });
}

module.exports = app;
