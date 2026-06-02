/**
 * @fileoverview Dashboard controller.
 * Provides aggregate statistics and per-department progress data
 * for the HOD dashboard view.
 */

import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';

/**
 * GET /api/dashboard/stats
 * Return overall admission statistics (scoped to the HOD's department
 * by default, or all departments).
 */
export const getStats = async (req, res, next) => {
  try {
    const baseFilter = { isActive: true };

    // Optionally scope to the HOD's department
    if (req.query.department) {
      baseFilter.department = req.query.department;
    }

    // ── Aggregate counts ──────────────────────────────────────────
    const [
      totalStudents,
      completedStudents,
      pendingStudents,
      selfReportedCount,
      documentsSubmittedCount,
      formFilledCount,
      todayCount,
    ] = await Promise.all([
      Student.countDocuments(baseFilter),
      Student.countDocuments({
        ...baseFilter,
        selfReported: true,
        documentsSubmitted: true,
        formFilled: true,
      }),
      Student.countDocuments({
        ...baseFilter,
        selfReported: false,
        documentsSubmitted: false,
        formFilled: false,
      }),
      Student.countDocuments({ ...baseFilter, selfReported: true }),
      Student.countDocuments({ ...baseFilter, documentsSubmitted: true }),
      Student.countDocuments({ ...baseFilter, formFilled: true }),
      (() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return Student.countDocuments({
          ...baseFilter,
          completedAt: { $gte: startOfDay },
        });
      })(),
    ]);

    const inProgressStudents = totalStudents - completedStudents - pendingStudents;

    // ── Completion Trend (last 7 days) ──────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendMatch = {
      isActive: true,
      completedAt: { $gte: sevenDaysAgo }
    };
    if (req.query.department) {
      trendMatch.department = req.query.department;
    }

    const trend = await Student.aggregate([
      {
        $match: trendMatch
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = new Map(trend.map(t => [t._id, t.count]));
    const trendData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = weekdayNames[d.getDay()];
      trendData.push({
        date: dayName,
        count: trendMap.get(dateStr) || 0
      });
    }

    // ── Total College Students (unscoped) ──────────────────────────
    const totalCollegeStudents = await Student.countDocuments({ isActive: true });

    // ── Recent activity ───────────────────────────────────────────
    let logFilter = {};
    if (req.query.department) {
      const studentIds = await Student.find({ department: req.query.department }).distinct('_id');
      logFilter.studentId = { $in: studentIds };
    }

    const recentActivity = await AuditLog.find(logFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('studentId', 'name hallTicketNumber department')
      .populate('updatedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        completedStudents,
        pendingStudents,
        inProgressStudents,
        selfReportedCount,
        documentsSubmittedCount,
        formFilledCount,
        todayCount,
        trendData,
        totalCollegeStudents,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/department-progress
 * Return per-department completion breakdown sorted alphabetically.
 */
export const getDepartmentProgress = async (req, res, next) => {
  try {
    const progress = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$selfReported', true] },
                    { $eq: ['$documentsSubmitted', true] },
                    { $eq: ['$formFilled', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$selfReported', false] },
                    { $eq: ['$documentsSubmitted', false] },
                    { $eq: ['$formFilled', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          total: 1,
          completed: 1,
          pending: 1,
          inProgress: { $subtract: ['$total', { $add: ['$completed', '$pending'] }] },
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { department: 1 } },
    ]);

    res.status(200).json({
      success: true,
      departments: progress,
    });
  } catch (error) {
    next(error);
  }
};
