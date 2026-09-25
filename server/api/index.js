import app from '../app.js';
import { connectDB } from '../config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
  console.error('[Vercel MongoDB error]', err);
  res.status(500).json({
    success: false,
    message: 'Server bootstrap failed',
    error: err.message,
    name: err.name,
    reason: err.reason?.message,
    code: err.code,
  });
}
}
