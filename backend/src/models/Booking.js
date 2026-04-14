const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: [true, 'Event ID is required'] 
  },
  ticketId: { 
    type: String, 
    required: [true, 'Ticket ID is required'], 
    unique: true,
    uppercase: true,
    trim: true
  },
  // 🔹 Group Booking Support
  quantity: { 
    type: Number, 
    default: 1, 
    min: 1,
    max: 10 // Limit max tickets per booking to prevent abuse
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  bookedAt: { 
    type: Date, 
    default: Date.now 
  },
  // 🔹 Optional: Store price snapshot at time of booking
  priceAtBooking: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES ============
// Prevent same user booking same event twice (compound unique index)
bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });
// Faster lookup for user's bookings
bookingSchema.index({ userId: 1, bookedAt: -1 });
// Faster lookup for event's attendees
bookingSchema.index({ eventId: 1, status: 1 });

// ============ VIRTUALS (Derived Properties) ============
bookingSchema.virtual('totalPrice').get(function() {
  // Requires event to be populated; fallback to priceAtBooking
  if (this.eventId?.ticketPrice) {
    return this.eventId.ticketPrice * this.quantity;
  }
  return this.priceAtBooking * this.quantity;
});

bookingSchema.virtual('isActive').get(function() {
  return this.status === 'confirmed' && new Date(this.eventId?.date) > new Date();
});

// ============ PRE-SAVE VALIDATION (Data Integrity) ============
bookingSchema.pre('save', async function(next) {
  // Only run on new documents or when quantity changes
  if (this.isNew || this.isModified('quantity')) {
    const event = await mongoose.model('Event').findById(this.eventId);
    if (event && this.quantity > event.availableSeats) {
      throw new Error(`Only ${event.availableSeats} seats available`);
    }
  }
  next();
});

// ============ STATIC METHODS (Reusable Queries) ============
bookingSchema.statics.findByUser = function(userId) {
  return this.find({ userId, status: 'confirmed' })
    .populate('eventId', 'title date location imageUrl')
    .sort({ bookedAt: -1 });
};

bookingSchema.statics.findByEvent = function(eventId) {
  return this.find({ eventId, status: 'confirmed' })
    .populate('userId', 'name email')
    .sort({ bookedAt: 1 });
};

bookingSchema.statics.countConfirmedByEvent = function(eventId) {
  return this.countDocuments({ eventId, status: 'confirmed' });
};

// ============ INSTANCE METHODS ============
bookingSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
  
  // Return seats to event
  await mongoose.model('Event').findByIdAndUpdate(this.eventId, {
    $inc: { availableSeats: this.quantity }
  });
  
  return this;
};

bookingSchema.methods.getTicketDetails = function() {
  return {
    ticketId: this.ticketId,
    event: this.eventId?.title,
    date: this.eventId?.date,
    location: this.eventId?.location,
    quantity: this.quantity,
    totalPrice: this.totalPrice,
    status: this.status
  };
};

module.exports = mongoose.model('Booking', bookingSchema);