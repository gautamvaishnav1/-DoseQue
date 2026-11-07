// Centralized error handler. Every error passed to next() ends up here,
// so the API always returns the same JSON shape:
//   { success: false, message, errors? }
//
// It understands:
// - errors with a statusCode (validation errors, 404, ...)
// - Mongoose CastError        -> invalid MongoDB ObjectId (400)
// - Mongoose ValidationError  -> failed schema rules (400)
// - MongoDB duplicate key 1100 -> (409)
// - anything else             -> 500 without leaking internal details
function errorHandler(err, req, res, next) {
  // Mongoose CastError: e.g. GET /api/tasks/123
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for '${err.path}': ${err.value}`,
    });
  }

  // Mongoose schema validation (defence in depth; express-validator usually
  // catches bad input before it reaches the model).
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // MongoDB duplicate key error.
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value for a unique field',
    });
  }

  const statusCode = err.statusCode || 500;

  // Never expose internal error details to the client in production.
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (statusCode === 500) {
    console.error('[Error]', err);
  }

  const body = { success: false, message };
  if (err.errors) {
    body.errors = err.errors;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
