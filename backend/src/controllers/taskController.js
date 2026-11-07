const Task = require('../models/task');
const cache = require('../services/cache');

// Small helper: build a standard "not found" error for the error handler.
function notFoundError() {
  const err = new Error('Task not found');
  err.statusCode = 404;
  return err;
}

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const { title, description, status, priority } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
    });

    // The list has changed (a new task appears on page 1), so every cached
    // list page must be dropped. Individual task keys cannot exist yet for a
    // brand-new id, so only list keys are invalidated here.
    await cache.invalidateTaskLists();

    res.status(201).json({
      success: true,
      message: 'Task created',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks?page=1&limit=10&status=Pending
async function getTasks(req, res, next) {
  try {
    // Query values are already validated by express-validator in the route,
    // so parseInt here only converts the strings to numbers.
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status;

    const cacheKey = cache.buildListKey(page, limit, status);

    // 1) Try Redis first. On a hit we return immediately without touching
    //    MongoDB.
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // 2) Cache miss (or Redis down): query MongoDB.
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    // Run both queries at the same time instead of one after the other.
    // Counting strategy:
    // - status filter: countDocuments uses the { status, createdAt } index
    //   (index-only COUNT_SCAN) and stays exact for the filtered set.
    // - no filter: estimatedDocumentCount reads MongoDB's maintained document
    //   count (O(1), ~2ms) instead of countDocuments({}) which scans the whole
    //   collection (COLLSCAN: ~40ms at 100k docs and it grows with the table).
    const countPromise = status
      ? Task.countDocuments(filter)
      : Task.estimatedDocumentCount();

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      countPromise,
    ]);

    const response = {
      success: true,
      data: tasks,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalTasks / limit),
        totalTasks,
        limit,
      },
    };

    // 3) Store the response in Redis for 60 seconds, then send it.
    await cache.set(cacheKey, response);

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = cache.buildTaskKey(id);

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const task = await Task.findById(id);
    if (!task) {
      return next(notFoundError());
    }

    const response = { success: true, data: task };
    await cache.set(cacheKey, response);

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;

    // { new: true } returns the UPDATED document (not the old one).
    // { runValidators: true } applies schema rules on update as well.
    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return next(notFoundError());
    }

    // Drop the cached single task (it is now stale) and every cached list
    // (this task may appear in any page/filter result).
    await cache.del(cache.buildTaskKey(id));
    await cache.invalidateTaskLists();

    res.status(200).json({
      success: true,
      message: 'Task updated',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return next(notFoundError());
    }

    // Same invalidation rules as update: the single task is gone and every
    // list page may have shifted.
    await cache.del(cache.buildTaskKey(id));
    await cache.invalidateTaskLists();

    res.status(200).json({
      success: true,
      message: 'Task deleted',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
