const { validationResult } = require('express-validator');

// Runs after the validators declared in the route.
// If any validator failed, it forwards a structured error to the
// centralized error handler; otherwise the request continues to the controller.
function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const err = new Error('Validation failed');
  err.statusCode = 400;
  err.errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(err);
}

module.exports = validate;
