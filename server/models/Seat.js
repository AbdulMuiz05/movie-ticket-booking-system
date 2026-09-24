import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true, index: true },
    seatNumber: { type: String, required: true },
    row: { type: String, required: true },
    column: { type: Number, required: true },
    seatType: { type: String, enum: ['REGULAR', 'PREMIUM', 'RECLINER'], default: 'REGULAR' },
    priceMultiplier: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

seatSchema.index({ screen: 1, seatNumber: 1 }, { unique: true });

export const Seat = mongoose.model('Seat', seatSchema);