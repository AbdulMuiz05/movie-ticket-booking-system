import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Show } from '../models/Show.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

const ALLOWED_FIELDS = [
  'name', 'description', 'address', 'city', 'state', 'postalCode',
  'country', 'lat', 'lng', 'facilities', 'images', 'active',
];

const pickFields = (body) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
};

export const listCinemas = asyncHandler(async (req, res) => {
  const { city, q, active, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (active !== undefined) filter.active = active;
  else filter.active = true;
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  if (q) filter.name = new RegExp(q, 'i');

  const skip = (page - 1) * limit;
  const [cinemas, total] = await Promise.all([
    Cinema.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Cinema.countDocuments(filter),
  ]);

  return ok(res, {
    cinemas,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listCities = asyncHandler(async (_req, res) => {
  const cities = await Cinema.distinct('city', { active: true });
  return ok(res, { cities: cities.sort() });
});

export const getCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw ApiError.notFound('Cinema not found');
  const screens = await Screen.find({ cinema: cinema._id, active: true });
  return ok(res, { cinema, screens });
});

export const createCinema = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);
  const cinema = await Cinema.create(payload);
  return created(res, { cinema }, 'Cinema created');
});

export const updateCinema = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);
  const cinema = await Cinema.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!cinema) throw ApiError.notFound('Cinema not found');
  return ok(res, { cinema }, 'Cinema updated');
});

export const deleteCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw ApiError.notFound('Cinema not found');

  const futureShows = await Show.countDocuments({
    cinema: cinema._id,
    startTime: { $gt: new Date() },
    status: 'SCHEDULED',
  });
  if (futureShows > 0) {
    throw ApiError.conflict(
      `Cannot deactivate: ${futureShows} future show(s) scheduled at this cinema.`
    );
  }

  cinema.active = false;
  await cinema.save();
  await Screen.updateMany({ cinema: cinema._id }, { $set: { active: false } });
  return ok(res, null, 'Cinema deactivated');
});

export const hardDeleteCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw ApiError.notFound('Cinema not found');

  const showCount = await Show.countDocuments({ cinema: cinema._id });
  if (showCount > 0) {
    throw ApiError.conflict(
      `Cannot delete: ${showCount} show(s) exist at this cinema. Delete them first.`
    );
  }

  await Screen.deleteMany({ cinema: cinema._id });
  await Cinema.findByIdAndDelete(cinema._id);
  return ok(res, null, 'Cinema permanently deleted');
});