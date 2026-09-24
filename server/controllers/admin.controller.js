import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();

  const [
    totalUsers,
    totalMovies,
    totalCinemas,
    totalScreens,
    totalShows,
    upcomingShows,
    totalBookings,
    confirmedBookings,
    pendingBookings,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments({ active: true }),
    Movie.countDocuments({ active: true }),
    Cinema.countDocuments({ active: true }),
    Screen.countDocuments({ active: true }),
    Show.countDocuments({}),
    Show.countDocuments({ status: 'SCHEDULED', endTime: { $gt: now } }),
    Booking.countDocuments({}),
    Booking.countDocuments({ bookingStatus: 'confirmed' }),
    Booking.countDocuments({ bookingStatus: 'pending' }),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  return ok(res, {
    stats: {
      totalUsers,
      totalMovies,
      totalCinemas,
      totalScreens,
      totalShows,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      revenue: Math.round(revenue * 100) / 100,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, q, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments(filter),
  ]);

  return ok(res, {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['USER', 'ADMIN'].includes(role)) throw ApiError.badRequest('Invalid role');

  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw ApiError.notFound('User not found');

  if (user._id.toString() === req.user._id.toString() && role !== 'ADMIN') {
    throw ApiError.badRequest('You cannot demote yourself');
  }

  user.role = role;
  await user.save();
  return ok(res, { user: user.toSafeJSON() }, `Role updated to ${role}`);
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { active } = req.body;
  if (typeof active !== 'boolean') throw ApiError.badRequest('active must be boolean');

  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw ApiError.notFound('User not found');

  if (user._id.toString() === req.user._id.toString() && active === false) {
    throw ApiError.badRequest('You cannot deactivate yourself');
  }

  user.active = active;
  await user.save();
  return ok(res, { user: user.toSafeJSON() }, active ? 'User activated' : 'User deactivated');
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (status) filter.bookingStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('movie', 'title poster')
      .populate('cinema', 'name city')
      .populate('screen', 'name screenNumber')
      .populate('show', 'date startTime endTime ticketPrice'),
    Booking.countDocuments(filter),
  ]);

  return ok(res, {
    bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listAllShows = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [shows, total] = await Promise.all([
    Show.find(filter)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('movie', 'title poster duration')
      .populate('cinema', 'name city')
      .populate('screen', 'name screenNumber screenType'),
    Show.countDocuments(filter),
  ]);

  return ok(res, {
    shows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        select: 'bookingReference bookingStatus paymentStatus totalAmount',
      }),
    Payment.countDocuments(filter),
  ]);

  return ok(res, {
    payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});