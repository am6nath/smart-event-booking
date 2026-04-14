const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// ═══════════════════════════════════════════════
// 🔧 HELPER: Generate JWT Token
// ═══════════════════════════════════════════════
const generateToken = (id, role, email) =>
  jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

// ═══════════════════════════════════════════════
// 📝 REGISTER
// @route   POST /api/auth/register
// @access  Public
// ═══════════════════════════════════════════════
exports.register = async (req, res) => {
  // Step 1: Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role } = req.body;

  try {
    // Step 2: Check duplicate email
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.'
      });

    // Step 3: Assign role (defaults to 'user' if not provided)
    // ⚠️ NOTE: For production, restrict admin creation to seed.js only
    const safeRole = role || 'user';

    // Step 4: Create user (password auto-hashed by model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: safeRole
    });

    // Step 5: Generate token
    const token = generateToken(user._id, user.role, user.email);

    // Step 6: Return response
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome aboard.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 🔐 LOGIN
// @route   POST /api/auth/login
// @access  Public
// ═══════════════════════════════════════════════
exports.login = async (req, res) => {
  // Step 1: Validate inputs
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    // Step 2: Find user by email
    const user = await User.findOne({ email });

    // Step 3: Generic error (prevents user enumeration attack)
    if (!user)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });

    // Step 4: Compare password using model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });

    // Step 5: Generate token
    const token = generateToken(user._id, user.role, user.email);

    // Step 6: Return response
    res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 👤 GET PROFILE
// @route   GET /api/auth/profile
// @access  Protected (all roles)
// ═══════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// ✏️ UPDATE PROFILE
// @route   PUT /api/auth/profile
// @access  Protected (all roles)
// ═══════════════════════════════════════════════
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if email is taken by another user
    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user.id }
      });
      if (emailExists)
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account.'
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Profile update failed.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 🔑 CHANGE PASSWORD
// @route   PUT /api/auth/change-password
// @access  Protected (all roles)
// ═══════════════════════════════════════════════
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Step 1: Validate inputs
    if (!currentPassword || !newPassword)
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required.'
      });

    if (newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      });

    if (currentPassword === newPassword)
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.'
      });

    // Step 2: Fetch user with password
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });

    // Step 3: Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });

    // Step 4: Set new password (pre-save hook auto-hashes it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Password change failed.',
      error: err.message
    });
  }
};