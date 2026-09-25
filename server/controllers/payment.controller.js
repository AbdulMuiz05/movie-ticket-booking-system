import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Show } from '../models/Show.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { sendBookingConfirmationEmail } from '../services/email.service.js';
import { refundBookingById } from '../services/refund.service.js';
import { releaseSeatsForBooking } from '../services/booking.service.js';
import {
  getStripe,
  isStripeConfigured,
  getCurrency,
} from '../services/stripe.service.js';

const BOOKING_POPULATE = [
  {
    path: 'cinema',
    select: 'name city address',
  },
  {
    path: 'screen',
    select: 'name screenNumber screenType',
  },
  {
    path: 'show',
    select: 'date startTime endTime ticketPrice status',
  },
];

const confirmBookingFromPaymentIntent = async (
  paymentIntentId,
  rawEvent = null
) => {
  const payment = await Payment.findOne({
    paymentIntentId,
  }).populate('booking');

  if (!payment) {
    throw new Error(
      `Payment record not found for intent ${paymentIntentId}`
    );
  }

  if (
    payment.status === 'succeeded' &&
    payment.booking?.bookingStatus === 'confirmed'
  ) {
    await payment.booking.populate(BOOKING_POPULATE);

    return {
      alreadyConfirmed: true,
      payment,
      booking: payment.booking,
    };
  }

  const stripe = getStripe();

  const intent = await stripe.paymentIntents.retrieve(
    paymentIntentId
  );

  if (intent.status !== 'succeeded') {
    payment.status =
      intent.status === 'canceled'
        ? 'cancelled'
        : intent.status === 'processing'
          ? 'processing'
          : 'failed';

    payment.rawEvent =
      rawEvent || payment.rawEvent || null;

    await payment.save();

    return {
      alreadyConfirmed: false,
      status: intent.status,
      payment,
    };
  }

  const bookingId =
    payment.booking?._id || payment.booking;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error('Booking not found for payment');
  }

  const now = new Date();

  if (
    booking.bookingStatus !== 'pending' ||
    booking.paymentStatus !== 'pending' ||
    !booking.reservationExpiresAt ||
    booking.reservationExpiresAt <= now
  ) {
    payment.status = 'succeeded';
    payment.rawEvent =
      rawEvent || payment.rawEvent || null;

    await payment.save();

    if (booking.bookingStatus === 'pending') {
      booking.bookingStatus = 'expired';
      booking.paymentStatus = 'failed';
      await booking.save();
    }

    try {
      await refundBookingById(booking._id, {
        allowFailedPayment: true,
      });

      payment.status = 'refunded';
      await payment.save();
    } catch (refundError) {
      payment.metadata = {
        ...(payment.metadata || {}),
        refundRequired: true,
        refundError: refundError.message,
      };

      await payment.save();
    }

    return {
      alreadyConfirmed: false,
      status: 'booking_expired',
      payment,
      booking,
    };
  }

  const seatNumbers = booking.seats;

  const seatConditions = seatNumbers.map(
    (seatNumber) => ({
      occupiedSeats: {
        $elemMatch: {
          booking: booking._id,
          seatNumber,
          status: 'reserved',
          expiresAt: { $gt: now },
        },
      },
    })
  );

  const seatUpdate = await Show.updateOne(
    {
      _id: booking.show,
      $and: seatConditions,
      'occupiedSeats.booking': booking._id,
    },
    {
      $set: {
        'occupiedSeats.$[seat].status': 'booked',
        'occupiedSeats.$[seat].expiresAt': new Date(
          '9999-12-31T23:59:59.999Z'
        ),
      },
    },
    {
      arrayFilters: [
        {
          'seat.booking': booking._id,
          'seat.seatNumber': { $in: seatNumbers },
          'seat.status': 'reserved',
          'seat.expiresAt': { $gt: now },
        },
      ],
    }
  );

  if (seatUpdate.modifiedCount !== 1) {
    const current = await Booking.findById(
      booking._id
    );

    if (
      current?.bookingStatus === 'confirmed' &&
      current.paymentStatus === 'paid'
    ) {
      await current.populate(BOOKING_POPULATE);

      return {
        alreadyConfirmed: true,
        payment,
        booking: current,
      };
    }

    if (current?.bookingStatus === 'pending') {
      current.bookingStatus = 'expired';
      current.paymentStatus = 'failed';
      await current.save();
    }

    try {
      await refundBookingById(booking._id, {
        allowFailedPayment: true,
      });

      payment.status = 'refunded';
      await payment.save();
    } catch (refundError) {
      payment.metadata = {
        ...(payment.metadata || {}),
        refundRequired: true,
        refundError: refundError.message,
      };

      await payment.save();
    }

    return {
      alreadyConfirmed: false,
      status: 'booking_expired',
      payment,
      booking: current || booking,
    };
  }

  const bookingUpdate = await Booking.updateOne(
    {
      _id: booking._id,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      reservationExpiresAt: { $gt: now },
    },
    {
      $set: {
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        paymentReference: paymentIntentId,
        paidAt: now,
      },
    }
  );

  if (bookingUpdate.modifiedCount !== 1) {
    await Show.updateOne(
      {
        _id: booking.show,
        'occupiedSeats.booking': booking._id,
      },
      {
        $set: {
          'occupiedSeats.$[seat].status': 'reserved',
          'occupiedSeats.$[seat].expiresAt':
            booking.reservationExpiresAt,
        },
      },
      {
        arrayFilters: [
          {
            'seat.booking': booking._id,
            'seat.seatNumber': { $in: seatNumbers },
            'seat.status': 'booked',
          },
        ],
      }
    );

    const current = await Booking.findById(
      booking._id
    );

    if (
      current?.bookingStatus === 'confirmed' &&
      current.paymentStatus === 'paid'
    ) {
      await current.populate(BOOKING_POPULATE);

      return {
        alreadyConfirmed: true,
        payment,
        booking: current,
      };
    }

    try {
      await refundBookingById(booking._id, {
        allowFailedPayment: true,
      });

      payment.status = 'refunded';
      await payment.save();
    } catch (refundError) {
      payment.metadata = {
        ...(payment.metadata || {}),
        refundRequired: true,
        refundError: refundError.message,
      };

      await payment.save();
    }

    return {
      alreadyConfirmed: false,
      status: 'booking_expired',
      payment,
      booking: current || booking,
    };
  }

  payment.status = 'succeeded';
  payment.rawEvent =
    rawEvent || payment.rawEvent || null;

  await payment.save();

  const confirmedBooking =
    await Booking.findById(booking._id).populate(
      BOOKING_POPULATE
    );

  if (
    confirmedBooking &&
    !confirmedBooking.confirmationEmailSentAt
  ) {
    try {
      await sendBookingConfirmationEmail(
        confirmedBooking
      );

      await Booking.updateOne(
        {
          _id: confirmedBooking._id,
          confirmationEmailSentAt: null,
        },
        {
          $set: {
            confirmationEmailSentAt: new Date(),
          },
        }
      );
    } catch (err) {
      console.error(
        '[email] booking confirmation failed:',
        err.message
      );
    }
  }

  return {
    alreadyConfirmed: false,
    payment,
    booking: confirmedBooking,
  };
};

