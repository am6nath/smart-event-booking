const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// ═══════════════════════════════════════════════
// 📊 DASHBOARD STATS
// @route   GET /api/admin/stats
// @access  Admin only
// ═══════════════════════════════════════════════
exports.getDashboardStats = async (req, res) => {
  try {
    // 🔄 Run all count queries in parallel for performance
    const [
      totalUsers,
      totalOrganizers,
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      cancelledEvents,
      totalBookings,
      cancelledBookings,
      recentBookings,
      recentEvents,
      revenueData,
      monthlyData,
      categoryData
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'approved' }),
      Event.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: 'rejected' }),
      Event.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),

      // 🕐 Recent 5 bookings for activity feed
      Booking.find()
        .populate('userId', 'name email')
        .populate('eventId', 'title date location ticketPrice')
        .sort({ bookedAt: -1 })
        .limit(5),

      // 🕐 Recent 5 events pending approval OR update review
      Event.find({ $or: [{ status: 'pending' }, { editRequestStatus: 'pending' }] })
        .populate('organizerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),

      // 💰 Real revenue calculation using aggregation
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ['$quantity', '$event.ticketPrice'] }
            },
            totalTicketsSold: { $sum: '$quantity' }
          }
        }
      ]),

      // 📈 Traffic vs Sales Data (Monthly for last 6 months)
      Booking.aggregate([
        { $match: { status: 'confirmed', bookedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } } },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $group: {
            _id: { month: { $month: '$bookedAt' }, year: { $year: '$bookedAt' } },
            revenue: { $sum: { $multiply: ['$quantity', '$event.ticketPrice'] } },
            ticketsSold: { $sum: '$quantity' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // 🥧 Data for Category pie chart
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $group: {
            _id: { $ifNull: ['$event.category', 'other'] },
            value: { $sum: '$quantity' }
          }
        }
      ])
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalTicketsSold = revenueData[0]?.totalTicketsSold || 0;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trafficSales = monthlyData.map(d => ({
      name: monthNames[d._id.month - 1],
      traffic: d.ticketsSold,
      sales: d.revenue
    }));

    const categoryChart = categoryData.map(d => ({
      name: d._id ? (d._id.charAt(0).toUpperCase() + d._id.slice(1)) : 'Other',
      value: d.value
    }));

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers + totalOrganizers,
          regularUsers: totalUsers,
          organizers: totalOrganizers
        },
        events: {
          total: totalEvents,
          approved: approvedEvents,
          pending: pendingEvents,
          rejected: rejectedEvents,
          cancelled: cancelledEvents
        },
        bookings: {
          confirmed: totalBookings,
          cancelled: cancelledBookings,
          total: totalBookings + cancelledBookings
        },
        revenue: {
          totalRevenue,
          totalTicketsSold,
          currency: 'INR'
        },
        chartData: {
          trafficSales,
          category: categoryChart
        },
        recentBookings,
        pendingApprovalEvents: recentEvents
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 👥 GET ALL USERS
// @route   GET /api/admin/users
// @access  Admin only
// ═══════════════════════════════════════════════
exports.getAllUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 🔍 Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 👥 Filter by role
    if (role && ['user', 'organizer', 'admin'].includes(role)) {
      query.role = role;
    }

    // 📅 Filter by registration date range
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach booking count per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({
          userId: user._id,
          status: 'confirmed'
        });
        const eventCount = await Event.countDocuments({
          organizerId: user._id
        });
        return {
          ...user.toObject(),
          totalBookings: bookingCount,
          totalEvents: eventCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users: usersWithStats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 🔄 UPDATE USER ROLE
// @route   PUT /api/admin/users/:id/role
// @access  Admin only
// ═══════════════════════════════════════════════
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!role || !['user', 'organizer', 'admin'].includes(role))
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, organizer, or admin.'
      });

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id)
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.'
      });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });

    res.status(200).json({
      success: true,
      message: `User role updated to "${role}" successfully.`,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 🗑️ DELETE USER (CASCADE)
// @route   DELETE /api/admin/users/:id
// @access  Admin only
// ═══════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });

    // Prevent self-deletion
    if (user._id.toString() === req.user.id)
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });

    // 🧹 Cascade delete: bookings + events + their bookings
    const userEvents = await Event.find({ organizerId: user._id });
    const eventIds = userEvents.map((e) => e._id);

    await Booking.deleteMany({ eventId: { $in: eventIds } }); // Bookings for user's events
    await Booking.deleteMany({ userId: user._id });            // User's own bookings
    await Event.deleteMany({ organizerId: user._id });         // User's events
    await user.deleteOne();                                     // User record

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.',
      deletedData: {
        eventsDeleted: userEvents.length,
        userId: req.params.id
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// ➕ CREATE USER (Admin directly)
// @route   POST /api/admin/users
// @access  Admin only
// ═══════════════════════════════════════════════
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
  }
};

