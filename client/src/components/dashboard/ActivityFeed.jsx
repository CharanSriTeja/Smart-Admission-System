import React, { useEffect, useRef } from 'react';
import { UserCheck, FileText, FilePlus, Activity } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';

const ACTION_ICONS = {
  selfReported: { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  documentsSubmitted: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  formFilled: { icon: FilePlus, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  default: { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800/30' },
};

function ActivityFeed({ activities = [] }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities]);

  const getActionConfig = (action) => {
    if (action?.includes('selfReport')) return ACTION_ICONS.selfReported;
    if (action?.includes('document')) return ACTION_ICONS.documentsSubmitted;
    if (action?.includes('form')) return ACTION_ICONS.formFilled;
    return ACTION_ICONS.default;
  };

  const getActionMessage = (activity) => {
    if (activity.message || activity.description) {
      return activity.message || activity.description;
    }
    const studentName = activity.studentId?.name || activity.studentName || 'a student';
    if (activity.action === 'STUDENT_CREATED') {
      return `registered new student ${studentName}`;
    }
    if (activity.action === 'STUDENT_DELETED') {
      return `removed student ${studentName}`;
    }
    if (activity.action === 'STATUS_UPDATE') {
      const updates = [];
      const oldVal = activity.oldValue || {};
      const newVal = activity.newValue || {};
      
      if (newVal.selfReported !== oldVal.selfReported) {
        updates.push(newVal.selfReported ? 'completed Self Reporting' : 'reverted Self Reporting');
      }
      if (newVal.documentsSubmitted !== oldVal.documentsSubmitted) {
        updates.push(newVal.documentsSubmitted ? 'submitted Documents' : 'reverted Documents');
      }
      if (newVal.formFilled !== oldVal.formFilled) {
        updates.push(newVal.formFilled ? 'completed Form' : 'reverted Form');
      }
      if (updates.length > 0) {
        return `${updates.join(', ')} for ${studentName}`;
      }
      return `updated status for ${studentName}`;
    }
    return `updated student ${studentName}`;
  };

  if (!activities.length) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          Recent Activity
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
          <Activity className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-500" />
        Recent Activity
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-normal text-gray-400">Live</span>
        </span>
      </h3>
      <div ref={feedRef} className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {activities.map((activity, index) => {
          const config = getActionConfig(activity.action || activity.type);
          const Icon = config.icon;
          return (
            <div
              key={activity._id || activity.id || index}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  <span className="font-semibold">
                    {activity.updatedBy?.name || activity.user?.name || activity.userName || 'System'}
                  </span>
                  {' '}
                  <span className="text-gray-500 dark:text-gray-400">
                    {getActionMessage(activity)}
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {timeAgo(activity.createdAt || activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityFeed;
