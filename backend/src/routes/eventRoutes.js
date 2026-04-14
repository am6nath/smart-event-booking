const express = require('express');
const router = express.Router();
const {
  getEvents,
  getMyEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  requestEventUpdate
} = require('../controllers/eventController');
const {
  verifyToken,
  optionalAuth,
  authorize
} = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// ═══════════════════════════════════════════════
// 🔒 VALIDATION RULES
// ═══════════════════════════════════════════════
const eventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('date')
    .isISO8601()
    .withMessage('Valid date required (ISO 8601 format e.g. 2025-12-01T10:00:00Z)')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('totalSeats')
    .isInt({ min: 1 })
    .withMessage('Total seats must be a positive integer'),

  body('ticketPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be 0 or greater'),

  body('category')
    .optional()
    .isIn([
      'conference', 'workshop', 'concert',
      'sports', 'networking', 'webinar',
      'festival', 'other'
    ])
    .withMessage('Invalid category'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

// ═══════════════════════════════════════════════
// 🌐 PUBLIC ROUTES
// ═══════════════════════════════════════════════

// @route   GET /api/events
// @desc    Get all approved events (role-aware filtering)
// @access  Public (optionalAuth for organizer/admin extra data)
router.get('/', optionalAuth, getEvents);

// ═══════════════════════════════════════════════
// 🔐 ORGANIZER SPECIFIC ROUTES
// ⚠️ MUST be defined BEFORE /:id routes
//    to prevent 'my-events' or 'stats' being
//    interpreted as a MongoDB ObjectId
// ═══════════════════════════════════════════════

// @route   GET /api/events/organizer/my
// @desc    Get organizer's own events with stats
// @access  Organizer | Admin
router.get(
  '/organizer/my',
  verifyToken,
  authorize('organizer', 'admin'),
  getMyEvents
);

// ═══════════════════════════════════════════════
// 🔍 SINGLE EVENT ROUTES (/:id based)
// ═══════════════════════════════════════════════

// @route   GET /api/events/:id
// @desc    Get single event details
// @access  Public (non-approved visible to owner/admin only)
router.get('/:id', optionalAuth, getEvent);

// @route   GET /api/events/:id/stats
// @desc    Get event booking statistics
// @access  Organizer (own events) | Admin
router.get(
  '/:id/stats',
  verifyToken,
  authorize('organizer', 'admin'),
  getEventStats
);

// ═══════════════════════════════════════════════
// ✏️ CRUD ROUTES (Protected)
// ═══════════════════════════════════════════════

// @route   POST /api/events
// @desc    Create new event (submitted for admin approval)
// @access  Organizer | Admin
router.post(
  '/',
  verifyToken,
  authorize('organizer', 'admin'),
  eventValidation,
  createEvent
);

// @route   PUT /api/events/:id
// @desc    Update event (non-approved only for organizer)
// @access  Organizer (own) | Admin
router.put(
  '/:id',
  verifyToken,
  authorize('organizer', 'admin'),
  eventValidation,
  updateEvent
);

// @route   POST /api/events/:id/request-update
// @desc    Request admin approval to update an approved event
// @access  Organizer (own)
router.post(
  '/:id/request-update',
  verifyToken,
  authorize('organizer'),
  requestEventUpdate
);

// @route   DELETE /api/events/:id
// @desc    Delete event + cascade delete bookings
// @access  Organizer (own) | Admin
router.delete(
  '/:id',
  verifyToken,
  authorize('organizer', 'admin'),
  deleteEvent
);

module.exports = router;