export const createIntent = asyncHandler(
  async (req, res) => {
    if (!isStripeConfigured()) {
      throw ApiError.badRequest(
        'Stripe is not configured on the server'
      );
    }

    const { bookingId } = req.body;

    const booking = await Booking.findById(
      bookingId
    );

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    if (
      booking.user.toString() !==
      req.user._id.toString()
    ) {
      throw ApiError.forbidden();
    }

    if (
      booking.paymentStatus === 'paid' ||
      booking.bookingStatus === 'confirmed'
    ) {
      throw ApiError.badRequest(
        'Booking is already paid'
      );
    }

    if (
      booking.bookingStatus !== 'pending' ||
      booking.paymentStatus !== 'pending'
    ) {
      throw ApiError.badRequest(
        `Cannot pay a booking in state ${booking.bookingStatus}/${booking.paymentStatus}`
      );
    }

    if (
      !booking.reservationExpiresAt ||
      booking.reservationExpiresAt <= new Date()
    ) {
      throw ApiError.conflict(
        'Reservation has expired — please book the seats again'
      );
    }

    const stripe = getStripe();
    const currency = getCurrency();
    const amount = Math.round(
      booking.totalAmount * 100
    );

    let intent = null;

    const existingPayment =
      await Payment.findOne({
        booking: booking._id,
        status: {
          $in: [
            'requires_payment',
            'processing',
          ],
        },
      }).sort({ createdAt: -1 });

    if (existingPayment?.paymentIntentId) {
      try {
        const existing =
          await stripe.paymentIntents.retrieve(
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
      } catch {}
    }

    if (!intent) {
      intent =
        await stripe.paymentIntents.create({
          amount,
          currency,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            bookingId: booking._id.toString(),
            bookingReference:
              booking.bookingReference,
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
        metadata: {
          bookingReference:
            booking.bookingReference,
        },
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
        publishableKey:
          process.env.STRIPE_PUBLISHABLE_KEY ||
          null,
        reservationExpiresAt:
          booking.reservationExpiresAt,
      },
      'Payment intent created'
    );
  }
);

export const confirmPayment = asyncHandler(
  async (req, res) => {
    if (!isStripeConfigured()) {
      throw ApiError.badRequest(
        'Stripe is not configured on the server'
      );
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw ApiError.badRequest(
        'paymentIntentId required'
      );
    }

    const payment = await Payment.findOne({
      paymentIntentId,
    }).populate('booking');

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    const ownerId = (
      payment.booking?.user || payment.user
    )?.toString();

    if (
      ownerId !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden();
    }

    const result =
      await confirmBookingFromPaymentIntent(
        paymentIntentId
      );

    if (result.alreadyConfirmed) {
      return ok(
        res,
        {
          confirmed: true,
          booking: result.booking,
          payment: result.payment,
        },
        'Booking already confirmed'
      );
    }

    if (
      result.status &&
      result.status !== 'succeeded'
    ) {
      return ok(
        res,
        {
          confirmed: false,
          status: result.status,
          booking: result.booking || null,
        },
        `Payment is not complete yet (status: ${result.status})`
      );
    }

    return ok(
      res,
      {
        confirmed: true,
        booking: result.booking,
        payment: result.payment,
      },
      'Payment verified — booking confirmed'
    );
  }
);

export const refundPayment = asyncHandler(
  async (req, res) => {
    if (!isStripeConfigured()) {
      throw ApiError.badRequest(
        'Stripe is not configured on the server'
      );
    }

    const { bookingId } = req.body;

    const booking = await Booking.findById(
      bookingId
    );

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    if (
      booking.user.toString() !==
        req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden();
    }

    const result = await refundBookingById(
      booking._id
    );

    return ok(
      res,
      result,
      'Booking refunded'
    );
  }
);

export const getPaymentStatus = asyncHandler(
  async (req, res) => {
    const { paymentIntentId } = req.params;

    const payment = await Payment.findOne({
      paymentIntentId,
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    if (
      payment.user.toString() !==
        req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden();
    }

    return ok(res, {
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });
  }
);

export const stripeWebhookHandler = async (
  req,
  res
) => {
  const signature =
    req.headers['stripe-signature'];

  const secret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return res.json({
      received: true,
      skipped: true,
    });
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      secret
    );
  } catch (err) {
    return res
      .status(400)
      .send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await confirmBookingFromPaymentIntent(
          event.data.object.id,
          event
        );
        break;

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
        const intent = event.data.object;

        const payment =
          await Payment.findOne({
            paymentIntentId: intent.id,
          });

        if (
          payment &&
          !['succeeded', 'refunded'].includes(
            payment.status
          )
        ) {
          payment.status =
            event.type ===
            'payment_intent.canceled'
              ? 'cancelled'
              : 'failed';

          payment.rawEvent = event;

          await payment.save();
        }

        break;
      }

      case 'refund.updated': {
        const refund = event.data.object;

        if (
          refund.status === 'succeeded' &&
          refund.payment_intent
        ) {
          const payment =
            await Payment.findOne({
              paymentIntentId:
                refund.payment_intent,
            });

          if (payment) {
            payment.status = 'refunded';

            payment.metadata = {
              ...(payment.metadata || {}),
              refundId: refund.id,
              refundStatus: refund.status,
            };

            await payment.save();

            const booking =
              await Booking.findById(
                payment.booking
              );

            if (booking) {
              booking.paymentStatus = 'refunded';

              if (
                booking.bookingStatus !==
                'expired'
              ) {
                booking.bookingStatus =
                  'cancelled';
                booking.cancelledAt =
                  booking.cancelledAt ||
                  new Date();
              }

              booking.refundId = refund.id;
              booking.refundedAt = new Date();

              await booking.save();

              await releaseSeatsForBooking(
                booking._id
              );
            }
          }
        }

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(
      '[stripe-webhook] handler error:',
      err.message
    );
  }

  return res.json({
    received: true,
  });
};