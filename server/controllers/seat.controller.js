import { Seat } from '../models/Seat.js';
import { Screen } from '../models/Screen.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const listSeatsByScreen = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const screen = await Screen.findById(screenId);
  if (!screen) throw ApiError.notFound('Screen not found');

  const seats = await Seat.find({ screen: screenId }).sort({ row: 1, column: 1 });
  return ok(res, { screen, seats });
});

export const createSeat = asyncHandler(async (req, res) => {
  const { screen, seatNumber, row, column, seatType, priceMultiplier, status } = req.body;

  const screenDoc = await Screen.findById(screen);
  if (!screenDoc) throw ApiError.notFound('Screen not found');

  const existing = await Seat.findOne({ screen, seatNumber });
  if (existing) throw ApiError.conflict(`Seat ${seatNumber} already exists on this screen`);

  const seat = await Seat.create({
    screen,
    seatNumber,
    row,
    column,
    seatType,
    priceMultiplier,
    status,
  });

  return created(res, { seat }, 'Seat created');
});

export const updateSeat = asyncHandler(async (req, res) => {
  const { seatType, priceMultiplier, status } = req.body;
  const payload = {};
  if (seatType !== undefined) payload.seatType = seatType;
  if (priceMultiplier !== undefined) payload.priceMultiplier = priceMultiplier;
  if (status !== undefined) payload.status = status;

  const seat = await Seat.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!seat) throw ApiError.notFound('Seat not found');
  return ok(res, { seat }, 'Seat updated');
});

export const deleteSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findByIdAndDelete(req.params.id);
  if (!seat) throw ApiError.notFound('Seat not found');
  return ok(res, null, 'Seat deleted');
});