import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { getStripe } from './stripe.service.js';
import { releaseSeatsForBooking } from './booking.service.js';

export const refundBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.paymentStatus !== 'paid') {
    throw new Error('Booking has not been paid');
  }

  if (booking.paymentStatus === 'refunded') {
    return booking;
  }

  const payment = await Payment.findOne({
    booking: booking._id,
    status: 'succeeded',
  }).sort({ createdAt: -1 });

  if (!payment) {
    throw new Error('Successful payment not found for booking');
  }

  const stripe = getStripe();

  const refund = await stripe.refunds.create({
    payment_intent: payment.paymentIntentId,
  });

  payment.status = 'refunded';
  payment.rawEvent = {
    type: 'refund.created',
    refundId: refund.id,
    status: refund.status,
  };

  await payment.save();

  booking.paymentStatus = 'refunded';
  booking.bookingStatus = 'cancelled';
  booking.refundId = refund.id;
  booking.refundedAt = new Date();
  booking.cancelledAt = new Date();

  await booking.save();

  await releaseSeatsForBooking(booking._id);

  return booking;
};