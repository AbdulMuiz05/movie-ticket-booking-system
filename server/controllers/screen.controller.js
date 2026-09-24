import mongoose from 'mongoose';
import { Screen } from '../models/Screen.js';
import { Cinema } from '../models/Cinema.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

const ALLOWED_FIELDS = [
  'name', 'screenNumber', 'screenType', 'rows', 'columns',
  'seatConfiguration', 'active',
];

const pickFields = (body) => {
  const out = {};
  for (const k of ALLOWED_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
};

// Row label helper: 0 -> A, 25 -> Z, 26 -> AA, ...
const rowLabel = (idx) => {
  let n = idx;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
};

const generateSeatsForScreen = async (screen) => {
  const rows = screen.rows;
  const cols = screen.columns;

  // Build a per-row seat type lookup from seatConfiguration
  const cfg = new Map();
  for (const c of screen.seatConfiguration || []) {
    cfg.set(c.row.toUpperCase(), {
      seatType: c.seatType || 'REGULAR',
      priceMultiplier: c.priceMultiplier ?? 1,
    });
  }

  const docs = [];
  for (let r = 0; r < rows; r++) {
    const label = rowLabel(r);
    const rowCfg = cfg.get(label) || { seatType: 'REGULAR', priceMultiplier: 1 };
    for (let c = 1; c <= cols; c++) {
      docs.push({
        screen: screen._id,
        seatNumber: `${label}${c}`,
        row: label,
        column: c,
        seatType: rowCfg.seatType,
        priceMultiplier: rowCfg.priceMultiplier,
        status: 'ACTIVE',
      });
    }
  }
  if (docs.length) await Seat.insertMany(docs);
};

export const listScreensByCinema = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  if (!mongoose.isValidObjectId(cinemaId)) throw ApiError.badRequest('Invalid cinema id');

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) throw ApiError.notFound('Cinema not found');

  const screens = await Screen.find({ cinema: cinemaId }).sort({ screenNumber: 1 });
  return ok(res, { cinema, screens });
});

export const getScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id).populate('cinema');
  if (!screen) throw ApiError.notFound('Screen not found');
  const seats = await Seat.find({ screen: screen._id }).sort({ row: 1, column: 1 });
  return ok(res, { screen, seats });
});

export const createScreen = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  if (!mongoose.isValidObjectId(cinemaId)) throw ApiError.badRequest('Invalid cinema id');

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema || !cinema.active) throw ApiError.notFound('Cinema not found or inactive');

  const payload = pickFields(req.body);
  const capacity = (payload.rows || 1) * (payload.columns || 1);

  const screen = await Screen.create({
    ...payload,
    cinema: cinema._id,
    capacity,
  });

  await generateSeatsForScreen(screen);

  return created(res, { screen }, 'Screen created with seats');
});

export const updateScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id);
  if (!screen) throw ApiError.notFound('Screen not found');

  const payload = pickFields(req.body);

  if (payload.rows !== undefined || payload.columns !== undefined) {
    const existingSeats = await Seat.countDocuments({ screen: screen._id });
    if (existingSeats > 0) {
      throw ApiError.conflict(
        'Cannot change rows/columns after seats have been generated. Delete and recreate the screen.'
      );
    }
  }

  Object.assign(screen, payload);
  if (payload.rows || payload.columns) {
    screen.capacity = screen.rows * screen.columns;
  }
  await screen.save();

  return ok(res, { screen }, 'Screen updated');
});

export const deleteScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id);
  if (!screen) throw ApiError.notFound('Screen not found');

  const futureShows = await Show.countDocuments({
    screen: screen._id,
    startTime: { $gt: new Date() },
    status: 'SCHEDULED',
  });
  if (futureShows > 0) {
    throw ApiError.conflict(
      `Cannot deactivate: ${futureShows} future show(s) on this screen.`
    );
  }

  screen.active = false;
  await screen.save();
  return ok(res, null, 'Screen deactivated');
});

export const hardDeleteScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id);
  if (!screen) throw ApiError.notFound('Screen not found');

  const showCount = await Show.countDocuments({ screen: screen._id });
  if (showCount > 0) {
    throw ApiError.conflict(`Cannot delete: ${showCount} show(s) exist on this screen.`);
  }

  await Seat.deleteMany({ screen: screen._id });
  await Screen.findByIdAndDelete(screen._id);
  return ok(res, null, 'Screen permanently deleted');
});

export const regenerateSeats = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.id);
  if (!screen) throw ApiError.notFound('Screen not found');

  const futureShows = await Show.countDocuments({
    screen: screen._id,
    startTime: { $gt: new Date() },
  });
  if (futureShows > 0) {
    throw ApiError.conflict(
      'Cannot regenerate seats while future shows exist on this screen.'
    );
  }

  await Seat.deleteMany({ screen: screen._id });
  await generateSeatsForScreen(screen);

  const seats = await Seat.find({ screen: screen._id }).sort({ row: 1, column: 1 });
  return ok(res, { seats }, 'Seats regenerated');
});