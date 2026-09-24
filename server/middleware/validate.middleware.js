import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const runValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  const err = ApiError.unprocessable('Validation failed', errors);
  next(err);
};