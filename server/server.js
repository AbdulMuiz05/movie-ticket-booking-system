import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startJobs } from './jobs/index.js';

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();
  startJobs();

  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
};

bootstrap().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});