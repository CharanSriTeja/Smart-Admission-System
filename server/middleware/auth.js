/**
 * @fileoverview JWT authentication middleware.
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to req.user for downstream handlers.
 */

import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Express middleware that enforces JWT authentication.
 * @param {import('express').Request}  req  - Express request.
 * @param {import('express').Response} res  - Express response.
 * @param {import('express').NextFunction} next - Next middleware.
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authorization header.',
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // { id, email, role, department, name, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authentication failed.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

export default auth;
