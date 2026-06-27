/**
 * CORS configuration — permissive (all origins allowed).
 */

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;
