import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Calendar, Download, Filter } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import AuditLogTable from '../components/audit/AuditLogTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { getLogs } from '../services/logService';
import { exportToExcel, exportToPDF } from '../utils/helpers';

function AuditLogsPage() {
  const { addToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    user: '',
    student: '',
    startDate: '',
    endDate: '',
    action: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.user) params.user = filters.user;
      if (filters.student) params.student = filters.student;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.action) params.action = filters.action;

      const res = await getLogs(params);
      const data = res.data;
      setLogs(data.logs || data.data || []);
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          totalPages: data.pagination.pages || data.pagination.totalPages || Math.ceil(data.pagination.total / data.pagination.limit),
        }));
      } else if (data.total !== undefined) {
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: Math.ceil(data.total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      addToast('error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    if (logs.length === 0) {
      addToast('warning', 'No data to export');
      return;
    }
    const data = logs.map(log => {
      const studentName = log.studentId?.name || log.student?.name || log.studentName || '';
      const ht = log.studentId?.hallTicketNumber || '';
      const studentText = ht ? `${studentName} (${ht})` : studentName;
      return {
        Timestamp: log.createdAt || log.timestamp,
        User: log.updatedBy?.name || log.user?.name || log.userName || 'System',
        Action: log.action || '',
        Student: studentText,
        Field: log.field || log.action || '',
        'Old Value': log.oldValue !== undefined && log.oldValue !== null ? JSON.stringify(log.oldValue) : '',
        'New Value': log.newValue !== undefined && log.newValue !== null ? JSON.stringify(log.newValue) : '',
      };
    });
    exportToExcel(data, 'audit-logs');
    addToast('success', 'Audit logs exported successfully');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all changes and actions in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-400/20 dark:text-primary-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card p-4 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                User
              </label>
              <input
                type="text"
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                placeholder="Filter by user..."
                className="glass-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Student / Hall Ticket
              </label>
              <input
                type="text"
                value={filters.student}
                onChange={(e) => handleFilterChange('student', e.target.value)}
                placeholder="Name or Hall Ticket..."
                className="glass-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="glass-input w-full text-sm"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="upload">Upload</option>
                <option value="login">Login</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="glass-input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="glass-input w-full text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading audit logs..." />
      ) : (
        <AuditLogTable
          logs={logs}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </DashboardLayout>
  );
}

export default AuditLogsPage;
