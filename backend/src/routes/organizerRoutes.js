const express = require('express')
const router  = express.Router()
const { getOrganizerProfile, getMyAttendees } = require('../controllers/organizerController')
const { optionalAuth, verifyToken, authorize } = require('../middleware/authMiddleware')
const { param }                                = require('express-validator')

// ✅ MongoId param validator
const mongoIdParam = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`)
]

// ═══════════════════════════════════════════════
// @route   GET /api/organizers/my/attendees
// @desc    Organizer: see all users who booked their events
// @access  Organizer | Admin  (read-only user info)
// ⚠️  MUST come before /:id  to prevent Express matching
//     "my" as a Mongo ObjectId
// ═══════════════════════════════════════════════
router.get(
  '/my/attendees',
  verifyToken,
  authorize('organizer', 'admin'),
  getMyAttendees
)

// ═══════════════════════════════════════════════
// @route   GET /api/organizers/:id
// @desc    Get organizer profile + stats + their events
// @access  Public (optionalAuth for role-based event visibility)
// ═══════════════════════════════════════════════
router.get(
  '/:id',
  optionalAuth,
  mongoIdParam('id'),
  getOrganizerProfile
)

module.exports = router