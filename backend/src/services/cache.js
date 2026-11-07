const redis = require('../config/redis');

// Cache settings.
// TTL (time to live) = how many seconds a cached entry stays valid in Redis.
// After the TTL expires Redis deletes the key automatically, so the next
// request becomes a cache MISS and the data is read from MongoDB again.
const CACHE_TTL_SECONDS = 60;
const LIST_KEY_PREFIX = 'tasks:list';
const TASK_KEY_PREFIX = 'task';

// Every list query gets its own key, so page/limit/status combinations
// can never return each other's cached results.
// Example: tasks:list:page=1:limit=10:status=Pending
function buildListKey(page, limit, status) {
  return `${LIST_KEY_PREFIX}:page=${page}:limit=${limit}:status=${status || 'all'}`;
}

function buildTaskKey(taskId) {
  return `${TASK_KEY_PREFIX}:${taskId}`;
}

// Read from cache. Returns the parsed value, or null on miss or Redis failure.
// A Redis outage is logged and treated as a cache miss — MongoDB still answers.
async function get(key) {
  try {
    const raw = await redis.get(key);
    if (raw === null) {
      console.log(`[Cache] MISS ${key}`);
      return null;
    }
    console.log(`[Cache] HIT  ${key}`);
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Cache] GET failed (${key}): ${err.message} — falling back to MongoDB`);
    return null;
  }
}

// Write to cache. Failures are logged and ignored: the response is already
// correct, it just will not be cached this time.
async function set(key, value) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn(`[Cache] SET failed (${key}): ${err.message} — response was not cached`);
  }
}

// Delete one exact key (used for individual task entries).
async function del(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[Cache] DEL failed (${key}): ${err.message}`);
  }
}

// Delete EVERY cached task list (all pages, limits and status filters).
// Called after create/update/delete because any of those can change any page
// of the list (e.g. a new task shifts page 1, a deletion shifts page 2).
//
// Note: KEYS scans the whole keyspace. That is fine for this small project;
// a large production system would use SCAN instead.
async function invalidateTaskLists() {
  try {
    const keys = await redis.keys(`${LIST_KEY_PREFIX}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`[Cache] invalidated ${keys.length} task list key(s)`);
    }
  } catch (err) {
    console.warn(`[Cache] list invalidation failed: ${err.message}`);
  }
}

module.exports = {
  CACHE_TTL_SECONDS,
  buildListKey,
  buildTaskKey,
  get,
  set,
  del,
  invalidateTaskLists,
};
