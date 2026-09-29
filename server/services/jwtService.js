const jwt = require("jsonwebtoken");

/**
 * Signs a new JWT for the given user id.
 * @param {string} userId
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws jsonwebtoken errors (TokenExpiredError, JsonWebTokenError, etc.)
 * which the caller is expected to handle.
 * @param {string} token
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
