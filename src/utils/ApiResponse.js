class ApiResponse {
  static send(res, statusCode, message, data = null, meta = {}) {
    const body = {
      success: true,
      message,
    };

    if (data !== null && data !== undefined) {
      body.data = data;
    }

    return res.status(statusCode).json({ ...body, ...meta });
  }

  static ok(res, message = 'Success', data = null, meta = {}) {
    return ApiResponse.send(res, 200, message, data, meta);
  }

  static created(res, message = 'Created successfully', data = null, meta = {}) {
    return ApiResponse.send(res, 201, message, data, meta);
  }

  static paginated(res, message, data, pagination) {
    return ApiResponse.send(res, 200, message, data, { pagination });
  }

  static noContent(res) {
    return res.status(204).end();
  }
}

module.exports = ApiResponse;
