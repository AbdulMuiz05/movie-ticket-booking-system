import cron from 'node-cron';
import { releaseExpiredReservations } from '../services/booking.service.js';

let scheduled = false;

const releaseTick = async () => {
  try {
    const result = await releaseExpiredReservations();

    if (result.showsTouched || result.bookingsExpired) {
      console.log(
        `[jobs] released expired reservations → shows:${result.showsTouched} bookings:${result.bookingsExpired}`
      );
    }
  } catch (err) {
    console.error(
      '[jobs] release job failed:',
      err.message
    );
  }
};

export const startJobs = () => {
  if (scheduled) return;

  scheduled = true;

  cron.schedule(
    '* * * * *',
    releaseTick,
    { timezone: 'UTC' }
  );

  releaseTick();

  console.log(
    '[jobs] expiration sweep scheduled (every minute)'
  );
};