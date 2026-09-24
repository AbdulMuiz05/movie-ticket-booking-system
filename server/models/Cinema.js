import mongoose from 'mongoose';

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'IN' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    facilities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Cinema = mongoose.model('Cinema', cinemaSchema);