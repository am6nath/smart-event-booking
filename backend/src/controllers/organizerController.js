const User    = require('../models/User')
const Event   = require('../models/Event')
const Booking = require('../models/Booking')
const { validationResult } = require('express-validator')

// ═══════════════════════════════════════════════
// 👤 GET ORGANIZER PROFILE
// @route   GET /api/organizers/:id
// @access  Public
// ═══════════════════════════════════════════════
exports.getOrganizerProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() })

    // ✅ Fixed: include avgRating + reviewCount for frontend display
    const organizer = await User.findById(req.params.id)
      .select('name email createdAt role avgRating reviewCount')

    if (!organizer)
      return res.status(404).json({ success: false, message: 'User not found.' })

    if (organizer.role !== 'organizer')
      return res.status(404).json({ success: false, message: 'Organizer not found.' })

    // Role-aware event visibility
    const eventsQuery = { organizerId: organizer._id }
    if (!req.user || req.user.role === 'user') {
      eventsQuery.status = 'approved'
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const skip  = (page - 1) * limit

    const totalEventCount = await Event.countDocuments(eventsQuery)

    const events = await Event.find(eventsQuery)
      .select('title date location status availableSeats totalSeats ticketPrice imageUrl category')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)

    // Stats across ALL approved events
    const allApprovedEvents = await Event.find({
      organizerId: organizer._id,
      status: 'approved'
    }).select('_id')

    const approvedCount  = allApprovedEvents.length
    const totalAttendees = await Booking.countDocuments({
      eventId: { $in: allApprovedEvents.map(e => e._id) },
      status: 'confirmed'
    })
    const totalEventsAll = await Event.countDocuments({ organizerId: organizer._id })

    const trustScore =
      approvedCount >= 10 ? 'Top Organizer' :
      approvedCount >= 5  ? 'Verified'      :
      approvedCount >= 1  ? 'Active'        :
                            'New'

    res.status(200).json({
      success: true,
      data: {
        organizer: {
          id:          organizer._id,
          name:        organizer.name,
          email:       organizer.email,
          memberSince: organizer.createdAt,
          // ✅ Fixed: expose rating fields
          avgRating:   organizer.avgRating   || 0,
          reviewCount: organizer.reviewCount || 0,
          trustScore
        },
        stats: {
          totalEvents:    totalEventsAll,
          approvedEvents: approvedCount,
          totalAttendees
        },
        events,
        pagination: {
          total: totalEventCount,
          page,
          pages: Math.ceil(totalEventCount / limit),
          limit
        }
      }
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer profile.',
      error:   err.message
    })
  }
}

// ═══════════════════════════════════════════════
// 📋 GET ALL ATTENDEES FOR ORGANIZER'S EVENTS
// @route   GET /api/organizers/my/attendees
// @access  Organizer | Admin
// ═══════════════════════════════════════════════
exports.getMyAttendees = async (req, res) => {
  try {
    const organizerId = req.user.id

    const myEvents = await Event.find({ organizerId })
      .select('_id title date location status')
      .lean()

    if (!myEvents.length) {
      return res.status(200).json({
        success:   true,
        count:     0,
        attendees: [],
        events:    [],
        pagination: { total: 0, page: 1, pages: 0, limit: 20 }
      })
    }

    const eventIds = myEvents.map(e => e._id)
    const { eventId, status, search } = req.query

    const query = { eventId: { $in: eventIds } }
    if (eventId && eventIds.map(String).includes(eventId))
      query.eventId = eventId
    if (status && ['confirmed', 'cancelled'].includes(status))
      query.status = status

    const page  = Math.max(parseInt(req.query.page)  || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const skip  = (page - 1) * limit

    const totalCount = await Booking.countDocuments(query)

    let bookings = await Booking.find(query)
      .populate('userId',  'name email createdAt')
      .populate('eventId', 'title date location status')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Post-populate search
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      bookings = bookings.filter(b =>
        b.userId?.name?.toLowerCase().includes(s)  ||
        b.userId?.email?.toLowerCase().includes(s) ||
        b.ticketId?.toLowerCase().includes(s)
      )
    }

    res.status(200).json({
      success:   true,
      count:     totalCount,
      attendees: bookings.map(b => ({
        bookingId: b._id,
        ticketId:  b.ticketId,
        status:    b.status,
        quantity:  b.quantity,
        bookedAt:  b.bookedAt,
        user: b.userId ? {
          id:    b.userId._id,
          name:  b.userId.name,
          email: b.userId.email
        } : null,
        event: b.eventId ? {
          id:       b.eventId._id,
          title:    b.eventId.title,
          date:     b.eventId.date,
          location: b.eventId.location,
          status:   b.eventId.status
        } : null
      })),
      events: myEvents,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        limit
      }
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendees.',
      error:   err.message
    })
  }
}