const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// ═══════════════════════════════════════════════
// 🔒 VALIDATION RULES
// ═══════════════════════════════════════════════

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  // ⚠️ ACADEMIC NOTE: 'admin' allowed for TCS setup
  // Remove 'admin' from isIn() before production deployment
  body('role')
    .optional()
    .isIn(['user', 'organizer', 'admin'])
    .withMessage('Role must be user, organizer, or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

// ═══════════════════════════════════════════════
// 🛤️ ROUTES
// ═══════════════════════════════════════════════

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/profile
// @desc    Get logged-in user profile
// @access  Protected
router.get('/profile', verifyToken, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile (name/email)
// @access  Protected
router.put('/profile', verifyToken, updateProfileValidation, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Protected
router.put('/change-password', verifyToken, changePasswordValidation, changePassword);

module.exports = router;