/**
 * @fileoverview Dashboard routes — HOD-only aggregate endpoints.
 */

import { Router } from 'express';
import { getStats, getDepartmentProgress } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Overall admission statistics (HOD only).
 */
router.get('/stats', auth, authorize('HOD'), getStats);

/**
 * GET /api/dashboard/department-progress
 * Per-department completion breakdown (HOD only).
 */
router.get('/department-progress', auth, authorize('HOD'), getDepartmentProgress);

export default router;
