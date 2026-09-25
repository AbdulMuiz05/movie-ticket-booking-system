import mongoose from 'mongoose';

const movieSnapshotSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    poster: { type: String, default: '' },
    duration: { type: Number, default: 120 },
    language: { type: String, default: 'EN' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    movie: { type: movieSnapshotSchema, required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    seats: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one seat is required',
      },
    },
    quantity: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    bookingReference: { type: String, required: true, unique: true, index: true },
    paymentReference: { type: String, default: '' },
    confirmationEmailSentAt: { type: Date, default: null },
    reminderEmailSentAt: { type: Date, default: null },
    reservationExpiresAt: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    refundId: { type: String, default: '' },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);