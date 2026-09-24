import mongoose from 'mongoose';

const seatConfigSchema = new mongoose.Schema(
  {
    row: { type: String, required: true },
    seatType: { type: String, enum: ['REGULAR', 'PREMIUM', 'RECLINER'], default: 'REGULAR' },
    priceMultiplier: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true, index: true },
    name: { type: String, required: true, trim: true },
    screenNumber: { type: Number, required: true, min: 1 },
    capacity: { type: Number, required: true, min: 1 },
    screenType: {
      type: String,
      enum: ['STANDARD', 'IMAX', '3D', '4DX', 'DOLBY'],
      default: 'STANDARD',
    },
    rows: { type: Number, required: true, min: 1 },
    columns: { type: Number, required: true, min: 1 },
    seatConfiguration: { type: [seatConfigSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

screenSchema.index({ cinema: 1, screenNumber: 1 }, { unique: true });

export const Screen = mongoose.model('Screen', screenSchema);