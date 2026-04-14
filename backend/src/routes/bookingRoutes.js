const express = require('express');
const router = express.Router();
const {
  bookEvent,
  getMyBookings,
  getBookingById,
  getEventBookings,
  cancelBooking
} = require('../controllers/bookingController');
const {
  verifyToken,
  authorize
} = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// ═══════════════════════════════════════════════
// 🔒 VALIDATION RULES
// ═══════════════════════════════════════════════
const bookingValidation = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Valid event ID required'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .toInt()
    .withMessage('Quantity must be between 1 and 10')
];

const mongoIdValidation = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`)
];

// ═══════════════════════════════════════════════
// 🛤️ ROUTES
// ⚠️ ORDER MATTERS: Static routes MUST come
//    before dynamic /:id routes to prevent
//    Express matching 'my' or 'event' as an ID
// ═══════════════════════════════════════════════

// @route   POST /api/bookings
// @desc    Book an event (with seat validation)
// @access  User | Organizer | Admin
router.post(
  '/',
  verifyToken,
  authorize('user', 'organizer', 'admin'),
  bookingValidation,
  bookEvent
);

// ─────────────────────────────────────────────
// ⚠️ STATIC ROUTES FIRST (before /:id)
// ─────────────────────────────────────────────

// @route   GET /api/bookings/my
// @desc    Get logged-in user's own bookings
// @access  All authenticated users
router.get(
  '/my',
  verifyToken,
  getMyBookings
);

// @route   GET /api/bookings/event/:eventId
// @desc    Get all bookings for a specific event
// @access  Organizer (own events) | Admin
router.get(
  '/event/:eventId',
  verifyToken,
  authorize('organizer', 'admin'),
  mongoIdValidation('eventId'),
  getEventBookings
);

// ─────────────────────────────────────────────
// ⚠️ DYNAMIC ROUTES LAST (after static routes)
// ─────────────────────────────────────────────

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Owner | Admin
router.get(
  '/:id',
  verifyToken,
  mongoIdValidation('id'),
  getBookingById
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking (restores seats)
// @access  Owner | Admin
router.put(
  '/:id/cancel',
  verifyToken,
  authorize('user', 'organizer', 'admin'),
  mongoIdValidation('id'),
  cancelBooking
);

module.exports = router;