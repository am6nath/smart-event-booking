const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { generateTicketId } = require('../utils/ticketGenerator');
const { validationResult } = require('express-validator');

// 🎫 Book an Event (Atomic Seat Validation + Quantity Support)
exports.bookEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { eventId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const userId = req.user.id;

    // Check event exists and is approved
    const eventExists = await Event.findById(eventId);
    if (!eventExists) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (eventExists.status !== 'approved') return res.status(400).json({ success: false, message: 'This event is not available for booking.' });

    // Check for duplicate booking
    const existingBooking = await Booking.findOne({ userId, eventId, status: 'confirmed' });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'You have already booked this event.' });
    }

    // Atomic seat validation & decrement
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: qty } },
      { $inc: { availableSeats: -qty } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: `Not enough seats available. Please choose fewer tickets.`
      });
    }

    // Generate unique ticket ID
    const ticketId = generateTicketId(userId, eventId);

    // Create booking record
    const booking = await Booking.create({ userId, eventId, ticketId, quantity: qty, status: 'confirmed' });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('eventId', 'title date location ticketPrice category')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: `Booking confirmed for ${qty} ticket(s)! 🎉`,
      booking: populatedBooking,
      ticketId,
      remainingSeats: updatedEvent.availableSeats
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate booking detected.' });
    }
    res.status(500).json({ success: false, message: 'Booking failed', error: err.message });
  }
};

// 📋 Get User's Bookings
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user.id };

    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('eventId', 'title description date location availableSeats status ticketPrice category imageUrl')
      .sort({ bookedAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: err.message });
  }
};

// 🎫 Get Single Booking by ID (for BookingSuccess page)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title description date location ticketPrice category imageUrl')
      .populate('userId', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only the owner or admin can view the booking
    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking', error: err.message });
  }
};

// 📋 Get Event's Bookings (Organizer Only)
exports.getEventBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const event = await Event.findById(req.params.eventId);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view bookings for this event' });
    }

    const query = { eventId: req.params.eventId };
    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .sort({ bookedAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event bookings', error: err.message });
  }
};

// ❌ Cancel Booking (Restores Seats)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }
// Optional: Prevent cancellation within 24 hours of event
const event = await Event.findById(booking.eventId);
const hoursUntilEvent = (new Date(event.date) - new Date()) / (1000 * 60 * 60);
if (hoursUntilEvent < 24) {
  return res.status(400).json({
    success: false,
    message: 'Cancellations are not allowed within 24 hours of the event.'
  });
}
    // Restore seat availability
    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { availableSeats: booking.quantity }
    });

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: `Booking cancelled. ${booking.quantity} seat(s) released.`,
      booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: err.message });
  }
};