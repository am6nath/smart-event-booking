const express = require('express');
const router = express.Router();
const {
  submitReview,
  getEventReviews,
  checkUserReview,
  getOrganizerReviews
} = require('../controllers/reviewController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/reviews/:eventId
// @desc    Submit a review (event + organizer) after attending
// @access  User (confirmed booking + event past)
router.post('/:eventId', verifyToken, authorize('user', 'organizer', 'admin'), submitReview);

// @route   GET /api/reviews/event/:eventId
// @desc    Get all reviews for a specific event
// @access  Public
router.get('/event/:eventId', getEventReviews);

// @route   GET /api/reviews/check/:eventId
// @desc    Check if current user already reviewed this event
// @access  Authenticated
router.get('/check/:eventId', verifyToken, checkUserReview);

// @route   GET /api/reviews/organizer/:organizerId
// @desc    Get all reviews for an organizer
// @access  Public
router.get('/organizer/:organizerId', getOrganizerReviews);

module.exports = router;
