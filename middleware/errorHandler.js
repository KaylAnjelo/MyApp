/**
 * Global error handling middleware
 * This should be the last middleware in your app
 */

const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return sendError(res, 'Validation Error', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return sendError(res, 'Resource already exists', 409);
      case '23503': // Foreign key violation
        return sendError(res, 'Invalid reference', 400);
      case '23502': // Not null violation
        return sendError(res, 'Missing required field', 400);
      default:
        console.error('Supabase error:', err);
        return sendError(res, 'Database error', 500);
    }
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
};

module.exports = errorHandler;