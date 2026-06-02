import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import StudentTable from '../components/students/StudentTable';
import StudentCard from '../components/students/StudentCard';
import StudentSearch from '../components/students/StudentSearch';
import SkeletonLoader, { SkeletonCard } from '../components/common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { getStudents, updateStudentStatus } from '../services/studentService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { STEP_LABELS } from '../utils/constants';
import { exportToExcel, exportToPDF, calculateCompletionPercentage } from '../utils/helpers';

const isStudentMatch = (student, targetId) => {
  if (!targetId || !student) return false;
  return (student._id && student._id === targetId) || (student.id && student.id === targetId);
};

function StudentsPage() {
  const { addToast } = useToast();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    department: (user?.role === 'hod' || user?.role === 'volunteer') ? user.department || '' : '',
    status: 'all',
    rankMin: '',
    rankMax: '',
    phone: '',
  });

  // Default department filter for HOD and Volunteer
  useEffect(() => {
    if ((user?.role === 'hod' || user?.role === 'volunteer') && user?.department) {
      setFilters(prev => ({ ...prev, department: user.department }));
    }
  }, [user]);

  const fetchStudents = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      if (queryParams.status === 'all') delete queryParams.status;
      if (!queryParams.department) delete queryParams.department;
      if (!queryParams.search) delete queryParams.search;

      const res = await getStudents(queryParams);
      const data = res.data;
      setStudents(data.students || data.data || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else if (data.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: Math.ceil(data.total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      addToast('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated) => {
      if (!updated) return;
      setStudents(prev =>
        prev.map(s =>
          isStudentMatch(s, updated._id || updated.id) ? { ...s, ...updated } : s
        )
      );
    };
    const handleRefresh = () => {
      fetchStudents();
    };

    socket.on('student:updated', handleUpdate);
    socket.on('dashboard:refresh', handleRefresh);

    return () => {
      socket.off('student:updated', handleUpdate);
      socket.off('dashboard:refresh', handleRefresh);
    };
  }, [socket, fetchStudents]);

  const handleSearch = (search) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (filterData) => {
    setFilters(prev => ({ ...prev, ...filterData }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = async (studentId, field, value) => {
    if (!studentId) return;
    try {
      await updateStudentStatus(studentId, { [field]: value });
      addToast('success', `${STEP_LABELS[field]} ${value ? 'completed' : 'reverted'}`);
      setStudents(prev =>
        prev.map(s =>
          isStudentMatch(s, studentId) ? { ...s, [field]: value } : s
        )
      );
    } catch (error) {
      addToast('error', 'Failed to update status');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleExportStudentsExcel = async () => {
    try {
      const queryParams = {
        ...filters,
        all: true,
      };
      if (queryParams.status === 'all') delete queryParams.status;
      if (!queryParams.department) delete queryParams.department;
      if (!queryParams.search) delete queryParams.search;

      const response = await getStudents(queryParams);
      const studentsList = response.data.students || response.data || [];
      if (studentsList.length === 0) {
        addToast('warning', 'No students found to export');
        return;
      }
      const data = studentsList.map(s => ({
        'Hall Ticket No': s.hallTicketNumber || '—',
        Name: s.name || '—',
        Department: s.department || '—',
        Rank: s.rank || '—',
        'Student Phone': s.studentPhone || '—',
        'Parent Phone': s.parentPhone || '—',
        Email: s.email || '—',
        'Self Reported': s.selfReported ? 'Yes' : 'No',
        'Docs Submitted': s.documentsSubmitted ? 'Yes' : 'No',
        'Form Filled': s.formFilled ? 'Yes' : 'No',
        'Completion %': `${s.completionPercentage !== undefined ? s.completionPercentage : calculateCompletionPercentage(s)}%`,
      }));

      let fileName = 'students-report';
      if (filters.department) fileName += `-${filters.department.toLowerCase()}`;
      if (filters.status !== 'all') fileName += `-${filters.status}`;

      exportToExcel(data, fileName);
      addToast('success', 'Student Excel report downloaded successfully');
    } catch (error) {
      console.error('Error exporting students:', error);
      addToast('error', 'Failed to export students data');
    }
  };

  const handleExportStudentsPDF = async () => {
    try {
      const queryParams = {
        ...filters,
        all: true,
      };
      if (queryParams.status === 'all') delete queryParams.status;
      if (!queryParams.department) delete queryParams.department;
      if (!queryParams.search) delete queryParams.search;

      const response = await getStudents(queryParams);
      const studentsList = response.data.students || response.data || [];
      if (studentsList.length === 0) {
        addToast('warning', 'No students found to export');
        return;
      }
      const data = studentsList.map(s => ({
        'Hall Ticket No': s.hallTicketNumber || '—',
        Name: s.name || '—',
        Department: s.department || '—',
        Rank: s.rank || '—',
        'Self Reported': s.selfReported ? 'Yes' : 'No',
        'Docs Submitted': s.documentsSubmitted ? 'Yes' : 'No',
        'Form Filled': s.formFilled ? 'Yes' : 'No',
        'Completion %': `${s.completionPercentage !== undefined ? s.completionPercentage : calculateCompletionPercentage(s)}%`,
      }));
      const columns = [
        { key: 'Hall Ticket No', header: 'Hall Ticket' },
        { key: 'Name', header: 'Name' },
        { key: 'Department', header: 'Branch' },
        { key: 'Rank', header: 'Rank' },
        { key: 'Self Reported', header: 'Self Report' },
        { key: 'Docs Submitted', header: 'Docs' },
        { key: 'Form Filled', header: 'Form' },
        { key: 'Completion %', header: 'Progress' },
      ];

      let title = 'Students Admission Status';
      if (filters.department) title += ` - ${filters.department}`;
      if (filters.status !== 'all') {
        const statusText = filters.status.charAt(0).toUpperCase() + filters.status.slice(1);
        title += ` (${statusText})`;
      }

      exportToPDF(data, columns, title);
      addToast('success', 'Student PDF report downloaded successfully');
    } catch (error) {
      console.error('Error exporting students:', error);
      addToast('error', 'Failed to export students data');
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and track all student admissions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Buttons (HOD Only) */}
          {user?.role === 'hod' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportStudentsExcel}
                title="Export Student Details (Excel)"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              <button
                onClick={handleExportStudentsPDF}
                title="Export Student Details (PDF)"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'table'
                ? 'bg-white dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'cards'
                ? 'bg-white dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <StudentSearch onSearch={handleSearch} onFilter={handleFilter} filters={filters} />
        </div>

        {/* Content */}
        {loading ? (
          viewMode === 'table' ? (
            <div className="glass-card p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonLoader key={i} variant="table-row" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )
        ) : viewMode === 'table' ? (
          <StudentTable students={students} onStatusChange={handleStatusChange} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.length > 0 ? (
              students.map(student => (
                <StudentCard
                  key={student._id || student.id}
                  student={student}
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className="col-span-full glass-card p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
              {pagination.total > 0 && ` · ${pagination.total} total students`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 7) {
                    page = i + 1;
                  } else if (pagination.page <= 4) {
                    page = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 3) {
                    page = pagination.totalPages - 6 + i;
                  } else {
                    page = pagination.page - 3 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${pagination.page === page
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export default StudentsPage;
