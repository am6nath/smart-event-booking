const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllEvents,
  approveEvent,
  deleteEvent,
  getAllBookings,
  approveEventUpdate,
  createUser,
  updateUser
} = require('../controllers/adminController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// ═══════════════════════════════════════════════
// 🔒 VALIDATION RULES
// ═══════════════════════════════════════════════
const roleValidation = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['user', 'organizer', 'admin'])
    .withMessage('Role must be user, organizer, or admin')
];

const userValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role')
];

const userUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role')
];

const approveEventValidation = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be "approve" or "reject"'),

  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting an event')
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters')
];

const mongoIdParam = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`)
];

// ═══════════════════════════════════════════════
// 🛤️ ADMIN ROUTES
// All routes protected by verifyToken + authorize('admin')
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// 📊 DASHBOARD
// ─────────────────────────────────────────────

// @route   GET /api/admin/dashboard
// @desc    Get platform overview stats
// @access  Admin only
router.get(
  '/dashboard',
  verifyToken,
  authorize('admin'),
  getDashboardStats
);

// ─────────────────────────────────────────────
// 👥 USER MANAGEMENT
// ─────────────────────────────────────────────

// @route   GET /api/admin/users
// @desc    Get all users with search/filter/pagination
// @access  Admin only
router.get(
  '/users',
  verifyToken,
  authorize('admin'),
  getAllUsers
);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (promote/demote)
// @access  Admin only
router.put(
  '/users/:id/role',
  verifyToken,
  authorize('admin'),
  mongoIdParam('id'),
  roleValidation,
  updateUserRole
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user + cascade delete their data
// @access  Admin only
router.delete(
  '/users/:id',
  verifyToken,
  authorize('admin'),
  mongoIdParam('id'),
  deleteUser
);

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Admin only
router.post(
  '/users',
  verifyToken,
  authorize('admin'),
  userValidation,
  createUser
);

// @route   PUT /api/admin/users/:id
// @desc    Update user details (name, email, password, role)
// @access  Admin only
router.put(
  '/users/:id',
  verifyToken,
  authorize('admin'),
  mongoIdParam('id'),
  userUpdateValidation,
  updateUser
);

// ─────────────────────────────────────────────
// 🎪 EVENT MANAGEMENT
// ─────────────────────────────────────────────

// @route   GET /api/admin/events
// @desc    Get all events with stats/filter/pagination
// @access  Admin only
router.get(
  '/events',
  verifyToken,
  authorize('admin'),
  getAllEvents
);

// @route   PUT /api/admin/events/:eventId/approve
// @desc    Approve or reject a pending event
// @access  Admin only
router.put(
  '/events/:eventId/approve',
  verifyToken,
  authorize('admin'),
  mongoIdParam('eventId'),
  approveEventValidation,
  approveEvent
);

// @route   PUT /api/admin/events/:eventId/approve-update
// @desc    Approve or reject an event update request from an organizer
// @access  Admin only
const approveUpdateValidation = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be "approve" or "reject"')
];

router.put(
  '/events/:eventId/approve-update',
  verifyToken,
  authorize('admin'),
  mongoIdParam('eventId'),
  approveUpdateValidation,
  approveEventUpdate
);

// @route   DELETE /api/admin/events/:id
// @desc    Delete event + cascade delete bookings
// @access  Admin only
router.delete(
  '/events/:id',
  verifyToken,
  authorize('admin'),
  mongoIdParam('id'),
  deleteEvent
);

// ─────────────────────────────────────────────
// 🎫 BOOKING MANAGEMENT
// ─────────────────────────────────────────────

// @route   GET /api/admin/bookings
// @desc    Get all bookings with pagination + search
// @access  Admin only
router.get(
  '/bookings',
  verifyToken,
  authorize('admin'),
  getAllBookings
);

module.exports = router;