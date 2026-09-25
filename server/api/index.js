import app from '../app.js';
import { connectDB } from '../config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
  const servers = [...(err.reason?.servers ?? [])].map(([host, server]) => ({
    host,
    type: server.type,
    error: server.error?.message,
    code: server.error?.code,
  }));

  console.error('[Vercel MongoDB error]', err);
  console.error('[MongoDB server details]', servers);

  res.status(500).json({
    success: false,
    message: 'Server bootstrap failed',
    error: err.message,
    name: err.name,
    reason: err.reason?.message,
    code: err.code,
    servers,
  });
}
}
