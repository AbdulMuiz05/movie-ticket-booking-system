import mongoose from 'mongoose';

const movieSnapshotSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    poster: { type: String, default: '' },
    backdrop: { type: String, default: '' },
    duration: { type: Number, required: true, min: 1 },
    language: { type: String, default: 'EN' },
    rating: { type: Number, default: 0 },
    genre: { type: [String], default: [] },
  },
  { _id: false }
);

const occupiedSeatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['reserved', 'booked'], default: 'reserved' },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: { type: movieSnapshotSchema, required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true, index: true },
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    ticketPrice: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    occupiedSeats: { type: [occupiedSeatSchema], default: [] },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
      default: 'SCHEDULED',
      index: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

showSchema.virtual('availableSeats').get(function () {
  const now = Date.now();
  const active = (this.occupiedSeats || []).filter(
    (s) => s.status === 'booked' || (s.status === 'reserved' && s.expiresAt.getTime() > now)
  );
  return this.totalSeats - active.length;
});

showSchema.index({ 'movie.tmdbId': 1, date: 1 });
showSchema.index({ screen: 1, startTime: 1 }, { unique: true });

export const Show = mongoose.model('Show', showSchema);