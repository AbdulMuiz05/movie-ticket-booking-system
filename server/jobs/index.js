import cron from 'node-cron';
import { Booking } from '../models/Booking.js';
import { releaseExpiredReservations } from '../services/booking.service.js';
import { sendBookingReminderEmail } from '../services/email.service.js';

let scheduled = false;

const releaseTick = async () => {
  try {
    const result = await releaseExpiredReservations();
    if (result.showsTouched || result.bookingsExpired) {
      console.log(`[jobs] released expired reservations → shows:${result.showsTouched} bookings:${result.bookingsExpired}`);
    }
  } catch (err) {
    console.error('[jobs] release job failed:', err.message);
  }
};

const reminderTick = async () => {
  const now = new Date();
  const lower = new Date(now.getTime() + 7.5 * 60 * 60 * 1000);
  const upper = new Date(now.getTime() + 8.5 * 60 * 60 * 1000);
  const bookings = await Booking.find({
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    reminderEmailSentAt: null,
  })
    .populate('user', 'name email')
    .populate('movie', 'title')
    .populate('cinema', 'name')
    .populate('show', 'startTime');

  for (const booking of bookings) {
    const startTime = booking.show?.startTime ? new Date(booking.show.startTime) : null;
    if (!startTime || startTime < lower || startTime > upper) continue;
    try {
      await sendBookingReminderEmail(booking);
      await Booking.updateOne({ _id: booking._id, reminderEmailSentAt: null }, { $set: { reminderEmailSentAt: new Date() } });
    } catch (err) {
      console.error('[jobs] reminder email failed:', booking.bookingReference, err.message);
    }
  }
};

export const startJobs = () => {
  if (scheduled) return;
  scheduled = true;
  cron.schedule('* * * * *', releaseTick, { timezone: 'UTC' });
  cron.schedule('*/5 * * * *', () => reminderTick().catch((err) => console.error('[jobs] reminder sweep failed:', err.message)), { timezone: 'UTC' });
  releaseTick();
  console.log('[jobs] expiration sweep scheduled (every minute)');
  console.log('[jobs] reminder email sweep scheduled (every five minutes)');
};
