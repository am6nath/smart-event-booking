const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer ID is required']
  },

  // ── Event Review ──────────────────────────────
  eventRating: {
    type: Number,
    required: [true, 'Event rating is required'],
    min: 1,
    max: 5
  },
  eventComment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },

  // ── Organizer Review ──────────────────────────
  organizerRating: {
    type: Number,
    required: [true, 'Organizer rating is required'],
    min: 1,
    max: 5
  },
  organizerComment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// One review per user per event
reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });
// Fast organizer-level aggregation
reviewSchema.index({ organizerId: 1, createdAt: -1 });
// Fast event-level aggregation
reviewSchema.index({ eventId: 1, createdAt: -1 });

// ── POST SAVE: recalculate organizer's avgRating on User ──────────────────
reviewSchema.post('save', async function () {
  try {
    const Review = this.constructor;
    const agg = await Review.aggregate([
      { $match: { organizerId: this.organizerId } },
      {
        $group: {
          _id: '$organizerId',
          avgRating: { $avg: '$organizerRating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    if (agg.length > 0) {
      await mongoose.model('User').findByIdAndUpdate(this.organizerId, {
        avgRating: Math.round(agg[0].avgRating * 10) / 10,
        reviewCount: agg[0].reviewCount
      });
    }
  } catch (err) {
    console.error('Rating recalculation error:', err.message);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
