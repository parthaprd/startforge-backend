class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

ApiError.badRequest = (message = 'Bad request', errors = []) =>
  new ApiError(400, message, errors);

ApiError.unauthorized = (message = 'Authentication required.') =>
  new ApiError(401, message);

ApiError.forbidden = (message = 'You do not have permission to perform this action.') =>
  new ApiError(403, message);

ApiError.notFound = (message = 'Resource not found.') =>
  new ApiError(404, message);

ApiError.conflict = (message = 'Resource already exists.') =>
  new ApiError(409, message);

ApiError.internal = (message = 'Something went wrong.') =>
  new ApiError(500, message);

module.exports = ApiError;
