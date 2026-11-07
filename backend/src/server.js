// Server entry point: loads environment variables, connects to the
// databases, then starts listening. app.js only builds the Express app,
// which keeps the app testable and the startup logic in one place.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const redis = require('./config/redis');

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doseque';

async function start() {
  // MongoDB is required — without it the API cannot work, so exit clearly.
  await connectDB(MONGODB_URI);

  // Redis is optional — check it once for a friendly log line, but keep
  // running even if it is down (cache.js falls back to MongoDB reads).
  try {
    await redis.ping();
    console.log('[Redis] connected');
  } catch (err) {
    console.warn(
      `[Redis] not available at startup (${err.message}) — API will run without caching`
    );
  }

  app.listen(PORT, () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
    console.log(`[Server] environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[Server] failed to start:', err);
  process.exit(1);
});
