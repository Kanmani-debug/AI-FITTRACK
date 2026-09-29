const { sendError } = require("../utils/response");
const { GeminiServiceError } = require("../services/geminiService");

/** Handles requests to routes that don't exist. */
const notFound = (req, res, next) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

/**
 * Centralized error handler. Every thrown / next(error) call in the app
 * ends up here. Converts known error types into clean JSON responses and
 * never leaks stack traces or secrets to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Always log the full error server-side for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Gemini-specific errors already carry an appropriate status code
  if (err instanceof GeminiServiceError) {
    return sendError(res, err.statusCode || 502, err.message);
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, "Validation failed.", messages);
  }

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, 409, `A record with that ${field} already exists.`);
  }

  // Mongoose invalid ObjectId cast
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid value for ${err.path}.`);
  }

  // JWT errors (in case they escape the auth middleware)
  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Session expired. Please log in again.");
  }
  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid authentication token.");
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  const message =
    statusCode === 500 ? "Internal server error. Please try again later." : err.message;

  return sendError(res, statusCode, message);
};

module.exports = { notFound, errorHandler };
