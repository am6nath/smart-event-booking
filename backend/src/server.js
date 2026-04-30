/**
 * EventHub — TCS iON Smart Event Booking System
 * Copyright (c) 2026 Amarnath T V (github.com/am6nath)
 * MIT License — see LICENSE in the project root
 */
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');      // HTTP security headers
const compression = require('compression'); // Response compression
const connectDB  = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


const path = require('path');

const app = express();

// 📂 Serve Static Uploads
app.use(express.static(path.join(__dirname, '../public')));

// 🌐 Core Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin image serving
app.use(compression());

// ─── CORS: explicit origin allow-list (never use wildcard in production) ───
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no Origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));          // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 🔐 Rate Limiting: Prevent API abuse (TCS Security Requirement)
// General API limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests. Please try again after 15 minutes.' 
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Stricter limit for auth endpoints (prevent brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login/register attempts per 15 minutes
  message: { 
    success: false, 
    message: 'Too many authentication attempts. Please wait 15 minutes.' 
  },
});

// Apply rate limiters
app.use('/api', apiLimiter); // General API routes
app.use('/api/auth/login', authLimiter); // Login endpoint
app.use('/api/auth/register', authLimiter); // Register endpoint

// 📡 Health Check (exempt from rate limiting — safe for uptime monitors)
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  message: 'EventHub API is running',
  timestamp: new Date().toISOString(),
}));

// 🔌 Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/organizers', require('./routes/organizerRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// 🛑 Error Handling Middleware (Must be LAST)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );

  // ─── Graceful port-in-use error (prevents unhandled 'error' event crash) ───
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n❌ Port ${PORT} is already in use.\n` +
        `   Run this to free it:\n` +
        `   npx kill-port ${PORT}\n` +
        `   Then restart: npm run dev\n`
      );
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
});