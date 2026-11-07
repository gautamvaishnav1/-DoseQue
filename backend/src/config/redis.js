const Redis = require('ioredis');

// Create one shared Redis client.
//
// Resilience options:
// - enableOfflineQueue: false  -> if Redis is down, commands fail immediately
//   instead of being queued forever (requests must not hang).
// - maxRetriesPerRequest: 1    -> give up on a command quickly.
// - retryStrategy             -> keep trying to reconnect in the background,
//   so caching turns back on automatically when Redis returns.
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

// Log each distinct error only once so a Redis outage does not flood the logs.
const loggedErrors = new Set();
redis.on('error', (err) => {
  if (!loggedErrors.has(err.message)) {
    loggedErrors.add(err.message);
    console.warn(`[Redis] ${err.message} — API continues without cache until Redis is back`);
  }
});

redis.on('ready', () => {
  loggedErrors.clear();
  console.log('[Redis] connected');
});

module.exports = redis;
