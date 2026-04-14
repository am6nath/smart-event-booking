require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // 🔹 NEW: Import rate limiter
const helmet = require('helmet'); // Security headers
const compression = require('compression'); // Payload compression
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


const path = require('path');

const app = express();

// 📂 Serve Static Uploads
app.use(express.static(path.join(__dirname, '../public')));

// 🌐 Core Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // ALLOW image serving cross-origin
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 📡 Health Check (exempt from rate limiting for monitoring)
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Server Running' }));

// 🔐 Test JWT Route (Debug Only - Remove Before Submission)
app.get('/api/test-jwt', (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.json({ msg: 'No token', secret: process.env.JWT_SECRET ? 'SET' : 'NOT SET' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ msg: '✅ Token valid!', decoded });
  } catch (err) {
    res.json({ 
      msg: '❌ Token invalid', 
      error: err.name, 
      details: err.message,
      secret: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    });
  }
});

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
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});