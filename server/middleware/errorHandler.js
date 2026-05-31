/**
 * @fileoverview Global error-handling middleware.
 * Catches all errors thrown or passed via next(err) and returns a
 * consistent JSON envelope.  In development mode the stack trace is
 * included for debugging.
 */

import config from '../config/env.js';

/**
 * Centralised error handler — must have four parameters so Express
 * recognises it as an error-handling middleware.
 *
 * @param {Error}  err  - The error object.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose validation error (e.g. required field missing) ────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = `Validation Error: ${messages.join(', ')}`;
  }

  // ── Mongoose duplicate key error ──────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field(s): ${field}. Please use a different value.`;
  }

  // ── Mongoose bad ObjectId ─────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT errors (fallback — normally caught in auth middleware) ─────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Log the full error in development
  if (config.NODE_ENV === 'development') {
    console.error('🔥 Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
