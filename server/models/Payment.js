import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'usd' },
    provider: { type: String, enum: ['stripe', 'manual'], default: 'stripe' },
    paymentIntentId: { type: String, index: true, sparse: true },
    sessionId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: ['requires_payment', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
      default: 'requires_payment',
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    rawEvent: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);