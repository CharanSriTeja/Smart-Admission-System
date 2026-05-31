import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User, Activity } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  upload: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  login: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function AuditLogTable({ logs = [], pagination, onPageChange }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const getActionColor = (action) => {
    const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
    return ACTION_COLORS[key] || ACTION_COLORS.default;
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (!logs.length) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No audit logs found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-primary-400/10">
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Timestamp</span>
                </th>
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</span>
                </th>
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</span>
                </th>
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</span>
                </th>
                <th className="text-left px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Changes</span>
                </th>
                <th className="w-12 px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-primary-400/5">
              {logs.map((log, index) => {
                const id = log._id || log.id || index;
                const isExpanded = expandedRow === id;
                return (
                  <React.Fragment key={id}>
                    <tr className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(log.createdAt || log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(log.user?.name || log.userName || 'S')?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {log.user?.name || log.userName || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {log.student?.name || log.studentName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          {log.oldValue !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through">
                              {String(log.oldValue)}
                            </span>
                          )}
                          {log.oldValue !== undefined && <span className="text-gray-400">→</span>}
                          {log.newValue !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                              {String(log.newValue)}
                            </span>
                          )}
                          {log.oldValue === undefined && log.newValue === undefined && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/50 dark:bg-primary-950/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="animate-slide-down pl-8 space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Field:</span> {log.field || log.action || '—'}
                            </p>
                            {log.details && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Details:</span> {log.details}
                              </p>
                            )}
                            {log.ipAddress && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium">IP:</span> {log.ipAddress}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pagination.page === page
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogTable;
