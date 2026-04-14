const User    = require('../models/User')
const Event   = require('../models/Event')
const Booking = require('../models/Booking')
const { validationResult } = require('express-validator')


// ═══════════════════════════════════════════════
// 👤 GET ORGANIZER PROFILE
// @route   GET /api/organizers/:id
// @desc    Get organizer profile with stats & events
// @access  Public
// ═══════════════════════════════════════════════
exports.getOrganizerProfile = async (req, res) => {
  try {
    // ✅ Fix 1: Check validation errors from mongoIdParam
    const errors = validationResult(req)
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() })

    const organizer = await User.findById(req.params.id)
      .select('name email createdAt role')

    // ✅ Fix 2: Handle non-existent user AND wrong role
    if (!organizer)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      })

    if (organizer.role !== 'organizer')
      return res.status(404).json({
        success: false,
        message: 'Organizer not found.'
      })

    // ✅ Fix 3: Only show APPROVED events to public
    // Include imageUrl + ticketPrice for frontend display
    const eventsQuery = { organizerId: organizer._id }

    // If optionalAuth provided a logged-in user who is
    // admin → show all events; otherwise only approved
    if (!req.user || req.user.role === 'user') {
      eventsQuery.status = 'approved'
    }

    // ✅ Fix 4: Added pagination for large event lists
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const skip  = (page - 1) * limit

    const totalEventCount = await Event.countDocuments(eventsQuery)

    const events = await Event.find(eventsQuery)
      .select(
        'title date location status availableSeats totalSeats ticketPrice imageUrl category'
      )  // ✅ Fix 5: Added ticketPrice, imageUrl, category
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)

    // ── Stats (always across ALL approved events) ──
    const allApprovedEvents = await Event.find({
      organizerId: organizer._id,
      status: 'approved'
    }).select('_id')

    const approvedCount = allApprovedEvents.length

    const totalAttendees = await Booking.countDocuments({
      eventId: { $in: allApprovedEvents.map(e => e._id) },
      status: 'confirmed'
    })

    const totalEventsAll = await Event.countDocuments({
      organizerId: organizer._id
    })

    // ✅ Fix 6: Improved trust score logic
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
          trustScore
        },
        stats: {
          totalEvents:    totalEventsAll,
          approvedEvents: approvedCount,
          totalAttendees
        },
        events,
        // ✅ Fix 7: Pagination metadata
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
// @desc    Organizer sees who booked their events (read-only)
// @access  Organizer | Admin
// ═══════════════════════════════════════════════
exports.getMyAttendees = async (req, res) => {
  try {
    const organizerId = req.user.id

    // 1️⃣  Get all event IDs belonging to this organizer
    const myEvents = await Event.find({ organizerId })
      .select('_id title date location status')
      .lean()

    if (!myEvents.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        attendees: [],
        events: []
      })
    }

    const eventIds = myEvents.map(e => e._id)

    // 2️⃣  Optional filters from query string
    const { eventId, status, search } = req.query

    const query = { eventId: { $in: eventIds } }
    if (eventId && eventIds.map(String).includes(eventId)) {
      query.eventId = eventId
    }
    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status
    }

    // 3️⃣  Pagination
    const page  = Math.max(parseInt(req.query.page)  || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const skip  = (page - 1) * limit

    const totalCount = await Booking.countDocuments(query)

    let bookings = await Booking.find(query)
      .populate('userId',  'name email createdAt')   // only safe read fields
      .populate('eventId', 'title date location status')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // 4️⃣  Optional name/email search (post-DB filter on small pages)
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      bookings = bookings.filter(b =>
        b.userId?.name?.toLowerCase().includes(s) ||
        b.userId?.email?.toLowerCase().includes(s) ||
        b.ticketId?.toLowerCase().includes(s)
      )
    }

    res.status(200).json({
      success: true,
      count:   totalCount,
      attendees: bookings.map(b => ({
        bookingId:   b._id,
        ticketId:    b.ticketId,
        status:      b.status,
        quantity:    b.quantity,
        bookedAt:    b.bookedAt,
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
      events: myEvents,   // for the filter dropdown
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