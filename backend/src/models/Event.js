const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Event title is required'], 
    trim: true, 
    maxlength: 100 
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'], 
    maxlength: 1000 
  },
  date: { 
    type: Date, 
    required: [true, 'Event date is required'] 
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'], 
    trim: true 
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'concert', 'sports', 'networking', 'webinar', 'festival', 'other'],
    default: 'other'
  },
  ticketPrice: { 
    type: Number, 
    default: 0, 
    min: 0 
  }, // 0 = Free
  totalSeats: { 
    type: Number, 
    required: [true, 'Total seats required'], 
    min: 1 
  },
  availableSeats: { 
    type: Number, 
    required: [true, 'Available seats required'], 
    min: 0 
  },
  organizerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  imageUrl: { 
    type: String, 
    trim: true, 
    default: '' 
  }, // Optional event banner

  // Event approval workflow
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  editRequestStatus: {
    type: String,
    enum: ['none', 'pending', 'approved'],
    default: 'none'
  },
  rejectionReason: { 
    type: String, 
    trim: true, 
    maxlength: 500 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ INDEXES FOR PERFORMANCE ============
eventSchema.index({ date: 1, location: 1 });
eventSchema.index({ status: 1, organizerId: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ title: 'text', description: 'text', location: 'text' }); // 🔍 Text search

// ============ VIRTUALS (Derived Properties) ============
eventSchema.virtual('isSoldOut').get(function() {
  return this.availableSeats <= 0;
});

eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// ============ PRE-SAVE VALIDATION (Data Integrity) ============
eventSchema.pre('save', function(next) {
  // Prevent availableSeats > totalSeats
  if (this.availableSeats > this.totalSeats) {
    this.availableSeats = this.totalSeats;
  }
  // Prevent negative availableSeats
  if (this.availableSeats < 0) {
    this.availableSeats = 0;
  }
  next();
});

// ============ STATIC METHODS (Reusable Queries) ============
eventSchema.statics.findApproved = function() {
  return this.find({ status: 'approved', availableSeats: { $gt: 0 }, date: { $gte: new Date() } });
};

eventSchema.statics.findByOrganizer = function(organizerId) {
  return this.find({ organizerId });
};

// ============ INSTANCE METHODS ============
eventSchema.methods.canBook = function() {
  return this.status === 'approved' && this.availableSeats > 0 && this.date > new Date();
};

module.exports = mongoose.model('Event', eventSchema);