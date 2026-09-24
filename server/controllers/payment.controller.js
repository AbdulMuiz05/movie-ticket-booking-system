import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Show } from '../models/Show.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { sendBookingConfirmationEmail } from '../services/email.service.js';
import {
  getStripe,
  isStripeConfigured,
  getCurrency,
} from '../services/stripe.service.js';

const BOOKING_POPULATE = [
  { path: 'movie', select: 'title poster duration language rating genre' },
  { path: 'cinema', select: 'name city address' },
  { path: 'screen', select: 'name screenNumber screenType' },
  { path: 'show', select: 'date startTime endTime ticketPrice status' },
];

/**
 * Idempotent: given a Stripe PaymentIntent id, verify with Stripe and
 * transition the linked booking + seats. Safe to call from the confirm
 * endpoint and from the webhook — whichever fires first wins, the other
 * becomes a no-op.
 */
const confirmBookingFromPaymentIntent = async (paymentIntentId, rawEvent = null) => {
  const payment = await Payment.findOne({ paymentIntentId }).populate('booking');
  if (!payment) throw new Error(`Payment record not found for intent ${paymentIntentId}`);

  // Already confirmed — no-op.
  if (
    payment.status === 'succeeded' &&
    payment.booking &&
    payment.booking.bookingStatus === 'confirmed'
  ) {
    await payment.booking.populate(BOOKING_POPULATE);
    return { alreadyConfirmed: true, payment, booking: payment.booking };
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== 'succeeded') {
    payment.status = intent.status === 'canceled' ? 'cancelled' : 'failed';
    payment.rawEvent = rawEvent || payment.rawEvent || null;
    await payment.save();
    return { alreadyConfirmed: false, status: intent.status, payment };
  }

  payment.status = 'succeeded';
  payment.rawEvent = rawEvent || payment.rawEvent || null;
  await payment.save();

  const bookingId = payment.booking?._id || payment.booking;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found for payment');

  if (booking.bookingStatus !== 'confirmed') {
    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'confirmed';
    booking.paymentReference = paymentIntentId;
    booking.paidAt = new Date();
    await booking.save();
  }

  // Persistent booking — the seats stay held past the reservation window.
  await Show.updateOne(
    { _id: booking.show, 'occupiedSeats.booking': booking._id },
    { $set: { 'occupiedSeats.$[elem].status': 'booked' } },
    { arrayFilters: [{ 'elem.booking': booking._id }] }
  );

  await booking.populate(BOOKING_POPULATE);

  if (!booking.confirmationEmailSentAt) {
    try {
      await sendBookingConfirmationEmail(booking);
      await Booking.updateOne({ _id: booking._id }, { $set: { confirmationEmailSentAt: new Date() } });
      booking.confirmationEmailSentAt = new Date();
    } catch (err) {
      console.error('[email] booking confirmation failed:', err.message);
    }
  }

  return { alreadyConfirmed: false, payment, booking };
};

export const createIntent = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw ApiError.badRequest('Stripe is not configured on the server');
  }

  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  if (booking.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden();
  }
  if (booking.paymentStatus === 'paid' || booking.bookingStatus === 'confirmed') {
    throw ApiError.badRequest('Booking is already paid');
  }
  if (booking.bookingStatus !== 'pending' || booking.paymentStatus !== 'pending') {
    throw ApiError.badRequest(
      `Cannot pay a booking in state ${booking.bookingStatus}/${booking.paymentStatus}`
    );
  }
  if (booking.reservationExpiresAt <= new Date()) {
    throw ApiError.conflict('Reservation has expired — please book the seats again');
  }

  const stripe = getStripe();
  const currency = getCurrency();
  const amount = Math.round(booking.totalAmount * 100);

  // Reuse an existing live PaymentIntent if one is still valid.
  let intent = null;
  const existingPayment = await Payment.findOne({
    booking: booking._id,
    status: { $in: ['requires_payment', 'processing'] },
  }).sort({ createdAt: -1 });

  if (existingPayment?.paymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(
        existingPayment.paymentIntentId
      );
      if (
        [
          'requires_payment_method',
          'requires_confirmation',
          'requires_action',
          'processing',
        ].includes(existing.status)
      ) {
        intent = existing;
      }
    } catch {
      // fall through to create a fresh intent
    }
  }

  if (!intent) {
    intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        userId: booking.user.toString(),
      },
    });

    await Payment.create({
      booking: booking._id,
      user: booking.user,
      amount: booking.totalAmount,
      currency,
      provider: 'stripe',
      paymentIntentId: intent.id,
      status: 'requires_payment',
      metadata: { bookingReference: booking.bookingReference },
    });

    booking.paymentReference = intent.id;
    await booking.save();
  }

  return created(
    res,
    {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: booking.totalAmount,
      currency,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      reservationExpiresAt: booking.reservationExpiresAt,
    },
    'Payment intent created'
  );
});

/**
 * Frontend calls this after Stripe.js reports success. We re-verify with
 * Stripe — the client's "success" is never trusted on its own. Idempotent
 * with the webhook.
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw ApiError.badRequest('Stripe is not configured on the server');
  }

  const { paymentIntentId } = req.body;
  if (!paymentIntentId) throw ApiError.badRequest('paymentIntentId required');

  const payment = await Payment.findOne({ paymentIntentId }).populate('booking');
  if (!payment) throw ApiError.notFound('Payment not found');

  const ownerId = (payment.booking?.user || payment.user)?.toString();
  if (ownerId !== req.user._id.toString() && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden();
  }

  const result = await confirmBookingFromPaymentIntent(paymentIntentId);

  if (result.alreadyConfirmed) {
    return ok(
      res,
      { confirmed: true, booking: result.booking, payment: result.payment },
      'Booking already confirmed'
    );
  }

  if (result.status && result.status !== 'succeeded') {
    // Not an error — payment may still be processing.
    return ok(
      res,
      { confirmed: false, status: result.status },
      `Payment is not complete yet (status: ${result.status})`
    );
  }

  return ok(
    res,
    { confirmed: true, booking: result.booking, payment: result.payment },
    'Payment verified — booking confirmed'
  );
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;

  const payment = await Payment.findOne({ paymentIntentId });
  if (!payment) throw ApiError.notFound('Payment not found');

  if (
    payment.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'ADMIN'
  ) {
    throw ApiError.forbidden();
  }

  return ok(res, {
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
  });
});

/**
 * Stripe webhook. Raw body already parsed by app.js.
 * Always respond 200 quickly; log and swallow logic errors so Stripe does
 * not retry forever.
 */
export const stripeWebhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — ignoring');
    return res.json({ received: true, skipped: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        await confirmBookingFromPaymentIntent(intent.id, event);
        break;
      }
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const intent = event.data.object;
        const payment = await Payment.findOne({ paymentIntentId: intent.id });
        if (payment && payment.status !== 'succeeded') {
          payment.status =
            event.type === 'payment_intent.canceled' ? 'cancelled' : 'failed';
          payment.rawEvent = event;
          await payment.save();
        }
        break;
      }
      default:
        // Not subscribed / not interesting.
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err.message);
  }

  return res.json({ received: true });
};