// ═══════════════════════════════════════════════
// ✏️ UPDATE USER DETAILS
// @route   PUT /api/admin/users/:id
// @access  Admin only
// ═══════════════════════════════════════════════
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) {
      if (!['user', 'organizer', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      if (req.params.id === req.user.id && role !== user.role) {
        return res.status(400).json({ success: false, message: 'You cannot change your own role' });
      }
      user.role = role;
    }
    
    if (password) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: err.message });
  }
};

// ═══════════════════════════════════════════════
// 🎪 GET ALL EVENTS (Admin View)
// @route   GET /api/admin/events
// @access  Admin only
// ═══════════════════════════════════════════════
exports.getAllEvents = async (req, res) => {
  try {
    const {
      search,
      location,
      status,
      category,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 🔍 Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 📍 Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // 🎯 Status filter
    if (
      status &&
      ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(status)
    ) {
      query.status = status;
    }

    // 🏷️ Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 📅 Date range filter
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 📊 Attach booking stats per event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const confirmedBookings = await Booking.countDocuments({
          eventId: event._id,
          status: 'confirmed'
        });
        const cancelledBookings = await Booking.countDocuments({
          eventId: event._id,
          status: 'cancelled'
        });
        const revenue = confirmedBookings * event.ticketPrice;

        return {
          ...event.toObject(),
          bookedSeats: confirmedBookings,
          cancelledBookings,
          revenue,
          occupancyRate:
            event.totalSeats > 0
              ? `${Math.round((confirmedBookings / event.totalSeats) * 100)}%`
              : '0%'
        };
      })
    );

    res.status(200).json({
      success: true,
      count: eventsWithStats.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      events: eventsWithStats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// ✅ APPROVE / REJECT EVENT
// @route   PUT /api/admin/events/:eventId/approve
// @access  Admin only
// ═══════════════════════════════════════════════
exports.approveEvent = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject".'
      });

    // Rejection must include a reason
    if (action === 'reject' && !rejectionReason?.trim())
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting an event.'
      });

    const event = await Event.findById(req.params.eventId);
    if (!event)
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });

    // Only pending events can be approved/rejected
    if (event.status !== 'pending')
      return res.status(400).json({
        success: false,
        message: `Event is already "${event.status}". Only pending events can be reviewed.`
      });

    // Update status
    event.status = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'reject') {
      event.rejectionReason = rejectionReason.trim();
      // Restore seats on rejection
      event.availableSeats = event.totalSeats;
    } else {
      // Clear any previous rejection reason on approval
      event.rejectionReason = undefined;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: `Event "${event.title}" has been ${event.status} successfully.`,
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        rejectionReason: event.rejectionReason || null
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to process event approval.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 🗑️ DELETE EVENT (CASCADE)
// @route   DELETE /api/admin/events/:id
// @access  Admin only
// ═══════════════════════════════════════════════
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });

    // Cascade delete all bookings for this event
    const deletedBookings = await Booking.deleteMany({ eventId: event._id });
    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event and all associated bookings deleted successfully.',
      deletedBookingsCount: deletedBookings.deletedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete event.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// 📋 GET ALL BOOKINGS
// @route   GET /api/admin/bookings
// @access  Admin only
// ═══════════════════════════════════════════════
exports.getAllBookings = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 🎯 Filter by status
    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);

    let bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location ticketPrice category')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 🔍 Search by user name/email or event title (post-populate filter)
    if (search) {
      const s = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.userId?.name?.toLowerCase().includes(s) ||
          b.userId?.email?.toLowerCase().includes(s) ||
          b.eventId?.title?.toLowerCase().includes(s) ||
          b.ticketId?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings.',
      error: err.message
    });
  }
};

// ═══════════════════════════════════════════════
// ✅ APPROVE / REJECT EVENT UPDATE REQUEST
// @route   PUT /api/admin/events/:eventId/approve-update
// @access  Admin only
// ═══════════════════════════════════════════════
exports.approveEventUpdate = async (req, res) => {
  try {
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject".'
      });

    const event = await Event.findById(req.params.eventId);
    if (!event)
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });

    if (event.editRequestStatus !== 'pending')
      return res.status(400).json({
        success: false,
        message: `Event update request is not pending. Current status: ${event.editRequestStatus}`
      });

    event.editRequestStatus = action === 'approve' ? 'approved' : 'none';
    await event.save();

    res.status(200).json({
      success: true,
      message: `Event update request has been ${action}d successfully.`,
      event: {
        _id: event._id,
        title: event.title,
        editRequestStatus: event.editRequestStatus
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to process event update approval.',
      error: err.message
    });
  }
};