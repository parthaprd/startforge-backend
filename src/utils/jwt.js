// Re-export from config/auth for backwards compatibility
const { signToken, verifyToken } = require('../config/auth');
module.exports = { signToken, verifyToken };
