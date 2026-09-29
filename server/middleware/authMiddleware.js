const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require("../services/jwtService");
const { sendError } = require("../utils/response");

/**
 * Protects a route by requiring a valid JWT in the Authorization header.
 * On success, attaches the authenticated user's document (without the
 * password) to req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Not authorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "Not authorized. Malformed authorization header.");
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, "Not authorized. User for this token no longer exists.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 401, "Session expired. Please log in again.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 401, "Not authorized. Invalid token.");
    }
    return sendError(res, 401, "Not authorized. Token verification failed.");
  }
};

module.exports = { protect };
