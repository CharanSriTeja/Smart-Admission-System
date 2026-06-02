/**
 * @fileoverview Student controller — CRUD and bulk-upload operations.
 */

import fs from "fs";
import Student from "../models/Student.js";
import AuditLog from "../models/AuditLog.js";
import { parseFile } from "../services/fileParser.js";
import {
  emitStudentUpdate,
  emitDashboardRefresh,
  emitNewActivity,
} from "../services/socketService.js";
import { buildSearchQuery } from "../utils/helpers.js";

/**
 * GET /api/students
 * Return a paginated, filterable, searchable list of active students.
 *
 * Query params:
 *   page, limit, department, status (completed|pending|in-progress), query
 */
export const getStudents = async (req, res, next) => {
  try {
    const all = req.query.all === "true";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = all
      ? 0
      : Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = all ? 0 : (page - 1) * limit;

    // ── Base filter: only active students ──────────────────────────
    const filter = { isActive: true };

    // Department filter
    if (req.query.department) {
      filter.department = req.query.department;
    }

    // Optional: Volunteers see only their own department
    if (req.user.role === "Volunteer" && req.query.filterByDept !== "false") {
      filter.department = req.user.department;
    }

    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case "incomplete":
          filter.completionPercentage = { $lt: 100 };
          break;
        case "completed":
          filter.selfReported = true;
          filter.documentsSubmitted = true;
          filter.formFilled = true;
          break;
        case "pending":
          filter.selfReported = false;
          filter.documentsSubmitted = false;
          filter.formFilled = false;
          break;
        case "in-progress":
          filter.$expr = {
            $and: [
              {
                $gt: [
                  {
                    $add: [
                      { $cond: ["$selfReported", 1, 0] },
                      { $cond: ["$documentsSubmitted", 1, 0] },
                      { $cond: ["$formFilled", 1, 0] },
                    ],
                  },
                  0,
                ],
              },
              {
                $lt: [
                  {
                    $add: [
                      { $cond: ["$selfReported", 1, 0] },
                      { $cond: ["$documentsSubmitted", 1, 0] },
                      { $cond: ["$formFilled", 1, 0] },
                    ],
                  },
                  3,
                ],
              },
            ],
          };
          break;
        default:
          break;
      }
    }

    // Rank filter (rankMin and rankMax)
    if (req.query.rankMin || req.query.rankMax) {
      const rankMin = req.query.rankMin ? parseInt(req.query.rankMin, 10) : null;
      const rankMax = req.query.rankMax ? parseInt(req.query.rankMax, 10) : null;
      const hasMin = rankMin !== null && !Number.isNaN(rankMin);
      const hasMax = rankMax !== null && !Number.isNaN(rankMax);

      if (hasMin || hasMax) {
        filter.rank = {};
        if (hasMin) filter.rank.$gte = rankMin;
        if (hasMax) filter.rank.$lte = rankMax;
      }
    }

    // Phone filter (studentPhone or parentPhone)
    if (req.query.phone) {
      const phoneRegex = { $regex: req.query.phone, $options: "i" };
      filter.$or = [
        { studentPhone: phoneRegex },
        { parentPhone: phoneRegex },
        ...(filter.$or || []),
      ];
    }

    // Text / regex search
    const searchQuery = req.query.query || req.query.search;
    if (searchQuery) {
      const searchFilter = buildSearchQuery(searchQuery);
      if (searchFilter.$or) {
        filter.$or = searchFilter.$or;
      }
    }

    let queryChain = Student.find(filter).sort({ createdAt: -1 });
    if (!all) {
      queryChain = queryChain.skip(skip).limit(limit);
    }

    const [students, total] = await Promise.all([
      queryChain.populate("uploadedBy", "name email").lean(),
      Student.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      students,
      pagination: {
        page,
        limit: all ? total : limit,
        total,
        pages: all ? 1 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id
 * Fetch a single student with upload user info and recent audit logs.
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .lean();

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Fetch recent audit logs for this student
    const auditLogs = await AuditLog.find({ studentId: student._id })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate("updatedBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      student,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students/upload
 * Accept a file upload (.xlsx, .csv, .pdf), parse it, and bulk-insert
 * new student records.  Skips duplicates by hallTicketNumber.
 */
export const uploadStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach an xlsx, csv, or pdf file.",
      });
    }

    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    let parsedStudents;
    try {
      parsedStudents = await parseFile(filePath, mimetype);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: `File parsing failed: ${parseError.message}`,
      });
    }

    // Attempt to clean up the uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }

    if (!parsedStudents || parsedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid student records found in the uploaded file.",
      });
    }

    // ── De-duplicate against existing records ──────────────────────
    const hallTickets = parsedStudents.map((s) =>
      s.hallTicketNumber.toUpperCase(),
    );
    const existing = await Student.find({
      hallTicketNumber: { $in: hallTickets },
    })
      .select("hallTicketNumber")
      .lean();

    const existingSet = new Set(existing.map((e) => e.hallTicketNumber));

    const toInsert = [];
    const skipped = [];
    const errors = [];

    for (const record of parsedStudents) {
      const htUpper = record.hallTicketNumber.toUpperCase();
      if (existingSet.has(htUpper)) {
        skipped.push(htUpper);
        continue;
      }

      toInsert.push({
        ...record,
        hallTicketNumber: htUpper,
        uploadedBy: req.user.id,
      });
    }

    let insertedDocs = [];
    if (toInsert.length > 0) {
      try {
        insertedDocs = await Student.insertMany(toInsert, { ordered: false });
      } catch (bulkError) {
        // Some may have inserted; capture the ones that failed
        if (bulkError.insertedDocs) {
          insertedDocs = bulkError.insertedDocs;
        }
        if (bulkError.writeErrors) {
          bulkError.writeErrors.forEach((we) => {
            errors.push({
              hallTicketNumber: toInsert[we.index]?.hallTicketNumber,
              message: we.errmsg || we.message,
            });
          });
        }
      }
    }

    // Create audit logs for inserted students
    if (insertedDocs.length > 0) {
      const auditEntries = insertedDocs.map((doc) => ({
        studentId: doc._id,
        updatedBy: req.user.id,
        role: req.user.role,
        action: "STUDENT_CREATED",
        newValue: { hallTicketNumber: doc.hallTicketNumber, name: doc.name },
      }));
      await AuditLog.insertMany(auditEntries);

      // Real-time notification
      emitDashboardRefresh();
    }

    res.status(201).json({
      success: true,
      message: "File processed successfully.",
      inserted: insertedDocs.length,
      skipped: skipped.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id/status
 * Update a student's admission-step flags and/or remarks.
 */
export const updateStudentStatus = async (req, res, next) => {
  try {
    const { selfReported, documentsSubmitted, formFilled, remarks } = req.body;

    const student = await Student.findById(req.params.id);

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Capture old values for the audit trail
    const oldValue = {
      selfReported: student.selfReported,
      documentsSubmitted: student.documentsSubmitted,
      formFilled: student.formFilled,
      remarks: student.remarks,
    };

    // Apply updates (only overwrite fields that were explicitly sent)
    if (selfReported !== undefined) {
      if (selfReported) {
        if (!student.selfReported) {
          student.selfReportedAt = new Date();
          student.selfReportedBy = req.user?.name || 'Volunteer';
        } else if (!student.selfReportedAt) {
          student.selfReportedAt = student.createdAt || new Date();
          student.selfReportedBy = student.selfReportedBy || req.user?.name || 'Volunteer';
        }
      } else {
        student.selfReportedAt = null;
        student.selfReportedBy = '';
      }
      student.selfReported = selfReported;
    }

    if (documentsSubmitted !== undefined) {
      if (documentsSubmitted) {
        if (!student.documentsSubmitted) {
          student.documentsSubmittedAt = new Date();
          student.documentsSubmittedBy = req.user?.name || 'Volunteer';
        } else if (!student.documentsSubmittedAt) {
          student.documentsSubmittedAt = student.createdAt || new Date();
          student.documentsSubmittedBy = student.documentsSubmittedBy || req.user?.name || 'Volunteer';
        }
      } else {
        student.documentsSubmittedAt = null;
        student.documentsSubmittedBy = '';
      }
      student.documentsSubmitted = documentsSubmitted;
    }

    if (formFilled !== undefined) {
      if (formFilled) {
        if (!student.formFilled) {
          student.formFilledAt = new Date();
          student.formFilledBy = req.user?.name || 'Volunteer';
        } else if (!student.formFilledAt) {
          student.formFilledAt = student.createdAt || new Date();
          student.formFilledBy = student.formFilledBy || req.user?.name || 'Volunteer';
        }
      } else {
        student.formFilledAt = null;
        student.formFilledBy = '';
      }
      student.formFilled = formFilled;
    }

    if (remarks !== undefined) student.remarks = remarks;

    await student.save(); // triggers pre-save hook → completionPercentage

    const newValue = {
      selfReported: student.selfReported,
      documentsSubmitted: student.documentsSubmitted,
      formFilled: student.formFilled,
      remarks: student.remarks,
    };

    // Create audit log
    const auditLog = await AuditLog.create({
      studentId: student._id,
      updatedBy: req.user.id,
      role: req.user.role,
      action: "STATUS_UPDATE",
      oldValue,
      newValue,
    });

    // Populate audit log references before emitting
    const populatedLog = await AuditLog.findById(auditLog._id)
      .populate("studentId", "name hallTicketNumber department")
      .populate("updatedBy", "name email")
      .lean();

    // Real-time events
    emitStudentUpdate(student.toObject());
    emitDashboardRefresh();
    emitNewActivity(populatedLog);

    res.status(200).json({
      success: true,
      message: "Student status updated successfully.",
      student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/:id
 * Soft-delete a student (sets isActive = false).
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || !student.isActive) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.isActive = false;
    await student.save();

    // Audit log
    await AuditLog.create({
      studentId: student._id,
      updatedBy: req.user.id,
      role: req.user.role,
      action: "STUDENT_DELETED",
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    emitDashboardRefresh();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
