import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass dark:glass-dark rounded-xl p-3 shadow-xl border border-white/20 dark:border-primary-400/10">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {payload[0].value} <span className="text-xs font-normal text-gray-500">completions</span>
      </p>
    </div>
  );
};

function TrendChart({ data = [] }) {
  const { darkMode } = useTheme();

  const chartData = data.length ? data : [
    { date: 'Mon', count: 12 },
    { date: 'Tue', count: 19 },
    { date: 'Wed', count: 15 },
    { date: 'Thu', count: 25 },
    { date: 'Fri', count: 22 },
    { date: 'Sat', count: 30 },
    { date: 'Sun', count: 18 },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Completion Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={{ stroke: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#trendGradient)"
              dot={false}
              activeDot={{
                r: 6,
                fill: '#6366f1',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TrendChart;
