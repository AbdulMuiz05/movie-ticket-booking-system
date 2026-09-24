import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../config/jwt.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

const buildTokens = (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, phone, role: 'USER' });
  const { accessToken, refreshToken } = buildTokens(user);
  setRefreshCookie(res, refreshToken);

  return created(res, { user: user.toSafeJSON(), accessToken }, 'Registered successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.active) throw ApiError.unauthorized('Invalid credentials');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid credentials');

  const { accessToken, refreshToken } = buildTokens(user);
  setRefreshCookie(res, refreshToken);

  return ok(res, { user: user.toSafeJSON(), accessToken }, 'Logged in');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Refresh token invalid or expired');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw ApiError.unauthorized('User no longer active');

  const { accessToken, refreshToken } = buildTokens(user);
  setRefreshCookie(res, refreshToken);

  return ok(res, { user: user.toSafeJSON(), accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: 0 });
  return ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() }, 'Current user');
});