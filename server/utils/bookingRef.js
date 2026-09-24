import crypto from 'crypto';

export const makeBookingReference = () =>
  `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;