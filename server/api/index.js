import app from '../app.js';
import { connectDB } from '../config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server bootstrap failed', error: err.message });
  }
}