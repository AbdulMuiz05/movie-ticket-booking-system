import { releaseExpiredReservations } from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Sweep endpoint for platforms (Vercel Cron, external schedulers) that cannot
 * run a long-lived cron. Protected by a shared secret header so it can be
 * triggered from the platform config without exposing it publicly.
 */
export const sweep = asyncHandler(async (req, res) => {
  const expected = process.env.JOBS_SECRET;
  if (expected) {
    const provided =
      req.headers['x-jobs-secret'] ||
      req.query.secret ||
      req.headers.authorization?.replace('Bearer ', '');
    if (provided !== expected) throw ApiError.unauthorized('Invalid jobs secret');
  }

  const result = await releaseExpiredReservations();
  return ok(res, result, 'Sweep completed');
});