import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass dark:glass-dark rounded-xl p-3 shadow-xl border border-white/20 dark:border-primary-400/10">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

function DepartmentChart({ data = [] }) {
  const { darkMode } = useTheme();

  const chartData = data.map((dept) => ({
    name: dept.department || dept.name,
    Completed: dept.completed || 0,
    Pending: dept.pending || dept.total - (dept.completed || 0) || 0,
  }));

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Department Progress
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={{ stroke: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
              )}
            />
            <Bar
              dataKey="Completed"
              fill="url(#completedGradient)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
            />
            <Bar
              dataKey="Pending"
              fill="url(#pendingGradient)"
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
              animationBegin={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DepartmentChart;
