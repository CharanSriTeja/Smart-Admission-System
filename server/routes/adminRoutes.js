/**
 * @fileoverview Admin routes for system initialization and volunteer management.
 */

import { Router } from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
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

/**
 * DELETE /api/admin/students/clear
 * Clear all student data and logs. Requires password verification and Admin authorization.
 */
router.delete('/students/clear', auth, authorize('Admin'), async (req, res, next) => {
  try {
    const { password, scope, date, startTime, endTime } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to verify this action.',
      });
    }

    // Fetch current user with password selected
    const adminUser = await User.findById(req.user.id).select('+password');
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    // Verify password
    const isMatch = await adminUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Verification failed.',
      });
    }

    let studentDeleteResult;
    let auditDeleteResult;
    let successMessage;

    if (scope === 'date') {
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required for date-scoped reset.',
        });
      }
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format provided.',
        });
      }

      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const query = { createdAt: { $gte: startOfDay, $lte: endOfDay } };

      const studentsToDelete = await Student.find(query).select('_id');
      const studentIds = studentsToDelete.map(s => s._id);

      studentDeleteResult = await Student.deleteMany({ _id: { $in: studentIds } });
      auditDeleteResult = await AuditLog.deleteMany({ studentId: { $in: studentIds } });
      
      const formattedDate = parsedDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      successMessage = `Student records and audit logs for ${formattedDate} have been successfully cleared.`;
    } else if (scope === 'time') {
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time and end time are required for time-scoped reset.',
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start or end time format provided.',
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be before end time.',
        });
      }

      const query = { createdAt: { $gte: start, $lte: end } };

      const studentsToDelete = await Student.find(query).select('_id');
      const studentIds = studentsToDelete.map(s => s._id);

      studentDeleteResult = await Student.deleteMany({ _id: { $in: studentIds } });
      auditDeleteResult = await AuditLog.deleteMany({ studentId: { $in: studentIds } });

      const formatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      const formattedStart = start.toLocaleString('en-IN', formatOptions);
      const formattedEnd = end.toLocaleString('en-IN', formatOptions);

      successMessage = `Student records and audit logs from ${formattedStart} to ${formattedEnd} have been successfully cleared.`;
    } else {
      // Clear all students and audit logs (default to scope 'all')
      studentDeleteResult = await Student.deleteMany({});
      auditDeleteResult = await AuditLog.deleteMany({});
      successMessage = 'All student admission records and audit logs have been successfully cleared.';
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      deletedStudentsCount: studentDeleteResult ? studentDeleteResult.deletedCount : 0,
      deletedAuditLogsCount: auditDeleteResult ? auditDeleteResult.deletedCount : 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
