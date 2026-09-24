import mongoose from 'mongoose';

const castSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    character: { type: String, default: '' },
    profilePath: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    poster: { type: String, required: true },
    backdrop: { type: String, default: '' },
    trailer: { type: String, default: '' },
    language: { type: String, required: true, default: 'en' },
    genre: { type: [String], default: [] },
    duration: { type: Number, required: true, min: 1 },
    releaseDate: { type: Date, required: true },
    cast: { type: [castSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 10 },
    popularity: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['UPCOMING', 'NOW_SHOWING', 'ENDED'],
      default: 'NOW_SHOWING',
      index: true,
    },
    tmdbId: { type: Number, unique: true, sparse: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', description: 'text' });

export const Movie = mongoose.model('Movie', movieSchema);