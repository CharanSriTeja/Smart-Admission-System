/**
 * @fileoverview Admin routes for system initialization and volunteer management.
 */

import { Router } from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

const router = Router();

// ── Routes (Protected by Auth and Admin Authorization) ────────────────────────

/**
 * POST /api/admin/users
 * Add a new user (HOD or Volunteer).
 */
router.post('/users', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.',
      });
    }

    // Validate role
    if (!['HOD', 'Volunteer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either HOD or Volunteer.',
      });
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Create user (pre-save hook hashes password)
    const newUser = await User.create({
      name: name || email.split('@')[0],
      email,
      password,
      role,
      department: department || 'CSE',
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get list of all registered HOD and Volunteer users.
 */
router.get('/users', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ['HOD', 'Volunteer'] } })
      .select('name email role department createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (HOD or Volunteer).
 */
router.delete('/users/:id', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findOneAndDelete({
      _id: userId,
      role: { $in: ['HOD', 'Volunteer'] },
    });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account access revoked successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
