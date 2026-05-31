/**
 * @fileoverview Authentication controller.
 * Handles user login (JWT issuance) and the "get current user" endpoint.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/env.js';

/**
 * POST /api/auth/login
 * Authenticate a user with email + password and return a JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user WITH the password field (select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ── Build JWT payload ────────────────────────────────────────────
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      name: user.name,
    };

    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRY,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Return the profile of the currently authenticated user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
