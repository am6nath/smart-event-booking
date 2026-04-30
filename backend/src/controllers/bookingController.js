const Booking = require('../models/Booking')
const Event   = require('../models/Event')
const { generateTicketId } = require('../utils/ticketGenerator')
const { validationResult } = require('express-validator')

// ═══════════════════════════════════════════════
// 🎫 BOOK AN EVENT
// @route   POST /api/bookings
// @access  User | Organizer | Admin
// ═══════════════════════════════════════════════
exports.bookEvent = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() })

  try {
    const { eventId, quantity } = req.body
    const qty    = parseInt(quantity) || 1
    const userId = req.user.id

    // ── Step 1: Event exists & approved ───────
    const eventExists = await Event.findById(eventId)
    if (!eventExists)
      return res.status(404).json({ success: false, message: 'Event not found.' })

    if (eventExists.status !== 'approved')
      return res.status(400).json({ success: false, message: 'This event is not available for booking.' })

    // ── Step 2: Check past event ───────────────
    if (new Date(eventExists.date) < new Date())
      return res.status(400).json({ success: false, message: 'This event has already passed.' })

    // ── Step 3: Duplicate booking check ────────
    const existingBooking = await Booking.findOne({ userId, eventId, status: 'confirmed' })
    if (existingBooking)
      return res.status(400).json({ success: false, message: 'You have already booked this event.' })

    // ── Step 4: Atomic seat decrement ──────────
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: qty } },
      { $inc: { availableSeats: -qty } },
      { new: true }
    )

    if (!updatedEvent)
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available. Please choose fewer tickets.'
      })

    // ── Step 5: Generate ticket & create booking
    const ticketId = generateTicketId(userId, eventId)

    // ✅ Fixed: include priceAtBooking snapshot
    const booking = await Booking.create({
      userId,
      eventId,
      ticketId,
      quantity:       qty,
      status:         'confirmed',
      priceAtBooking: eventExists.ticketPrice  // ← Price snapshot
    })

    const populatedBooking = await Booking.findById(booking._id)
      .populate('eventId', 'title date location ticketPrice category imageUrl')
      .populate('userId',  'name email')

    res.status(201).json({
      success: true,
      message: `Booking confirmed for ${qty} ticket(s)! 🎉`,
      booking:        populatedBooking,
      ticketId,
      remainingSeats: updatedEvent.availableSeats
    })

  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Duplicate booking detected.' })

    res.status(500).json({ success: false, message: 'Booking failed', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 📋 GET USER'S BOOKINGS
// @route   GET /api/bookings/my
// @access  All authenticated roles
// ═══════════════════════════════════════════════
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query
    const query = { userId: req.user.id }

    if (status && ['confirmed', 'cancelled'].includes(status))
      query.status = status

    const bookings = await Booking.find(query)
      .populate('eventId', 'title description date location availableSeats status ticketPrice category imageUrl')
      .sort({ bookedAt: -1 })

    res.status(200).json({ success: true, count: bookings.length, bookings })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 🎫 GET SINGLE BOOKING BY ID
// @route   GET /api/bookings/:id
// @access  Owner | Admin
// ═══════════════════════════════════════════════
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title description date location ticketPrice category imageUrl')
      .populate('userId',  'name email')

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found' })

    if (
      booking.userId._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    )
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' })

    res.status(200).json({ success: true, booking })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 📋 GET EVENT'S BOOKINGS
// @route   GET /api/bookings/event/:eventId
// @access  Organizer (own events) | Admin
// ═══════════════════════════════════════════════
exports.getEventBookings = async (req, res) => {
  try {
    const { status } = req.query
    const event = await Event.findById(req.params.eventId)

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (
      event.organizerId.toString() !== req.user.id &&
      req.user.role !== 'admin'
    )
      return res.status(403).json({ success: false, message: 'Not authorized to view bookings for this event' })

    const query = { eventId: req.params.eventId }
    if (status && ['confirmed', 'cancelled'].includes(status))
      query.status = status

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .sort({ bookedAt: -1 })

    res.status(200).json({ success: true, count: bookings.length, bookings })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event bookings', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// ❌ CANCEL BOOKING
// @route   PUT /api/bookings/:id/cancel
// @access  Owner | Admin
// ═══════════════════════════════════════════════
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found' })

    if (
      booking.userId.toString() !== req.user.id &&
      req.user.role !== 'admin'
    )
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' })

    if (booking.status === 'cancelled')
      return res.status(400).json({ success: false, message: 'Booking already cancelled' })

    // ✅ Fixed: null guard on event
    const event = await Event.findById(booking.eventId)
    if (!event)
      return res.status(404).json({ success: false, message: 'Associated event not found' })

    // ── 24-hour cancellation rule ──────────────
    const hoursUntilEvent = (new Date(event.date) - new Date()) / (1000 * 60 * 60)
    if (hoursUntilEvent < 24)
      return res.status(400).json({
        success: false,
        message: 'Cancellations are not allowed within 24 hours of the event.'
      })

    // ── Restore seats + cancel booking ─────────
    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { availableSeats: booking.quantity }
    })

    booking.status = 'cancelled'
    await booking.save()

    res.status(200).json({
      success: true,
      message: `Booking cancelled. ${booking.quantity} seat(s) released.`,
      booking
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message })
  }
}