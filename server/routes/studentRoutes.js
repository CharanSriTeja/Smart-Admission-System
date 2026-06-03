/**
 * @fileoverview Student routes with file-upload support via multer.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStudents,
  getStudentById,
  uploadStudents,
  updateStudentStatus,
  deleteStudent,
} from '../controllers/studentController.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/rbac.js';

// ── Multer configuration ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, 'uploads/');
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter — only allow .xlsx, .csv, .pdf uploads.
 */
const fileFilter = (_req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/pdf',
  ];

  if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .xlsx, .csv, and .pdf files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ── Router ───────────────────────────────────────────────────────────────────
const router = Router();

/**
 * GET /api/students
 * Paginated student list (all authenticated users).
 */
router.get('/', auth, getStudents);

/**
 * GET /api/students/:id
 * Single student detail (all authenticated users).
 */
router.get('/:id', auth, getStudentById);

/**
 * POST /api/students/upload
 * Bulk upload students from file (HOD only).
 */
router.post(
  '/upload',
  auth,
  authorize('HOD'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size limit exceeded. Maximum size allowed is 10MB.',
            });
          }
          return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  uploadStudents
);

/**
 * PUT /api/students/:id/status
 * Update admission-step flags (Volunteer only).
 */
router.put('/:id/status', auth, authorize('Volunteer'), updateStudentStatus);

/**
 * DELETE /api/students/:id
 * Soft-delete a student (HOD only).
 */
router.delete('/:id', auth, authorize('HOD'), deleteStudent);

export default router;
