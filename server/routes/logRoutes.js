/**
 * @fileoverview Audit-log routes — HOD-only access to mutation history.
 */

import { Router } from 'express';
import { getLogs } from '../controllers/logController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

const router = Router();

/**
 * GET /api/logs
 * Paginated audit logs (HOD only).
 */
router.get('/', auth, authorize('HOD'), getLogs);

export default router;
