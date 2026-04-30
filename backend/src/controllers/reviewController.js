const Review  = require('../models/Review')
const Booking = require('../models/Booking')
const Event   = require('../models/Event')
const User    = require('../models/User')

// ═══════════════════════════════════════════════
// ✍️ SUBMIT REVIEW
// @route   POST /api/reviews/:eventId
// @access  User (confirmed booking + past event)
// ═══════════════════════════════════════════════
exports.submitReview = async (req, res) => {
  try {
    const { eventId } = req.params
    const userId      = req.user.id
    const { eventRating, eventComment, organizerRating, organizerComment } = req.body

    // 1. Event exists
    const event = await Event.findById(eventId)
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    // 2. Event must be in the past
    if (new Date(event.date) >= new Date())
      return res.status(400).json({
        success: false,
        message: 'You can only review events that have already taken place.'
      })

    // 3. User must have a confirmed booking
    const booking = await Booking.findOne({ userId, eventId, status: 'confirmed' })
    if (!booking)
      return res.status(403).json({
        success: false,
        message: 'You must have attended this event to leave a review.'
      })

    // 4. Validate ratings
    if (!eventRating || eventRating < 1 || eventRating > 5)
      return res.status(400).json({ success: false, message: 'Event rating must be between 1 and 5.' })

    if (!organizerRating || organizerRating < 1 || organizerRating > 5)
      return res.status(400).json({ success: false, message: 'Organizer rating must be between 1 and 5.' })

    // 5. Upsert review (one per user per event)
    const review = await Review.findOneAndUpdate(
      { userId, eventId },
      {
        userId,
        eventId,
        organizerId:      event.organizerId,
        eventRating:      Math.round(eventRating),
        eventComment:     eventComment     || '',
        organizerRating:  Math.round(organizerRating),
        organizerComment: organizerComment || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )

    // 6. Manually recalculate organizer avgRating
    // (findOneAndUpdate doesn't trigger post('save') hook)
    const orgAgg = await Review.aggregate([
      { $match: { organizerId: event.organizerId } },
      { $group: { _id: null, avg: { $avg: '$organizerRating' }, count: { $sum: 1 } } }
    ])
    if (orgAgg.length > 0) {
      await User.findByIdAndUpdate(event.organizerId, {
        avgRating:   Math.round(orgAgg[0].avg * 10) / 10,
        reviewCount: orgAgg[0].count
      })
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review
    })
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'You have already reviewed this event.' })
    res.status(500).json({ success: false, message: 'Failed to submit review', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 📋 GET REVIEWS FOR AN EVENT
// @route   GET /api/reviews/event/:eventId
// @access  Public
// ═══════════════════════════════════════════════
exports.getEventReviews = async (req, res) => {
  try {
    // ✅ Fixed: proper pagination instead of hardcoded limit(50)
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const skip  = (page - 1) * limit

    const total   = await Review.countDocuments({ eventId: req.params.eventId })
    const reviews = await Review.find({ eventId: req.params.eventId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const avgEvent = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.eventRating, 0) / reviews.length) * 10) / 10
      : 0

    res.status(200).json({
      success:        true,
      reviews,
      avgEventRating: avgEvent,
      count:          reviews.length,
      total,
      page,
      pages:          Math.ceil(total / limit)
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 🔍 CHECK IF USER ALREADY REVIEWED
// @route   GET /api/reviews/check/:eventId
// @access  Authenticated
// ═══════════════════════════════════════════════
exports.checkUserReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      userId:  req.user.id,
      eventId: req.params.eventId
    })
    res.status(200).json({
      success:    true,
      hasReviewed: !!review,
      review:     review || null
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check review status' })
  }
}

// ═══════════════════════════════════════════════
// 🏆 GET ORGANIZER REVIEWS
// @route   GET /api/reviews/organizer/:organizerId
// @access  Public
// ═══════════════════════════════════════════════
exports.getOrganizerReviews = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const skip  = (page - 1) * limit

    const total   = await Review.countDocuments({ organizerId: req.params.organizerId })
    const reviews = await Review.find({ organizerId: req.params.organizerId })
      .populate('userId',  'name')
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Overall organizer avg rating
    const orgAgg = await Review.aggregate([
      { $match: { organizerId: require('mongoose').Types.ObjectId.createFromHexString(req.params.organizerId) } },
      { $group: { _id: null, avg: { $avg: '$organizerRating' }, count: { $sum: 1 } } }
    ])

    res.status(200).json({
      success:            true,
      reviews,
      count:              reviews.length,
      total,
      page,
      pages:              Math.ceil(total / limit),
      avgOrganizerRating: orgAgg[0] ? Math.round(orgAgg[0].avg * 10) / 10 : 0
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch organizer reviews', error: err.message })
  }
}