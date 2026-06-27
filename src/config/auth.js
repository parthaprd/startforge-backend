/**
 * JWT Auth helpers.
 *
 * Simple, stateless JWT authentication. No third-party auth libraries.
 * The token is signed with JWT_SECRET and contains { id, email, role }.
 * Clients store it in localStorage and send it as: Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');

const getSecret = () => {
  const s = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in environment variables.');
  return s;
};

const signToken = (payload) => {
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign(payload, getSecret(), { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = { signToken, verifyToken };
