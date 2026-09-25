import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      default: 'usd',
    },
    provider: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'requires_payment',
        'processing',
        'succeeded',
        'failed',
        'refunded',
        'cancelled',
      ],
      default: 'requires_payment',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawEvent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, createdAt: -1 });

export const Payment = mongoose.model(
  'Payment',
  paymentSchema
);