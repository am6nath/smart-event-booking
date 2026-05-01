const Event   = require('../models/Event')
const Booking = require('../models/Booking')
const Review  = require('../models/Review')
const { validationResult } = require('express-validator')

// ═══════════════════════════════════════════════
// 🌐 GET ALL EVENTS
// @route   GET /api/events
// @access  Public
// ═══════════════════════════════════════════════
exports.getEvents = async (req, res) => {
  try {
    const {
      search, location, fromDate, toDate, status,
      category, minPrice, maxPrice, minRating,
      limit = 10, page = 1, sortBy = 'date', order = 'asc'
    } = req.query

    const query = { status: 'approved' }

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    if (location) query.location = { $regex: location, $options: 'i' }
    if (category && category !== 'all') query.category = category

    if (fromDate || toDate) {
      query.date = {}
      if (fromDate) query.date.$gte = new Date(fromDate)
      if (toDate)   query.date.$lte = new Date(toDate)
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.ticketPrice = {}
      if (minPrice !== undefined) query.ticketPrice.$gte = Number(minPrice)
      if (maxPrice !== undefined) query.ticketPrice.$lte = Number(maxPrice)
    }

    // Role-aware filtering
    if (req.user?.role === 'organizer') {
      delete query.status
      
      const roleCondition = [{ status: 'approved' }, { organizerId: req.user.id }]
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: roleCondition }]
        delete query.$or
      } else {
        query.$or = roleCondition
      }

      if (status && ['draft','pending','approved','rejected','cancelled','completed'].includes(status)) {
        delete query.$or
        delete query.$and // Clear the role/search conditions if a specific status is requested for their own events
        query.status      = status
        query.organizerId = req.user.id
      }
    }

    if (req.user?.role === 'admin') {
      delete query.status
      if (status) query.status = status
    }

    const pageNum  = parseInt(page)
    const limitNum = parseInt(limit)
    const skip     = (pageNum - 1) * limitNum
    const sortOrder = order === 'desc' ? -1 : 1
    const sortField = ['date','title','ticketPrice','createdAt'].includes(sortBy) ? sortBy : 'date'

    const total = await Event.countDocuments(query)
    let events  = await Event.find(query)
      .lean()
      .populate('organizerId', 'name email avgRating reviewCount')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)

    // Attach per-event review ratings
    const eventIds    = events.map(e => e._id)
    const reviewAggs  = await Review.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: {
        _id:           '$eventId',
        avgEventRating: { $avg: '$eventRating' },
        reviewCount:   { $sum: 1 }
      }}
    ])

    const ratingMap = {}
    reviewAggs.forEach(r => {
      ratingMap[r._id.toString()] = {
        avg:   Math.round(r.avgEventRating * 10) / 10,
        count: r.reviewCount
      }
    })

    events = events.map(ev => ({
      ...ev,
      avgEventRating:   ratingMap[ev._id.toString()]?.avg   || 0,
      eventReviewCount: ratingMap[ev._id.toString()]?.count || 0
    }))

    // minRating post-filter (note: affects count accuracy)
    if (minRating) {
      events = events.filter(ev =>
        ev.avgEventRating >= parseFloat(minRating) ||
        ev.organizerId?.avgRating >= parseFloat(minRating)
      )
    }

    res.status(200).json({
      success: true,
      count:  events.length,
      total,
      page:   pageNum,
      pages:  Math.ceil(total / limitNum),
      data:   events
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 🗓️ GET ORGANIZER'S OWN EVENTS
// @route   GET /api/events/my-events
// @access  Organizer only
// ═══════════════════════════════════════════════
exports.getMyEvents = async (req, res) => {
  try {
    const { status } = req.query
    const query = { organizerId: req.user.id }

    if (status && ['draft','pending','approved','rejected','cancelled','completed'].includes(status))
      query.status = status

    const events = await Event.find(query)
      .lean()
      .populate('organizerId', 'name email')
      .sort({ createdAt: -1 })

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const confirmedBookings = await Booking.countDocuments({ eventId: event._id, status: 'confirmed' })
        const cancelledBookings = await Booking.countDocuments({ eventId: event._id, status: 'cancelled' })
        const revenue           = confirmedBookings * event.ticketPrice

        return {
          ...event,
          bookedSeats:       confirmedBookings,
          cancelledBookings,
          revenue,
          // ✅ Fixed: include editRequestStatus for dashboard display
          editRequestStatus: event.editRequestStatus,
          occupancyRate:     event.totalSeats > 0
            ? ((confirmedBookings / event.totalSeats) * 100).toFixed(1) + '%'
            : '0%'
        }
      })
    )

    res.status(200).json({ success: true, count: eventsWithStats.length, data: eventsWithStats })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your events', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 🔍 GET SINGLE EVENT
// @route   GET /api/events/:id
// @access  Public (approved) | Organizer/Admin (any)
// ═══════════════════════════════════════════════
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email avgRating reviewCount')

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (event.status !== 'approved') {
      if (!req.user)
        return res.status(404).json({ success: false, message: 'Event not found' })
      if (req.user.role === 'user')
        return res.status(404).json({ success: false, message: 'Event not found' })
      if (req.user.role === 'organizer' && event.organizerId._id.toString() !== req.user.id)
        return res.status(404).json({ success: false, message: 'Event not found' })
    }

    const totalBookings = await Booking.countDocuments({ eventId: event._id, status: 'confirmed' })

    // Attach event review stats
    const reviewAgg = await Review.aggregate([
      { $match: { eventId: event._id } },
      { $group: { _id: null, avgRating: { $avg: '$eventRating' }, count: { $sum: 1 } } }
    ])
    const avgEventRating   = reviewAgg[0] ? Math.round(reviewAgg[0].avgRating * 10) / 10 : 0
    const eventReviewCount = reviewAgg[0]?.count || 0

    res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        totalBookings,
        avgEventRating,
        eventReviewCount
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// ➕ CREATE EVENT
// @route   POST /api/events
// @access  Organizer | Admin
// ═══════════════════════════════════════════════
exports.createEvent = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() })

  try {
    const { title, description, date, location, totalSeats, ticketPrice, category, imageUrl } = req.body

    if (new Date(date) <= new Date())
      return res.status(400).json({ success: false, message: 'Event date must be in the future' })

    const event = await Event.create({
      title, description, date, location,
      totalSeats,
      availableSeats: totalSeats,
      ticketPrice:    ticketPrice || 0,
      category:       category   || 'other',
      imageUrl:       imageUrl   || '',
      organizerId:    req.user.id,
      // ✅ Admin bypasses approval
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    })

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin'
        ? 'Event created and published automatically.'
        : 'Event submitted successfully. Awaiting admin approval.',
      data: event,
      note: req.user.role === 'admin'
        ? 'Event is live.'
        : 'Event will be visible to the public after admin approval.'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create event', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// ✏️ UPDATE EVENT
// @route   PUT /api/events/:id
// @access  Organizer (own) | Admin
// ═══════════════════════════════════════════════
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' })

    if (
      event.status === 'approved' &&
      req.user.role === 'organizer' &&
      event.editRequestStatus !== 'approved'
    )
      return res.status(400).json({
        success: false,
        message: 'Approved events cannot be edited. Please request update access.'
      })

    const { title, description, date, location, totalSeats, ticketPrice, category, imageUrl } = req.body

    if (date && new Date(date) <= new Date())
      return res.status(400).json({ success: false, message: 'Event date must be in the future' })

    const updateData = {}
    if (title)                   updateData.title        = title
    if (description)             updateData.description  = description
    if (date)                    updateData.date         = date
    if (location)                updateData.location     = location
    if (category)                updateData.category     = category
    if (ticketPrice !== undefined) updateData.ticketPrice = ticketPrice
    if (imageUrl !== undefined)  updateData.imageUrl     = imageUrl

    if (totalSeats) {
      const bookedSeats = event.totalSeats - event.availableSeats
      if (totalSeats < bookedSeats)
        return res.status(400).json({
          success: false,
          message: `Cannot reduce seats below already booked count (${bookedSeats})`
        })
      updateData.totalSeats      = totalSeats
      updateData.availableSeats  = totalSeats - bookedSeats
    }

    if (req.user.role === 'organizer' && event.status !== 'approved')
      updateData.status = 'pending'

    // Reset edit access after use
    if (req.user.role === 'organizer' && event.editRequestStatus === 'approved')
      updateData.editRequestStatus = 'none'

    event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('organizerId', 'name email')

    res.status(200).json({ success: true, message: 'Event updated successfully', data: event })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update event', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 🗑️ DELETE EVENT
// @route   DELETE /api/events/:id
// @access  Organizer (own) | Admin
// ═══════════════════════════════════════════════
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' })

    const deletedBookings = await Booking.deleteMany({ eventId: event._id })
    await Review.deleteMany({ eventId: event._id }) // ✅ Also delete reviews
    await event.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Event and all associated data deleted successfully',
      deletedBookingsCount: deletedBookings.deletedCount
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete event', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 📊 GET EVENT STATISTICS
// @route   GET /api/events/:id/stats
// @access  Organizer (own) | Admin
// ═══════════════════════════════════════════════
exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to view stats for this event' })

    const [confirmedBookings, cancelledBookings] = await Promise.all([
      Booking.countDocuments({ eventId: event._id, status: 'confirmed' }),
      Booking.countDocuments({ eventId: event._id, status: 'cancelled' })
    ])

    const bookedSeats   = event.totalSeats - event.availableSeats
    const revenue       = confirmedBookings * event.ticketPrice
    const occupancyRate = ((bookedSeats / event.totalSeats) * 100).toFixed(1)

    res.status(200).json({
      success: true,
      data: {
        eventId:     event._id,
        eventTitle:  event.title,
        eventDate:   event.date,
        eventStatus: event.status,
        seats: {
          total:        event.totalSeats,
          booked:       bookedSeats,
          available:    event.availableSeats,
          occupancyRate: occupancyRate + '%'
        },
        bookings: {
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          total:     confirmedBookings + cancelledBookings
        },
        revenue: {
          ticketPrice:  event.ticketPrice,
          totalRevenue: revenue,
          currency:     'INR'
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event statistics', error: err.message })
  }
}

// ═══════════════════════════════════════════════
// 📨 REQUEST EVENT UPDATE
// @route   POST /api/events/:id/request-update
// @access  Organizer (own approved events)
// ═══════════════════════════════════════════════
exports.requestEventUpdate = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' })

    if (event.organizerId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' })

    if (event.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Event must be approved to request an update' })

    if (event.editRequestStatus === 'pending')
      return res.status(400).json({ success: false, message: 'Update request already pending' })

    event.editRequestStatus = 'pending'
    await event.save()

    res.status(200).json({ success: true, message: 'Update request submitted. Awaiting admin approval.', data: event })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to request update', error: err.message })
  }
}