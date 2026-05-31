/**
 * @fileoverview Authentication routes.
 */

import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateLogin, handleValidationErrors } from '../middleware/validate.js';

const router = Router();

/**
 * POST /api/auth/login
 * Rate-limited login with input validation.
 */
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
router.get('/me', auth, getMe);

export default router;
