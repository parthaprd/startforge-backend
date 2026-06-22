const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((e) => ({
    field: e.path || e.param || e.location,
    message: e.msg,
    value: e.value,
  }));

  return next(
    new ApiError(400, 'Validation failed. Please check your input.', errors)
  );
};

module.exports = { validateRequest };
